import { supabase } from '../../integrations/supabase/client';
import { DocumentProcessor } from '../../lib/documentProcessor';
import { embeddingService } from '../../services/document/embeddingService';
import { confidenceCalculator } from '../../services/document/confidenceCalculator';
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
import { Document } from '../document-processing/Document';
import { EmbeddingService } from '../embedding/EmbeddingService';
import { LegalDocument } from '../../models/legal-document';
import { LegalCitationParser } from '../../lib/legal-citation-parser';

interface GraphNode {
  id: string;
  document: ProcessedDocument;
  incomingCitations: CitationRelationship[];
  outgoingCitations: CitationRelationship[];
}

type EdgeType = 'explicit' | 'implicit';

interface CitationEdge {
  source: string;
  target: string;
  citationType: EdgeType;
}

export type Citation = {
  citing_document_id: string;
  cited_document_id: string;
  type: 'explicit' | 'implicit';
  context?: string;
};

/**
 * CitationGraphBuilder is responsible for building and managing the citation graph
 * of legal documents. It handles both explicit and implicit citations, and provides
 * methods for analyzing document impact and finding citation chains.
 */
export class CitationGraphBuilder {
  private static readonly SEMANTIC_SIMILARITY_THRESHOLD = 0.85;
  private static readonly CONFIDENCE_THRESHOLD = 0.7;

  private readonly citationExtractor: CitationExtractor;
  private graph: Map<string, Set<CitationEdge>> = new Map();
  private documents: Map<string, Document> = new Map();
  private embeddingService: EmbeddingService;
  private processor: DocumentProcessor<LegalDocument>;
  private supabase: SupabaseClient;
  private citationParser: LegalCitationParser;

  /**
   * Creates a new CitationGraphBuilder instance.
   * @param supabase - The Supabase client instance
   * @param openAiApiKey - The OpenAI API key for semantic analysis
   */
  constructor(
    processor: DocumentProcessor<LegalDocument>,
    embeddingService: EmbeddingService,
    supabase: SupabaseClient
  ) {
    this.processor = processor;
    this.embeddingService = embeddingService;
    this.supabase = supabase;
    this.citationParser = new LegalCitationParser();
  }

  /**
   * Builds a citation graph from a set of processed documents.
   * @param documents - Array of processed documents to build the graph from
   * @throws {CitationError} If graph building fails
   */
  public async buildGraph(documents: Document[]): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Store documents for reference
      documents.forEach(doc => this.documents.set(doc.id, doc));
      
      // Initialize graph nodes
      documents.forEach(doc => this.graph.set(doc.id, new Set()));

      // Process explicit citations
      for (const doc of documents) {
        const citations = this.extractExplicitCitations(doc.content, doc.metadata.jurisdiction);
        for (const citation of citations) {
          const targetDoc = this.findDocumentByCitation(citation);
          if (targetDoc) {
            this.addEdge(doc.id, targetDoc.id, 'explicit');
          }
        }
      }

      // Process implicit citations
      console.time('ImplicitCitationProcessing');
      await this.processImplicitCitations(documents);
      console.timeEnd('ImplicitCitationProcessing');

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
  private async storeCitations(documents: Document[]): Promise<void> {
    try {
      const edges: any[] = [];
      for (const [source, targets] of this.graph) {
        for (const { target, citationType } of targets) {
          edges.push({
            source_document: source,
            target_document: target,
            citation_type: citationType,
            created_at: new Date().toISOString()
          });
        }
      }

      const { error } = await this.supabase
        .from('citation_graph')
        .insert(edges);

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
    maxDepth: number = 3
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

        for (const edge of node) {
          const newPath = [...path, edge.target];
          impactChain.affectedDocuments.push({
            documentId: edge.target,
            path: newPath,
            confidence: 1.0
          });

          await traverse(edge.target, newPath, depth + 1);
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
        .map(edge => this.documents.get(edge.source_document_id))
        .filter((doc): doc is Document => doc !== undefined)
        .map(doc => this.mapToCitationNode(doc));
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
        .map(edge => this.documents.get(edge.target_document_id))
        .filter((doc): doc is Document => doc !== undefined)
        .map(doc => this.mapToCitationNode(doc));
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
      for (const edge of node) {
        const count = citationCounts.get(edge.target) || 0;
        citationCounts.set(edge.target, count + 1);
      }

      const topCited = Array.from(citationCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        incomingCount: node.size,
        outgoingCount: node.size,
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

  private extractExplicitCitations(content: string, jurisdiction: string): string[] {
    return this.citationParser.extractCitations(content, {
      jurisdiction,
      types: ['case', 'statute', 'regulation']
    }).map(c => c.normalized);
  }

  private findDocumentByCitation(citation: string): Document | null {
    for (const doc of this.documents.values()) {
      if (doc.metadata.citation === citation) {
        return doc;
      }
    }
    return null;
  }

  private async processImplicitCitations(documents: Document[]) {
    for (const doc of documents) {
      if (!doc.embedding) continue;
      
      const similarDocs = await this.embeddingService.findSimilarDocuments(
        doc.embedding,
        0.7,
        10
      );
      
      for (const similarDoc of similarDocs) {
        if (doc.id !== similarDoc.id) {
          this.addEdge(doc.id, similarDoc.id, 'implicit');
        }
      }
    }
  }

  private addEdge(source: string, target: string, type: EdgeType) {
    if (!this.graph.has(source)) {
      this.graph.set(source, new Set());
    }
    this.graph.get(source)!.add({ source, target, citationType: type });
  }

  public async getImpactChain(
    sourceDocId: string,
    maxDepth: number = 5
  ): Promise<string[]> {
    const visited = new Set<string>();
    const impactChain: string[] = [];
    const queue: { id: string; depth: number }[] = [{ id: sourceDocId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (visited.has(id) || depth > maxDepth) continue;
      
      visited.add(id);
      impactChain.push(id);
      
      const { data: edges } = await this.supabase
        .from('citation_edges')
        .select('target')
        .eq('source', id);
      
      for (const edge of edges || []) {
        if (!visited.has(edge.target)) {
          queue.push({ id: edge.target, depth: depth + 1 });
        }
      }
    }

    return impactChain;
  }

  // Find implicit citations via semantic similarity
  async findImplicitCitations(doc: LegalDocument): Promise<string[]> {
    const embedding = await this.embeddingService.getDocumentEmbedding(doc.id);
    const threshold = this.getSimilarityThreshold(doc.domain);
    
    return (await this.embeddingService.findSimilarDocuments(
      embedding,
      threshold,
      10
    )).map(d => d.id).filter(id => id !== doc.id);
  }

  private mapToCitationNode(doc: Document): CitationNode {
    return {
      id: doc.id,
      documentId: doc.id,
      title: doc.metadata.title || 'Untitled',
      type: doc.metadata.documentType || 'other',
      date: doc.metadata.date || new Date().toISOString(),
      content: doc.content,
      metadata: {
        ...doc.metadata,
        references: doc.metadata.references || [],
        legalAreas: doc.metadata.legalAreas || [],
        source: doc.metadata.source || 'Unknown',
        documentType: doc.metadata.documentType || 'other'
      }
    };
  }

  async buildGraphForDocument(doc: LegalDocument): Promise<CitationEdge[]> {
    const content = await this.processor.extractText(doc);
    const explicitCitations = this.extractExplicitCitations(content, doc.jurisdiction);
    const implicitCitations = await this.findImplicitCitations(doc);
    
    const edges: CitationEdge[] = [
      ...explicitCitations.map(target => ({
        source: doc.id,
        target,
        citationType: 'explicit' as const
      })),
      ...implicitCitations.map(target => ({
        source: doc.id,
        target,
        citationType: 'implicit' as const
      }))
    ];

    await this.persistEdges(edges);
    return edges;
  }

  private getSimilarityThreshold(domain: Domain): number {
    const thresholds: Record<Domain, number> = {
      'energy': 0.82,
      'tax': 0.85,
      'labor': 0.80,
      'general': 0.75
    };
    return thresholds[domain] || 0.80;
  }

  private async persistEdges(edges: CitationEdge[]) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < edges.length; i += BATCH_SIZE) {
      const batch = edges.slice(i, i + BATCH_SIZE);
      const { error } = await this.supabase
        .from('citation_edges')
        .insert(batch);
      
      if (error) throw new Error(`Batch insert failed: ${error.message}`);
    }
  }
} 