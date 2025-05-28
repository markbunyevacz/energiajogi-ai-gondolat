
import { useState, useCallback, useEffect } from 'react';
import { optimizedDocumentService } from '@/services/optimizedDocumentService';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  chunks: any[];
  totalResults: number;
  processingTime: number;
}

interface UseOptimizedSearchReturn {
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string, documentId?: string) => Promise<void>;
  performanceStats: any;
}

export function useOptimizedSearch(autoSearch = true): UseOptimizedSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [performanceStats, setPerformanceStats] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string, documentId?: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await optimizedDocumentService.searchDocuments(
        searchQuery,
        documentId
      );
      const endTime = performance.now();

      console.log(`Search completed in ${endTime - startTime}ms`);
      
      setResults(result);
      setPerformanceStats(optimizedDocumentService.getPerformanceStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search, autoSearch]);

  // Update performance stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceStats(optimizedDocumentService.getPerformanceStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    results,
    isLoading,
    error,
    search: useCallback((searchQuery: string, documentId?: string) => {
      setQuery(searchQuery);
      return search(searchQuery, documentId);
    }, [search]),
    performanceStats
  };
}
