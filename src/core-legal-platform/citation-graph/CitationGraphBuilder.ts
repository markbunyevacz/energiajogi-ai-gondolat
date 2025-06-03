import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessor } from '@/lib/documentProcessor';
import { embeddingService } from '@/services/document/embeddingService';
import { confidenceCalculator } from '@/services/document/confidenceCalculator';
import type { CitationNode as DBCitationNode, CitationEdge as DBCitationEdge } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CitationRelationship, 
  Domain, 
  ImpactChain, 
  CitationNode, 
  CitationType,
  ProcessedDocument 
} from './types';
import { CitationExtractor } from './CitationExtractor';
import { CitationError } from './errors';
import { DocumentMetadata } from '@/lib/claude';

interface GraphNode {
  id: string;
  document: ProcessedDocument;
  incomingCitations: CitationRelationship[];
  outgoingCitations: CitationRelationship[];
}

/**
 * CitationGraphBuilder is responsible for building and managing the citation graph
 * of legal documents. It handles both explicit and implicit citations, and provides
 * methods for analyzing document impact and finding citation chains.
 */
export class CitationGraphBuilder {
  private static readonly SEMANTIC_SIMILARITY_THRESHOLD = 0.85;
  private static readonly CONFIDENCE_THRESHOLD = 0.7;

  private readonly citationExtractor: CitationExtractor;
  private graph: Map<string, GraphNode>;

  /**
   * Creates a new CitationGraphBuilder instance.
   * @param supabase - The Supabase client instance
   * @param openAiApiKey - The OpenAI API key for semantic analysis
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly openAiApiKey: string
  ) {
    this.citationExtractor = new CitationExtractor(supabase, openAiApiKey);
    this.graph = new Map();
  }

  /**
   * Builds a citation graph from a set of processed documents.
   * @param documents - Array of processed documents to build the graph from
   * @throws {CitationError} If graph building fails
   */
  public async buildGraph(documents: ProcessedDocument[]): Promise<void> {
    try {
      // Clear existing graph
      this.graph.clear();

      // Create nodes for all documents
      for (const doc of documents) {
        this.graph.set(doc.id, {
          id: doc.id,
          document: doc,
          incomingCitations: [],
          outgoingCitations: []
        });
      }

      // Extract citations and build relationships
      for (const doc of documents) {
        const citations = await this.citationExtractor.extractCitations(doc);
        
        for (const citation of citations) {
          const sourceNode = this.graph.get(citation.source_document_id);
          const targetNode = this.graph.get(citation.target_document_id);

          if (sourceNode && targetNode) {
            sourceNode.outgoingCitations.push(citation);
            targetNode.incomingCitations.push(citation);
          }
        }
      }

      // Store citation relationships in Supabase
      await this.storeCitations(documents);
    } catch (error) {
      throw new CitationError(
        'Failed to build citation graph',
        'GRAPH_BUILD_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Stores citation relationships in the database.
   * @param documents - Array of processed documents
   * @throws {CitationError} If storage fails
   */
  private async storeCitations(documents: ProcessedDocument[]): Promise<void> {
    try {
      const citations = Array.from(this.graph.values())
        .flatMap(node => node.outgoingCitations)
        .map(citation => ({
          ...citation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            domain: citation.metadata.domain,
            confidence: citation.metadata.confidence,
            context: citation.metadata.context,
            lastVerified: new Date().toISOString()
          }
        }));

      const { error } = await this.supabase
        .from('citation_relationships')
        .upsert(citations, {
          onConflict: 'id'
        });

      if (error) throw error;

      // Create indexes for performance
      await this.supabase.rpc('create_citation_indexes');
    } catch (error) {
      throw new CitationError(
        'Failed to store citations',
        'STORAGE_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Finds impact chains when a law changes.
   * @param sourceDocumentId - ID of the source document
   * @param maxDepth - Maximum depth of impact chain
   * @param minConfidence - Minimum confidence score for citations
   * @returns Impact chain showing affected documents
   * @throws {CitationError} If impact chain analysis fails
   */
  public async findImpactChains(
    sourceDocumentId: string,
    maxDepth: number = 3,
    minConfidence: number = 0.7
  ): Promise<ImpactChain> {
    try {
      const visited = new Set<string>();
      const impactChain: ImpactChain = {
        sourceDocument: sourceDocumentId,
        affectedDocuments: []
      };

      const traverse = async (
        currentId: string,
        path: string[],
        depth: number
      ) => {
        if (depth > maxDepth || visited.has(currentId)) return;
        visited.add(currentId);

        const node = this.graph.get(currentId);
        if (!node) return;

        for (const citation of node.outgoingCitations) {
          if (citation.confidence_score < minConfidence) continue;

          const newPath = [...path, citation.target_document_id];
          impactChain.affectedDocuments.push({
            documentId: citation.target_document_id,
            path: newPath,
            confidence: citation.confidence_score
          });

          await traverse(citation.target_document_id, newPath, depth + 1);
        }
      };

      await traverse(sourceDocumentId, [], 0);
      return impactChain;
    } catch (error) {
      throw new CitationError(
        'Failed to find impact chains',
        'IMPACT_CHAIN_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Gets all documents that cite a specific document.
   * @param documentId - ID of the document to find citations for
   * @returns Array of citing documents
   * @throws {CitationError} If query fails
   */
  public async getCitingDocuments(documentId: string): Promise<CitationNode[]> {
    try {
      const { data: edges, error } = await this.supabase
        .from('citation_relationships')
        .select('source_document_id')
        .eq('target_document_id', documentId);

      if (error) throw error;

      return edges
        .map(edge => this.graph.get(edge.source_document_id)?.document)
        .filter((node): node is ProcessedDocument => node !== undefined)
        .map(doc => ({
          id: doc.id,
          documentId: doc.metadata.title,
          title: doc.metadata.title,
          type: doc.metadata.documentType,
          date: doc.metadata.date,
          content: doc.content,
          metadata: doc.metadata
        }));
    } catch (error) {
      throw new CitationError(
        'Failed to get citing documents',
        'QUERY_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Gets all documents cited by a specific document.
   * @param documentId - ID of the document to find citations for
   * @returns Array of cited documents
   * @throws {CitationError} If query fails
   */
  public async getCitedDocuments(documentId: string): Promise<CitationNode[]> {
    try {
      const { data: edges, error } = await this.supabase
        .from('citation_relationships')
        .select('target_document_id')
        .eq('source_document_id', documentId);

      if (error) throw error;

      return edges
        .map(edge => this.graph.get(edge.target_document_id)?.document)
        .filter((node): node is ProcessedDocument => node !== undefined)
        .map(doc => ({
          id: doc.id,
          documentId: doc.metadata.title,
          title: doc.metadata.title,
          type: doc.metadata.documentType,
          date: doc.metadata.date,
          content: doc.content,
          metadata: doc.metadata
        }));
    } catch (error) {
      throw new CitationError(
        'Failed to get cited documents',
        'QUERY_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Gets the impact of a document on other documents.
   * @param documentId - ID of the document to analyze
   * @param domain - Domain of the document
   * @returns Impact analysis results
   * @throws {CitationError} If analysis fails
   */
  public async getDocumentImpact(
    documentId: string,
    domain: Domain
  ): Promise<{
    incomingCount: number;
    outgoingCount: number;
    topCitedDocuments: Array<{ id: string; count: number }>;
  }> {
    try {
      const node = this.graph.get(documentId);
      if (!node) {
        throw new CitationError(
          'Document not found in graph',
          'DOCUMENT_NOT_FOUND',
          'error',
          true
        );
      }

      const citationCounts = new Map<string, number>();
      for (const citation of node.incomingCitations) {
        const count = citationCounts.get(citation.source_document_id) || 0;
        citationCounts.set(citation.source_document_id, count + 1);
      }

      const topCited = Array.from(citationCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        incomingCount: node.incomingCitations.length,
        outgoingCount: node.outgoingCitations.length,
        topCitedDocuments: topCited
      };
    } catch (error) {
      throw new CitationError(
        'Failed to get document impact',
        'IMPACT_ANALYSIS_FAILED',
        'error',
        true,
        { error }
      );
    }
  }
} 