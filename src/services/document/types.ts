
export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding?: number[];
  similarity?: number;
}

export interface SearchRequest {
  query: string;
  documentId?: string;
  limit?: number;
}

export interface SearchResult {
  chunks: DocumentChunk[];
  totalResults: number;
  processingTime: number;
  avgSimilarity?: number;
}
