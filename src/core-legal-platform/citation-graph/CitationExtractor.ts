import { ProcessedDocument, CitationRelationship, Domain } from './types';
import { CitationError } from './errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { DomainPatternManager } from './DomainPatternManager';
import { RateLimiter } from '@/lib/rateLimiter';
import { Document } from '@langchain/core/documents';

/**
 * CitationExtractor is responsible for extracting both explicit and implicit citations
 * from legal documents. It uses pattern matching for explicit citations and semantic
 * similarity for implicit citations.
 */
export class CitationExtractor {
  private readonly embeddings: OpenAIEmbeddings;
  private readonly vectorStore: SupabaseVectorStore;
  private readonly patternManager: DomainPatternManager;
  private readonly rateLimiter: RateLimiter;

  /**
   * Creates a new CitationExtractor instance.
   * @param supabase - The Supabase client instance
   * @param openAiApiKey - The OpenAI API key for semantic analysis
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly openAiApiKey: string
  ) {
    this.embeddings = new OpenAIEmbeddings({ 
      openAIApiKey: this.openAiApiKey,
      maxRetries: 3,
      timeout: 30000
    });
    this.vectorStore = new SupabaseVectorStore(this.embeddings, {
      client: this.supabase,
      tableName: 'document_embeddings',
      queryName: 'match_documents'
    });
    this.patternManager = new DomainPatternManager(supabase);
    this.rateLimiter = new RateLimiter({
      maxRequests: 50,
      timeWindow: 60000 // 1 minute
    });
  }

  /**
   * Extracts both explicit and implicit citations from a document.
   * @param document - The document to extract citations from
   * @returns Array of citation relationships
   * @throws {CitationError} If extraction fails
   */
  async extractCitations(document: ProcessedDocument): Promise<CitationRelationship[]> {
    try {
      const [explicitCitations, implicitCitations] = await Promise.all([
        this.extractExplicitCitations(document),
        this.extractImplicitCitations(document)
      ]);
      
      return [...explicitCitations, ...implicitCitations];
    } catch (error) {
      throw new CitationError(
        'Failed to extract citations',
        'EXTRACTION_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Extracts explicit citations using pattern matching.
   * @param document - The document to extract citations from
   * @returns Array of explicit citation relationships
   * @throws {CitationError} If pattern matching fails
   */
  private async extractExplicitCitations(document: ProcessedDocument): Promise<CitationRelationship[]> {
    try {
      const patterns = await this.patternManager.getPatternsForDomain(document.domain);
      const citations: CitationRelationship[] = [];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.pattern, 'gi');
        const matches = document.content.matchAll(regex);
        
        for (const match of matches) {
          const citation = await this.createCitationRelationship(
            document.id,
            match[0],
            'explicit',
            document.domain
          );
          citations.push(citation);
        }
      }

      return citations;
    } catch (error) {
      throw new CitationError(
        'Failed to extract explicit citations',
        'PATTERN_MATCH_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Extracts implicit citations using semantic similarity.
   * @param document - The document to extract citations from
   * @returns Array of implicit citation relationships
   * @throws {CitationError} If semantic analysis fails
   */
  private async extractImplicitCitations(document: ProcessedDocument): Promise<CitationRelationship[]> {
    try {
      await this.rateLimiter.waitForToken();
      const embeddings = await this.getDocumentEmbeddings(document.content);
      const similarDocuments = await this.findSimilarDocuments(embeddings);
      
      const citations = await Promise.all(
        similarDocuments.map(async doc => 
          this.createCitationRelationship(
            document.id,
            doc.id,
            'implicit',
            document.domain,
            doc.similarity
          )
        )
      );

      return citations;
    } catch (error) {
      throw new CitationError(
        'Failed to extract implicit citations',
        'SEMANTIC_ANALYSIS_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Creates a citation relationship between documents.
   * @param sourceId - ID of the source document
   * @param targetId - ID of the target document
   * @param type - Type of citation (explicit/implicit)
   * @param domain - Domain of the documents
   * @param similarity - Optional similarity score for implicit citations
   * @returns Citation relationship object
   */
  private async createCitationRelationship(
    sourceId: string,
    targetId: string,
    type: 'explicit' | 'implicit',
    domain: Domain,
    similarity?: number
  ): Promise<CitationRelationship> {
    try {
      return {
        id: crypto.randomUUID(),
        source_document_id: sourceId,
        target_document_id: targetId,
        citation_type: type,
        metadata: {
          domain,
          confidence: similarity ?? 1.0,
          context: '',
          lastVerified: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence_score: similarity ?? 1.0,
        semantic_similarity: similarity
      };
    } catch (error) {
      throw new CitationError(
        'Failed to create citation relationship',
        'RELATIONSHIP_CREATION_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Generates embeddings for document content.
   * @param content - Document content to embed
   * @returns Array of embedding values
   * @throws {CitationError} If embedding generation fails
   */
  private async getDocumentEmbeddings(content: string): Promise<number[]> {
    try {
      await this.rateLimiter.waitForToken();
      const embedding = await this.embeddings.embedQuery(content);
      return embedding;
    } catch (error) {
      throw new CitationError(
        'Failed to generate document embeddings',
        'EMBEDDING_FAILED',
        'error',
        true,
        { error }
      );
    }
  }

  /**
   * Finds similar documents using vector similarity search.
   * @param embeddings - Document embeddings to search with
   * @returns Array of similar documents with similarity scores
   * @throws {CitationError} If similarity search fails
   */
  private async findSimilarDocuments(embeddings: number[]): Promise<Array<{ id: string; similarity: number }>> {
    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        embeddings,
        5 // Return top 5 most similar documents
      );

      return results.map(([doc, score]: [Document, number]) => ({
        id: doc.metadata.id as string,
        similarity: score
      }));
    } catch (error) {
      throw new CitationError(
        'Failed to find similar documents',
        'SIMILARITY_SEARCH_FAILED',
        'error',
        true,
        { error }
      );
    }
  }
} 