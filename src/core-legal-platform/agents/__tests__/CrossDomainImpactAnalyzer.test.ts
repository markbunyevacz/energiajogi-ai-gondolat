import { CrossDomainImpactAnalyzer } from '../impact-analysis/CrossDomainImpactAnalyzer';
import { AgentConfig, AgentContext } from '../base-agents/BaseAgent';
import { LegalDocument } from '../../legal-domains/types';
import { vi } from 'vitest';

describe('CrossDomainImpactAnalyzer', () => {
    let analyzer: CrossDomainImpactAnalyzer;
    const config: AgentConfig = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent for cross-domain impact analysis',
        domainCode: 'test-domain',
        enabled: true,
    };

    beforeEach(() => {
        analyzer = new CrossDomainImpactAnalyzer(config);
    });

    it('should process a document and return cross-domain impacts', async () => {
        const doc: LegalDocument = {
            id: 'doc1',
            title: 'Source Document',
            content: 'This is a test document.',
            documentType: 'law',
            domainId: 'legal',
            metadata: { domain: 'legal', importance: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        };

        const context: AgentContext = {
            document: doc,
            domain: 'legal',
        };

        // Mock the services
        const embeddingService = (analyzer as any).embeddingService;
        const impactAnalyzer = (analyzer as any).impactAnalyzer;

        vi.spyOn(embeddingService, 'getEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);
        vi.spyOn(embeddingService, 'findSimilarDocuments').mockResolvedValue([
            { id: 'doc2', title: 'Impacted Document 1', content: '...', documentType: 'policy', metadata: { domain: 'regulatory', importance: 3 } },
        ]);
        vi.spyOn(impactAnalyzer, 'analyzeImpact').mockResolvedValue([
            { impact_path: ['doc2', 'doc3', 'doc4'] },
        ]);

        const result = await analyzer.process(context);

        expect(result.success).toBe(true);
        expect(result.data.impacts.length).toBe(1);
        expect(result.data.impacts[0].riskScore).toBeCloseTo(1); 
        expect(result.data.visualization).toContain('graph TD');
        expect(result.data.visualization).toContain('doc1');
        expect(result.data.visualization).toContain('doc2');
    });
}); 