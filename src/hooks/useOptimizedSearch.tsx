import { useState, useCallback, useEffect } from 'react';
import { optimizedDocumentService } from '@/services/optimizedDocumentService';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  chunks: any[];
  totalResults: number;
  processingTime: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

interface SearchState {
  cache: CacheStats;
  searchQueue: number;
  embeddingQueue: number;
  isProcessing: {
    search: boolean;
    embedding: boolean;
  };
}

interface UseOptimizedSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult | null;
  isLoading: boolean;
  error: Error | null;
  search: (query: string, documentId?: string) => Promise<void>;
  performanceStats: any;
  searchState: SearchState;
  incrementCacheHits: () => void;
  incrementCacheMisses: () => void;
  updateQueueSizes: (searchQueue: number, embeddingQueue: number) => void;
  updateProcessingStatus: (isProcessing: SearchState['isProcessing']) => void;
}

export function useOptimizedSearch(autoSearch = true): UseOptimizedSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    cache: {
      hits: 0,
      misses: 0,
      size: 0
    },
    searchQueue: 0,
    embeddingQueue: 0,
    isProcessing: {
      search: false,
      embedding: false
    }
  });

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string, documentId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await optimizedDocumentService.searchDocuments(searchQuery, documentId);
      setResults(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred during search'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, autoSearch, search]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = await optimizedDocumentService.getPerformanceStats();
      setPerformanceStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const incrementCacheHits = useCallback(() => {
    updateSearchState({
      cache: {
        ...searchState.cache,
        hits: searchState.cache.hits + 1
      }
    });
  }, [searchState.cache, updateSearchState]);

  const incrementCacheMisses = useCallback(() => {
    updateSearchState({
      cache: {
        ...searchState.cache,
        misses: searchState.cache.misses + 1
      }
    });
  }, [searchState.cache, updateSearchState]);

  const updateQueueSizes = useCallback((searchQueue: number, embeddingQueue: number) => {
    updateSearchState({
      searchQueue,
      embeddingQueue
    });
  }, [updateSearchState]);

  const updateProcessingStatus = useCallback((isProcessing: SearchState['isProcessing']) => {
    updateSearchState({
      isProcessing
    });
  }, [updateSearchState]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search: useCallback((searchQuery: string, documentId?: string) => {
      return search(searchQuery, documentId);
    }, [search]),
    performanceStats,
    searchState,
    incrementCacheHits,
    incrementCacheMisses,
    updateQueueSizes,
    updateProcessingStatus
  };
}
