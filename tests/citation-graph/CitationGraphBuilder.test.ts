import { CitationGraphBuilder } from '../../src/core-legal-platform/citation-graph/CitationGraphBuilder';
import { EmbeddingService } from '../../src/core-legal-platform/embedding/EmbeddingService';
import { Document } from '../../src/core-legal-platform/document-processing/Document';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
const mockEmbeddingService = {
  findSimilarDocuments: jest.fn().mockResolvedValue([
    { id: 'doc2', content: 'Related document', embedding: [0.1, 0.2] }
  ])
};

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data: [], error: null })
};

describe('CitationGraphBuilder', () => {
  let builder: CitationGraphBuilder;
  const testDocument: Document = {
    id: 'doc1',
    content: 'Reference to 42 U.S.C. § 1983',
    embedding: [0.1, 0.2, 0.3],
    metadata: {
      title: 'Test Document',
      citation: 'Test Citation',
      documentType: 'Statute',
      date: '2023-01-01'
    }
  };

  beforeEach(() => {
    builder = new CitationGraphBuilder(
      mockSupabase as any,
      mockEmbeddingService as any
    );
  });

  test('extractExplicitCitations finds valid citations', () => {
    const text = 'See 42 U.S.C. § 1983 and Smith v. Jones, 123 F.3d 456 (1999)';
    const citations = builder.extractExplicitCitations(text);
    expect(citations).toEqual([
      '42 U.S.C. § 1983',
      '123 F.3d 456'
    ]);
  });

  test('processDocument stores citations', async () => {
    await builder.processDocument(testDocument);
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  test('findImpactChain returns correct chain', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ cited_document_id: 'doc2' }],
      error: null
    });
    
    const impactChain = await builder.findImpactChain('doc1');
    expect(impactChain).toEqual(['doc1', 'doc2']);
  });
}); 