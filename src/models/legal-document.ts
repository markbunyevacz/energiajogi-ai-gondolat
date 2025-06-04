export interface LegalDocument {
  id: string;
  content: string;
  jurisdiction: string;
  domain: Domain;
  metadata: {
    title: string;
    date: string;
    // ... other fields
  };
} 