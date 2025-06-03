import type { Database } from '@/integrations/supabase/types';

export interface ProcessingRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  priority: number;
  action: (document: LegalDocument) => Promise<void>;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  deadlineType: 'immediate' | 'standard' | 'custom';
  standardPeriod?: number; // in days
  gracePeriod?: number; // in days
  affectedEntities: string[];
}

export interface LegalDomain {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentDomainId?: string;
  metadata?: Record<string, any>;
  active: boolean;
  documentTypes: DocumentType[];
  processingRules: ProcessingRule[];
  complianceRequirements: ComplianceRequirement[];
}

// Extend existing DocumentType enum
export type DocumentType = Database['public']['Enums']['document_type'];
export type LegalHierarchyLevel = Database['public']['Enums']['legal_hierarchy_level'];

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId: string;
  hierarchyLevel?: LegalHierarchyLevel;
  crossReferences?: {
    documentId: string;
    relationshipType: string;
    metadata?: Record<string, any>;
  }[];
  metadata: {
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
}

export interface LegalHierarchy {
  id: string;
  parentDocumentId: string;
  childDocumentId: string;
  relationshipType: string;
  metadata?: Record<string, any>;
} 