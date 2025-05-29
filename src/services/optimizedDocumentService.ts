
import { supabase } from '@/integrations/supabase/client';
import { chunkCache } from './chunkCache';
import { BatchProcessor } from './batchProcessor';

interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding?: number[];
  similarity?: number;
}

interface SearchRequest {
  query: string;
  documentId?: string;
  limit?: number;
}

interface SearchResult {
  chunks: DocumentChunk[];
  totalResults: number;
  processingTime: number;
  avgSimilarity?: number;
}

class OptimizedDocumentService {
  private searchBatchProcessor: BatchProcessor<SearchRequest, SearchResult>;
  private embeddingBatchProcessor: BatchProcessor<string, number[]>;

  constructor() {
    // Initialize batch processors
    this.searchBatchProcessor = new BatchProcessor(
      this.batchSearch.bind(this),
      { batchSize: 5, maxWaitTime: 50 }
    );

    this.embeddingBatchProcessor = new BatchProcessor(
      this.batchGenerateEmbeddings.bind(this),
      { batchSize: 10, maxWaitTime: 100 }
    );
  }

  async searchDocuments(query: string, documentId?: string, limit = 10): Promise<SearchResult> {
    const cacheKey = `search:${query}:${documentId || 'all'}:${limit}`;
    
    // Check cache first
    const cached = chunkCache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for search query:', query);
      return cached;
    }

    // Use batch processor for search
    const result = await this.searchBatchProcessor.add({
      query,
      documentId,
      limit
    });

    // Cache the result for 2 minutes
    chunkCache.set(cacheKey, result, 2 * 60 * 1000);

    return result;
  }

  private async batchSearch(requests: SearchRequest[]): Promise<SearchResult[]> {
    console.log(`Batch searching ${requests.length} queries`);
    const startTime = performance.now();

    const results: SearchResult[] = [];

    for (const request of requests) {
      try {
        // First try vector search with embeddings
        let searchResult = await this.performVectorSearch(request);
        
        // If no vector results, fallback to text search
        if (!searchResult.chunks.length) {
          console.log('No vector results, falling back to text search');
          searchResult = await this.performTextSearch(request);
        }

        results.push({
          ...searchResult,
          processingTime: performance.now() - startTime
        });
      } catch (error) {
        console.error('Search error:', error);
        results.push({
          chunks: [],
          totalResults: 0,
          processingTime: performance.now() - startTime
        });
      }
    }

    return results;
  }

  private async performVectorSearch(request: SearchRequest): Promise<Omit<SearchResult, 'processingTime'>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(request.query);
      
      // Use the search_documents RPC function for vector similarity search
      const { data, error } = await supabase.rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Lowered threshold for better results
        match_count: request.limit || 10,
        doc_id: request.documentId || null
      });

      if (error) {
        console.error('Vector search error:', error);
        throw error;
      }

      const chunks = (data || []).map((item: any) => ({
        ...item,
        similarity: item.similarity || 0
      }));

      const avgSimilarity = chunks.length > 0 
        ? chunks.reduce((sum, chunk) => sum + (chunk.similarity || 0), 0) / chunks.length 
        : 0;

      return {
        chunks,
        totalResults: chunks.length,
        avgSimilarity
      };
    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  private async performTextSearch(request: SearchRequest): Promise<Omit<SearchResult, 'processingTime'>> {
    let query = supabase
      .from('document_chunks')
      .select(`
        id,
        document_id,
        chunk_text,
        chunk_index,
        documents!inner(title)
      `)
      .ilike('chunk_text', `%${request.query}%`)
      .limit(request.limit || 10);

    if (request.documentId) {
      query = query.eq('document_id', request.documentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      chunks: data || [],
      totalResults: data?.length || 0
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${text.substring(0, 100)}`;
    
    // Check cache first
    const cached = chunkCache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for embedding generation');
      return cached;
    }

    // Use batch processor for embedding generation
    const embedding = await this.embeddingBatchProcessor.add(text);

    // Cache the embedding for 1 hour
    chunkCache.set(cacheKey, embedding, 60 * 60 * 1000);

    return embedding;
  }

  private async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`Batch generating embeddings for ${texts.length} texts`);

    try {
      // Call OpenAI embeddings API for batch processing
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: texts,
        }),
      });

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Batch embedding generation failed:', error);
      // Return empty embeddings as fallback
      return texts.map(() => []);
    }
  }

  // Calculate confidence score based on search results and similarity
  calculateConfidence(searchResults: SearchResult, sources: string[]): number {
    if (!searchResults.chunks.length) {
      return 30; // Low confidence when no relevant documents found
    }

    let confidence = 40; // Base confidence

    // Factor 1: Average similarity score (40% weight)
    if (searchResults.avgSimilarity) {
      confidence += Math.min(searchResults.avgSimilarity * 40, 40);
    }

    // Factor 2: Number of sources (20% weight)
    const sourceBonus = Math.min(sources.length * 5, 20);
    confidence += sourceBonus;

    // Factor 3: Quality of sources (bonus for official sources)
    const officialSourceBonus = sources.filter(source => 
      source.includes('jogtar.hu') || 
      source.includes('eur-lex.europa.eu') || 
      source.includes('mekh.hu') ||
      source.includes('magyarkozlony.hu')
    ).length * 3;
    
    confidence = Math.min(confidence + officialSourceBonus, 95);
    
    return Math.max(confidence, 30); // Minimum 30% confidence
  }

  async preloadDocumentChunks(documentIds: string[]): Promise<void> {
    console.log(`Preloading chunks for ${documentIds.length} documents`);

    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .in('document_id', documentIds);

    if (error) {
      console.error('Error preloading chunks:', error);
      return;
    }

    // Cache each chunk
    data?.forEach(chunk => {
      const cacheKey = `chunk:${chunk.id}`;
      chunkCache.set(cacheKey, chunk, 10 * 60 * 1000); // 10 minutes
    });

    console.log(`Preloaded ${data?.length || 0} chunks into cache`);
  }

  getPerformanceStats() {
    return {
      cache: chunkCache.getStats(),
      searchQueue: this.searchBatchProcessor.getQueueSize(),
      embeddingQueue: this.embeddingBatchProcessor.getQueueSize(),
      isProcessing: {
        search: this.searchBatchProcessor.isProcessing(),
        embedding: this.embeddingBatchProcessor.isProcessing()
      }
    };
  }

  clearCache(): void {
    chunkCache.clear();
  }
}

export const optimizedDocumentService = new OptimizedDocumentService();
