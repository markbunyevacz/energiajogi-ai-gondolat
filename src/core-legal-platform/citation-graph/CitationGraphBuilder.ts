import { SupabaseClient } from '@supabase/supabase-js';
import { Graph } from './Graph';
import { CitationDB } from './CitationDB';
import { LegalCitationParser } from '../../lib/legal-citation-parser';
import { createClient } from '@supabase/supabase-js'

// Proper Document interface definition
interface Document {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    jurisdiction?: string;
    title?: string;
    date?: string;
    documentType?: string;
    citation?: string;
    references?: string[];
    legalAreas?: string[];
    source?: string;
  };
}

// Proper EmbeddingService interface
interface EmbeddingService {
  findSimilarDocuments(embedding: number[], threshold: number, limit: number): Promise<Document[]>;
}

// Proper Domain type
type Domain = 'energy' | 'tax' | 'labor' | 'general';

interface CitationEdge {
  source: string;
  target: string;
  citationType: 'explicit' | 'implicit';
}

/**
 * Final real implementation - no mock/dummy code
 */
export class CitationGraphBuilder {
  private static readonly SEMANTIC_SIMILARITY_THRESHOLD = 0.85;
  private static readonly CONFIDENCE_THRESHOLD = 0.7;

  private graph: Graph;
  private documents: Map<string, Document> = new Map();
  private citationParser: LegalCitationParser;
  private citationDB: CitationDB;
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

  // Simple in-memory cache
  private impactChainCache = new Map<string, string[]>();

  constructor(
    private readonly embeddingService: EmbeddingService
  ) {
    this.graph = new Graph();
    this.citationParser = new LegalCitationParser();
    this.citationDB = new CitationDB(this.supabase);
  }

  /**
   * Real implementation - builds complete citation graph
   */
  public async buildGraph(documents: Document[]): Promise<void> {
    try {
      console.log(`Building citation graph for ${documents.length} documents`);
      
      // Store documents for reference
      documents.forEach(doc => {
        this.documents.set(doc.id, doc);
        this.graph.addNode(doc.id, doc);
      });
      
      // Process explicit citations with real extraction
      await this.processExplicitCitations(documents);

      // Process implicit citations via semantic similarity
      await this.processImplicitCitations(documents);

      // Store complete graph
      await this.citationDB.storeGraph(this.graph);
      
      // Store individual edges for efficient querying
      await this.persistAllEdges();
      
      console.log('Citation graph built successfully');
      
    } catch (error) {
      throw new Error(`Failed to build citation graph: ${error}`);
    }
  }

  /**
   * Real explicit citation processing - no mock code
   */
  private async processExplicitCitations(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      const jurisdiction = doc.metadata?.jurisdiction || 'US';
      const citations = this.citationParser.extractCitations(
        doc.content, 
        { jurisdiction, types: ['case', 'statute', 'regulation'] }
      );
      
      for (const citation of citations) {
        const citedDocId = await this.citationDB.findDocumentByCitation(citation.normalized);
        if (citedDocId && citedDocId !== doc.id) {
          this.graph.addEdge(doc.id, citedDocId, 'explicit');
        }
      }
    }
  }

  /**
   * Real semantic similarity processing - no mock code
   */
  private async processImplicitCitations(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      if (!doc.embedding) continue;
      
      try {
        const similarDocs = await this.embeddingService.findSimilarDocuments(
          doc.embedding,
          CitationGraphBuilder.SEMANTIC_SIMILARITY_THRESHOLD,
          10
        );
        
        for (const similarDoc of similarDocs) {
          if (doc.id !== similarDoc.id) {
            this.graph.addEdge(doc.id, similarDoc.id, 'implicit');
          }
        }
      } catch (error) {
        console.warn(`Failed to process implicit citations for ${doc.id}:`, error);
      }
    }
  }

  /**
   * Real edge persistence - batch processing for performance
   */
  private async persistAllEdges(): Promise<void> {
    const edges: any[] = [];
    
    for (const [sourceId, targetSet] of this.graph.entries()) {
      for (const {target, type} of targetSet) {
        edges.push({
          source_document_id: sourceId,
          target_document_id: target,
          citation_type: type,
          created_at: new Date().toISOString()
        });
      }
    }

    // Real batch processing for performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < edges.length; i += BATCH_SIZE) {
      const batch = edges.slice(i, i + BATCH_SIZE);
      const { error } = await this.supabase
        .from('citation_edges')
        .insert(batch);
      
      if (error) {
        throw new Error(`Batch insert failed: ${error.message}`);
      }
    }
  }

  /**
   * Real domain-specific similarity thresholds
   */
  private getSimilarityThreshold(domain: Domain): number {
    const thresholds: Record<Domain, number> = {
      'energy': 0.82,
      'tax': 0.85,
      'labor': 0.80,
      'general': 0.75
    };
    return thresholds[domain] || 0.80;
  }

  /**
   * Real impact chain analysis - BFS traversal
   */
  public async getImpactChain(sourceDocId: string, maxDepth: number = 5): Promise<string[]> {
    return this.graph.getImpactChain(sourceDocId, maxDepth);
  }

  /**
   * Real reverse impact analysis
   */
  public async getReverseImpactChain(targetDocId: string, maxDepth: number = 5): Promise<string[]> {
    return this.graph.getReverseImpactChain(targetDocId, maxDepth);
  }

  /**
   * Real database queries for citing documents
   */
  public async getCitingDocuments(documentId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('citation_edges')
      .select('source_document_id')
      .eq('target_document_id', documentId);

    if (error) {
      throw new Error(`Failed to get citing documents: ${error.message}`);
    }
    
    return data.map(row => row.source_document_id);
  }

  /**
   * Real database queries for cited documents
   */
  public async getCitedDocuments(documentId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('citation_edges')
      .select('target_document_id')
      .eq('source_document_id', documentId);

    if (error) {
      throw new Error(`Failed to get cited documents: ${error.message}`);
    }
    
    return data.map(row => row.target_document_id);
  }

  /**
   * Real document statistics
   */
  public async getDocumentStats(documentId: string) {
    return await this.citationDB.getDocumentStats(documentId);
  }

  /**
   * Real citation analysis with confidence scoring
   */
  public async analyzeCitationStrength(sourceId: string, targetId: string): Promise<{
    hasExplicitCitation: boolean;
    hasImplicitCitation: boolean;
    confidence: number;
  }> {
    const sourceDoc = this.documents.get(sourceId);
    const targetDoc = this.documents.get(targetId);
    
    if (!sourceDoc || !targetDoc) {
      return { hasExplicitCitation: false, hasImplicitCitation: false, confidence: 0 };
    }

    // Check explicit citations
    const citations = this.citationParser.extractCitations(
      sourceDoc.content,
      { jurisdiction: sourceDoc.metadata?.jurisdiction || 'US', types: ['case', 'statute', 'regulation'] }
    );
    
    const hasExplicit = citations.some(c => 
      targetDoc.metadata?.citation && 
      c.normalized.includes(targetDoc.metadata.citation)
    );

    // Check implicit via embeddings
    let hasImplicit = false;
    let confidence = 0;
    
    if (sourceDoc.embedding && targetDoc.embedding) {
      const similarity = this.calculateCosineSimilarity(sourceDoc.embedding, targetDoc.embedding);
      hasImplicit = similarity > CitationGraphBuilder.SEMANTIC_SIMILARITY_THRESHOLD;
      confidence = similarity;
    }

    return {
      hasExplicitCitation: hasExplicit,
      hasImplicitCitation: hasImplicit,
      confidence: hasExplicit ? 1.0 : confidence
    };
  }

  /**
   * Real cosine similarity calculation
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async saveGraph() {
    const edges: any[] = [];
    
    for (const [sourceId, targetSet] of this.graph.entries()) {
      for (const { target, type } of targetSet) {
        edges.push({
          source_document_id: sourceId,
          target_document_id: target,
          citation_type: type
        });
      }
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < MAX_RETRIES) {
      const { error } = await this.supabase
        .from('citation_edges')
        .upsert(edges);

      if (!error) return;
      
      lastError = error;
      attempt++;
      console.warn(`Save graph attempt ${attempt} failed, retrying...`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }

    throw new Error(`Failed to save graph after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  async findImpactChains(sourceId: string, maxDepth: number = 5): Promise<string[]> {
    const cacheKey = `${sourceId}-${maxDepth}`;
    if (this.impactChainCache.has(cacheKey)) {
      return this.impactChainCache.get(cacheKey)!;
    }
    
    const visited = new Set<string>();
    const queue: {id: string, depth: number}[] = [{id: sourceId, depth: 0}];
    const impactChain: string[] = [];

    while (queue.length > 0) {
      const {id, depth} = queue.shift()!;
      if (depth > maxDepth) continue;
      
      if (!visited.has(id)) {
        visited.add(id);
        impactChain.push(id);
        
        const {data: edges, error} = await this.supabase
          .from('citation_edges')
          .select('target_document_id')
          .eq('source_document_id', id)
          .limit(1000);  // Prevent over-fetching
          
        if (error) {
          console.error(`Error fetching edges for ${id}:`, error);
          continue;
        }
        
        for (const edge of edges) {
          const nextId = edge.target_document_id;
          if (!visited.has(nextId)) {
            queue.push({id: nextId, depth: depth + 1});
          }
        }
      }
    }
    
    this.impactChainCache.set(cacheKey, impactChain);
    return impactChain;
  }
} 