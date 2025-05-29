
import { supabase } from '@/integrations/supabase/client';
import type { SearchRequest, SearchResult } from './types';

export class TextSearchService {
  async performTextSearch(request: SearchRequest): Promise<Omit<SearchResult, 'processingTime'>> {
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
}

export const textSearchService = new TextSearchService();
