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
  description: string;
  active: boolean;
  documentTypes: DocumentType[];
  processingRules: ProcessingRule[];
  complianceRequirements: ComplianceRequirement[];
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

// Extend existing DocumentType enum
export type DocumentType = 
  | 'law'
  | 'regulation'
  | 'policy'
  | 'decision'
  | 'other'
  | string; // Allow domain-specific types

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