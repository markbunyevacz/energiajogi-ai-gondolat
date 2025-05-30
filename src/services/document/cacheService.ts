
import { supabase } from '@/integrations/supabase/client';
import { chunkCache } from '../chunkCache';

export class CacheService {
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

  clearCache(): void {
    chunkCache.clear();
  }
}

export const cacheService = new CacheService();
