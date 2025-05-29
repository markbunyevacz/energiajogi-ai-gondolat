
import { chunkCache } from './chunkCache';
import { BatchProcessor } from './batchProcessor';
import { vectorSearchService } from './document/vectorSearchService';
import { textSearchService } from './document/textSearchService';
import { embeddingService } from './document/embeddingService';
import { confidenceCalculator } from './document/confidenceCalculator';
import { cacheService } from './document/cacheService';
import type { SearchRequest, SearchResult } from './document/types';

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
}

export const optimizedDocumentService = new OptimizedDocumentService();
