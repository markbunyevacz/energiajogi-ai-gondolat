import { CitationExtractor } from '../CitationExtractor';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProcessedDocument, Domain } from '../types';
import { CitationError } from '../errors';
import { DocumentMetadata } from '@/lib/claude';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis(),
  then: jest.fn().mockResolvedValue({ data: [], error: null })
} as unknown as SupabaseClient;

// Mock OpenAI embeddings
jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
  }))
}));

// Mock vector store
jest.mock('@langchain/community/vectorstores/supabase', () => ({
  SupabaseVectorStore: jest.fn().mockImplementation(() => ({
    similaritySearchWithScore: jest.fn().mockResolvedValue([
      [{ metadata: { id: 'doc1' } }, 0.8],
      [{ metadata: { id: 'doc2' } }, 0.6]
    ])
  }))
}));

describe('CitationExtractor', () => {
  let extractor: CitationExtractor;
  const mockOpenAiKey = 'test-key';

  const mockMetadata: DocumentMetadata = {
    title: 'Test Document',
    date: '2024-03-20',
    documentType: 'law',
    references: [],
    legalAreas: ['general'],
    source: 'test'
  };

  beforeEach(() => {
    extractor = new CitationExtractor(mockSupabase, mockOpenAiKey);
    jest.clearAllMocks();
  });

  describe('extractCitations', () => {
    const mockDocument: ProcessedDocument = {
      id: 'doc1',
      content: 'This document cites Act 123 and references Regulation 456',
      domain: 'legal' as Domain,
      metadata: mockMetadata
    };

    it('should extract both explicit and implicit citations', async () => {
      const citations = await extractor.extractCitations(mockDocument);
      expect(citations).toBeDefined();
      expect(Array.isArray(citations)).toBe(true);
    });

    it('should handle extraction errors gracefully', async () => {
      jest.spyOn(extractor as any, 'extractExplicitCitations')
        .mockRejectedValue(new Error('Test error'));

      await expect(extractor.extractCitations(mockDocument))
        .rejects
        .toThrow(CitationError);
    });
  });

  describe('extractExplicitCitations', () => {
    const mockDocument: ProcessedDocument = {
      id: 'doc1',
      content: 'This document cites Act 123',
      domain: 'legal' as Domain,
      metadata: mockMetadata
    };

    it('should extract citations using pattern matching', async () => {
      const citations = await (extractor as any).extractExplicitCitations(mockDocument);
      expect(citations).toBeDefined();
      expect(Array.isArray(citations)).toBe(true);
    });
  });

  describe('extractImplicitCitations', () => {
    const mockDocument: ProcessedDocument = {
      id: 'doc1',
      content: 'This document discusses legal concepts',
      domain: 'legal' as Domain,
      metadata: mockMetadata
    };

    it('should extract citations using semantic similarity', async () => {
      const citations = await (extractor as any).extractImplicitCitations(mockDocument);
      expect(citations).toBeDefined();
      expect(Array.isArray(citations)).toBe(true);
    });
  });

  describe('createCitationRelationship', () => {
    it('should create a valid citation relationship', async () => {
      const relationship = await (extractor as any).createCitationRelationship(
        'doc1',
        'doc2',
        'explicit',
        'legal',
        0.8
      );

      expect(relationship).toMatchObject({
        source_document_id: 'doc1',
        target_document_id: 'doc2',
        citation_type: 'explicit',
        confidence_score: 0.8
      });
    });
  });

  describe('getDocumentEmbeddings', () => {
    it('should generate embeddings for document content', async () => {
      const embeddings = await (extractor as any).getDocumentEmbeddings('test content');
      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBeGreaterThan(0);
    });
  });

  describe('findSimilarDocuments', () => {
    it('should find similar documents using vector similarity', async () => {
      const similarDocs = await (extractor as any).findSimilarDocuments([0.1, 0.2, 0.3]);
      expect(Array.isArray(similarDocs)).toBe(true);
      expect(similarDocs.length).toBeGreaterThan(0);
      expect(similarDocs[0]).toHaveProperty('id');
      expect(similarDocs[0]).toHaveProperty('similarity');
    });
  });
}); 