import { CitationGraphBuilder } from './CitationGraphBuilder';
import { SupabaseClient } from '@supabase/supabase-js';
import { EmbeddingService } from '@/services/embedding/EmbeddingService';
import { DocumentProcessor } from '@/lib/documentProcessor';

describe('CitationGraphBuilder', () => {
  const mockSupabase = {} as SupabaseClient;
  const mockEmbeddingService = {
    getDocumentEmbedding: jest.fn(),
    findSimilarDocuments: jest.fn()
  } as unknown as EmbeddingService;
  const mockDocumentProcessor = {
    process: jest.fn(),
    extractText: jest.fn()
  } as unknown as DocumentProcessor;

  const builder = new CitationGraphBuilder(
    mockSupabase,
    'test-api-key',
    mockEmbeddingService,
    mockDocumentProcessor
  );

  describe('getImpactChain', () => {
    it('should find direct impact chain', async () => {
      // Mock graph structure: A -> B -> C
      builder['graph'] = new Map([
        ['A', new Set([{ source: 'A', target: 'B', type: 'explicit' }])],
        ['B', new Set([{ source: 'B', target: 'C', type: 'explicit' }])]
      ]);

      const impactChain = await builder.getImpactChain('A');
      expect(impactChain.affectedDocuments.map(d => d.documentId))
        .toEqual(['B', 'C']);
    });

    it('should handle cycles', async () => {
      // Mock graph with cycle: A -> B -> A
      builder['graph'] = new Map([
        ['A', new Set([{ source: 'A', target: 'B', type: 'explicit' }])],
        ['B', new Set([{ source: 'B', target: 'A', type: 'explicit' }])]
      ]);

      const impactChain = await builder.getImpactChain('A');
      expect(impactChain.affectedDocuments.map(d => d.documentId))
        .toEqual(['B']);
    });
  });

  describe('processImplicitCitations', () => {
    it('should add implicit citations', async () => {
      const docs = [{ id: '1' }, { id: '2' }] as Document[];
      mockEmbeddingService.getDocumentEmbedding.mockResolvedValue([0.1, 0.2]);
      mockEmbeddingService.findSimilarDocuments.mockResolvedValue([{ id: '2' }]);
      
      await builder['processImplicitCitations'](docs);
      expect(builder['graph'].get('1')?.size).toBe(1);
    });
  });
}); 