
import { supabase } from '@/integrations/supabase/client';
import { chunkCache } from './chunkCache';
import { BatchProcessor } from './batchProcessor';

interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding?: number[];
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
        const { data, error } = await supabase
          .from('document_chunks')
          .select(`
            id,
            document_id,
            chunk_text,
            chunk_index,
            documents!inner(title)
          `)
          .ilike('chunk_text', `%${request.query}%`)
          .eq(request.documentId ? 'document_id' : 'id', request.documentId || 'id')
          .limit(request.limit || 10);

        if (error) throw error;

        results.push({
          chunks: data || [],
          totalResults: data?.length || 0,
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
