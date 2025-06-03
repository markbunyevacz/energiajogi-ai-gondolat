import { DocumentMetadata, ProcessedDocument as BaseProcessedDocument } from '@/lib/claude';

export type Domain = 'legal' | 'regulatory' | 'contract' | 'policy';
export type CitationType = 'explicit' | 'implicit';
export type ImpactLevel = 'direct' | 'indirect' | 'potential';

export interface DomainPattern {
  id: string;
  domain: Domain;
  pattern: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimilarityResult {
  id: string;
  similarity: number;
  metadata: {
    id: string;
    content: string;
    domain: Domain;
  };
}

export interface LegalDocument {
  id: string;
  content: string;
  domain: Domain;
  metadata: Record<string, unknown>;
}

export interface ProcessedDocument extends BaseProcessedDocument {
  id: string;
  domain: Domain;
}

export interface CitationMetadata {
  domain: Domain;
  confidence: number;
  context: string;
  lastVerified: string;
}

export interface CitationRelationship {
  id: string;
  source_document_id: string;
  target_document_id: string;
  citation_type: CitationType;
  metadata: CitationMetadata;
  created_at: string;
  updated_at: string;
  confidence_score: number;
  semantic_similarity?: number;
}

export interface ImpactChain {
  sourceDocument: string;
  affectedDocuments: Array<{
    documentId: string;
    path: string[];
    confidence: number;
  }>;
}

export interface CitationNode {
  id: string;
  documentId: string;
  title: string;
  type: string;
  date: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface PerformanceReport {
  processing_time: number;
  citation_count: number;
  impact_chain_count: number;
  error_count: number;
}

// Type guards
export function isCitationRelationship(obj: unknown): obj is CitationRelationship {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'source_document_id' in obj &&
    'target_document_id' in obj &&
    'citation_type' in obj &&
    'metadata' in obj
  );
} 