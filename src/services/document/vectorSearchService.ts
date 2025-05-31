import { supabase } from '@/integrations/supabase/client';
import { embeddingService } from './embeddingService';
import type { SearchRequest, SearchResult } from './types';

export class VectorSearchService {
  async performVectorSearch(request: SearchRequest): Promise<Omit<SearchResult, 'processingTime'>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(request.query);
      
      // Use the search_documents RPC function for vector similarity search
      const { data, error } = await supabase.rpc('search_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.5,
        match_count: request.limit || 10
      });

      if (error) {
        console.error('Vector search error:', error);
        throw error;
      }

      let chunks = (data || []).map((item: any) => ({
        id: item.chunk_id,
        document_id: item.document_id,
        chunk_text: item.chunk_text,
        chunk_index: 0, // We don't have this from the RPC
        similarity: item.similarity || 0
      }));

      // Filter by document ID if specified
      if (request.documentId) {
        chunks = chunks.filter(chunk => chunk.document_id === request.documentId);
      }

      // Apply limit after filtering
      chunks = chunks.slice(0, request.limit || 10);

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
}

export const vectorSearchService = new VectorSearchService();
