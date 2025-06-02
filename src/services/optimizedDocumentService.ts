import { chunkCache } from './chunkCache.js';
import { BatchProcessor } from './batchProcessor.js';
import { vectorSearchService } from './document/vectorSearchService.js';
import { textSearchService } from './document/textSearchService.js';
import { embeddingService } from './document/embeddingService.js';
import { confidenceCalculator } from './document/confidenceCalculator.js';
import { cacheService } from './document/cacheService.js';
import type { SearchRequest, SearchResult } from './document/types.js';
import { supabase } from '@/integrations/supabase/client.js';

class OptimizedDocumentService {
  private searchBatchProcessor: BatchProcessor<SearchRequest, SearchResult>;

  constructor() {
    // Initialize batch processors
    this.searchBatchProcessor = new BatchProcessor(
      this.batchSearch.bind(this),
      { batchSize: 5, maxWaitTime: 50 }
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
        let searchResult = await vectorSearchService.performVectorSearch(request);
        
        // If no vector results, fallback to text search
        if (!searchResult.chunks.length) {
          console.log('No vector results, falling back to text search');
          searchResult = await textSearchService.performTextSearch(request);
        }

        results.push({
          chunks: searchResult.chunks,
          totalResults: searchResult.totalResults,
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
    return embeddingService.generateEmbedding(text);
  }

  // Calculate confidence score based on search results and similarity
  calculateConfidence(searchResults: SearchResult, sources: string[]): number {
    return confidenceCalculator.calculateConfidence(searchResults, sources);
  }

  async preloadDocumentChunks(documentIds: string[]): Promise<void> {
    return cacheService.preloadDocumentChunks(documentIds);
  }

  getPerformanceStats() {
    return {
      cache: chunkCache.getStats(),
      searchQueue: this.searchBatchProcessor.getQueueSize(),
      embeddingQueue: embeddingService.getQueueSize(),
      isProcessing: {
        search: this.searchBatchProcessor.isProcessing(),
        embedding: embeddingService.isProcessing()
      }
    };
  }

  clearCache(): void {
    cacheService.clearCache();
  }

  async reindexAllDocuments(): Promise<void> {
    console.log("Starting full codebase reindexing...");
    // Clear cache first
    this.clearCache();
    // Fetch all document IDs from the documents table
    const { data: documents, error } = await supabase.from('documents').select('id');
    if (error) {
      console.error("Failed to fetch documents:", error);
      throw error;
    }
    // For each document, fetch its chunks and regenerate embeddings
    for (const doc of documents) {
      const { data: chunks, error: chunkError } = await supabase.from('document_chunks').select('id, chunk_text').eq('document_id', doc.id);
      if (chunkError) {
        console.error(`Failed to fetch chunks for document ${doc.id}:`, chunkError);
        continue;
      }
      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.chunk_text);
        const { error: updateError } = await supabase.from('document_chunks').update({ embedding: JSON.stringify(embedding) }).eq('id', chunk.id);
        if (updateError) {
          console.error(`Failed to update embedding for chunk ${chunk.id}:`, updateError);
          continue;
        }
      }
    }
  }
}

export default new OptimizedDocumentService();