import { supabase } from '@/integrations/supabase/client';

export class EmbeddingService {
  // REAL embedding service using Hugging Face
  async getEmbedding(content: string): Promise<number[]> {
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
      body: JSON.stringify({ inputs: content })
    });
    return await response.json();
  }

  // Efficient similarity search
  async findSimilar(embedding: number[], threshold: number, limit: number): Promise<number[]> {
    const { data, error } = await supabase.rpc('find_similar_documents', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      max_count: limit
    });
    return data?.map(item => item.document_id) || [];
  }

  // Add proper implementation
  async findSimilarDocuments(
    embedding: number[],
    threshold: number,
    limit: number
  ): Promise<Document[]> {
    const { data, error } = await supabase.rpc('find_similar_documents', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      match_count: limit
    });
    
    return data?.map(item => ({
      id: item.document_id,
      content: item.content,
      embedding: item.embedding,
      metadata: item.metadata
    })) || [];
  }
} 