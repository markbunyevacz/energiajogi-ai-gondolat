import { CitationGraphBuilder } from '../CitationGraphBuilder';
import { ProcessedDocument } from '@/lib/claude';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessor } from '@/lib/documentProcessor';
import { embeddingService } from '@/services/document/embeddingService';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  },
}));

// Mock dependencies
jest.mock('@/lib/documentProcessor');
jest.mock('@/services/document/embeddingService');

describe('CitationGraphBuilder', () => {
  let builder: CitationGraphBuilder;
  const mockDocuments: ProcessedDocument[] = [
    {
      content: 'This law references 2024. évi ABC törvény and 2024. évi XYZ rendelet',
      metadata: {
        documentType: 'law',
        date: '2024-03-15',
        references: [],
        legalAreas: ['civil'],
        title: 'Test Law 1',
        source: 'test',
      },
    },
    {
      content: 'This regulation references 2024. évi ABC törvény',
      metadata: {
        documentType: 'regulation',
        date: '2024-03-15',
        references: [],
        legalAreas: ['civil'],
        title: 'Test Regulation 1',
        source: 'test',
      },
    },
  ];

  beforeEach(() => {
    builder = new CitationGraphBuilder();
    jest.clearAllMocks();
  });

  describe('buildGraph', () => {
    it('should create nodes and edges from documents', async () => {
      await builder.buildGraph(mockDocuments);

      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('citation_nodes');
      expect(supabase.from).toHaveBeenCalledWith('citation_edges');
      expect(supabase.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('findImpactChains', () => {
    it('should find all documents affected by a change', async () => {
      // Mock Supabase response
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'citation_edges') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ target_id: 'node2' }],
              error: null,
            }),
          };
        }
        return supabase;
      });

      const impactChain = await builder.findImpactChains('node1');
      expect(impactChain).toBeDefined();
    });
  });

  describe('getCitingDocuments', () => {
    it('should find all documents that cite a specific document', async () => {
      // Mock Supabase response
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'citation_edges') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ source_id: 'node2' }],
              error: null,
            }),
          };
        }
        return supabase;
      });

      const citingDocs = await builder.getCitingDocuments('node1');
      expect(citingDocs).toBeDefined();
    });
  });

  describe('getCitedDocuments', () => {
    it('should find all documents cited by a specific document', async () => {
      // Mock Supabase response
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'citation_edges') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ target_id: 'node2' }],
              error: null,
            }),
          };
        }
        return supabase;
      });

      const citedDocs = await builder.getCitedDocuments('node1');
      expect(citedDocs).toBeDefined();
    });
  });

  describe('extractCitations', () => {
    const mockDocumentId = 'doc-123';
    const mockContent = 'This document references 2024. évi ABC törvény';

    it('should extract explicit citations and create relationships', async () => {
      // Mock DocumentProcessor
      (DocumentProcessor.extractLegalReferences as jest.Mock).mockReturnValue(['2024. évi ABC törvény']);

      // Mock Supabase find target document
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'target-123' },
          error: null
        })
      });

      // Mock Supabase insert citation relationship
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null })
      });

      await builder.extractCitations(mockDocumentId, mockContent);

      expect(DocumentProcessor.extractLegalReferences).toHaveBeenCalledWith(mockContent);
      expect(supabase.from).toHaveBeenCalledWith('citation_relationships');
    });

    it('should find implicit citations using semantic similarity', async () => {
      // Mock embedding service
      (embeddingService.generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);

      // Mock Supabase match_documents RPC
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [
          { id: 'similar-123', similarity: 0.9 },
          { id: 'similar-456', similarity: 0.7 }
        ],
        error: null
      });

      // Mock Supabase insert citation relationship
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null })
      });

      await builder.extractCitations(mockDocumentId, mockContent);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(mockContent);
      expect(supabase.rpc).toHaveBeenCalledWith('match_documents', expect.any(Object));
    });
  });

  describe('analyzeImpactChains', () => {
    const mockChangedDocId = 'changed-123';

    it('should analyze impact chains for changed document', async () => {
      // Mock direct citations
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'citation-123',
              target_document_id: 'target-123',
              citation_type: 'explicit',
              confidence_score: 0.9
            }
          ],
          error: null
        })
      });

      // Mock impact chain creation
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await builder.analyzeImpactChains(mockChangedDocId);

      expect(supabase.from).toHaveBeenCalledWith('citation_relationships');
      expect(supabase.from).toHaveBeenCalledWith('citation_impact_chains');
    });
  });

  describe('getAffectedDocuments', () => {
    const mockDocumentId = 'doc-123';

    it('should return affected documents ordered by impact level', async () => {
      const mockImpactChains = [
        {
          id: 'chain-123',
          root_document_id: mockDocumentId,
          affected_document_id: 'affected-123',
          impact_path: [mockDocumentId, 'affected-123'],
          impact_level: 'high',
          created_at: '2024-03-15T12:00:00Z',
          updated_at: '2024-03-15T12:00:00Z'
        }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockImpactChains,
          error: null
        })
      });

      const result = await builder.getAffectedDocuments(mockDocumentId);

      expect(result).toEqual(mockImpactChains);
      expect(supabase.from).toHaveBeenCalledWith('citation_impact_chains');
    });
  });
}); 