export interface DocumentMetadata {
  title?: string;
  citation?: string;
  documentType: 'law' | 'regulation' | 'decision' | 'other';
  date?: string;
  references?: string[];
  legalAreas?: string[];
  source?: string;
}

export interface Document {
  id: string;
  content: string;
  embedding?: number[];
  metadata: DocumentMetadata;
} 