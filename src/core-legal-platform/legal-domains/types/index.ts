export type DocumentType = 'law' | 'regulation' | 'policy' | 'decision' | 'other';

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId: string;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

export interface LegalDomain {
  id: string;
  code: string;
  name: string;
  description: string;
  metadata: {
    created_at: string;
    updated_at: string;
  };
} 