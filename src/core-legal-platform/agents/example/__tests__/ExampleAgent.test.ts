import { ExampleAgent } from '../ExampleAgent';
import { AgentConfig, AgentContext } from '../../base-agents/BaseAgent';
import { LegalDocument } from '../../../legal-domains/types';
import { DomainRegistry } from '../../../legal-domains/registry/DomainRegistry';

jest.mock('../../../legal-domains/registry/DomainRegistry');

describe('ExampleAgent', () => {
  let agent: ExampleAgent;
  const mockConfig: AgentConfig = {
    id: 'example-agent',
    name: 'Example Agent',
    description: 'An example agent implementation',
    domainCode: 'test-domain',
    enabled: true,
  };

  const mockDocument: LegalDocument = {
    id: 'doc-1',
    title: 'Test Document',
    content: 'Test content',
    documentType: 'law',
    domainId: 'test-domain',
    metadata: {
      created_at: '2024-03-23T00:00:00Z',
      updated_at: '2024-03-23T00:00:00Z',
    },
  };

  const mockDomain = {
    id: '1',
    code: 'test-domain',
    name: 'Test Domain',
    description: 'Test domain description',
    active: true,
    documentTypes: ['law'],
    processingRules: [],
    complianceRequirements: [],
    metadata: {
      created_at: '2024-03-23T00:00:00Z',
      updated_at: '2024-03-23T00:00:00Z',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    agent = new ExampleAgent(mockConfig);
    await agent.initialize();

    // Mock DomainRegistry
    (DomainRegistry.getInstance as jest.Mock).mockReturnValue({
      getDomain: jest.fn().mockResolvedValue(mockDomain),
    });
  });

  it('should initialize with zero processing count', () => {
    expect(agent.getProcessingCount()).toBe(0);
  });

  it('should process a document successfully', async () => {
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };

    const result = await agent.process(context);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      processed: true,
      count: 1,
      domain: 'test-domain',
      documentId: 'doc-1',
    });
    expect(agent.getProcessingCount()).toBe(1);
  });

  it('should handle disabled state', async () => {
    agent.setEnabled(false);
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };

    const result = await agent.process(context);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Agent is disabled');
  });

  it('should handle missing domain', async () => {
    // Mock DomainRegistry to return null
    (DomainRegistry.getInstance as jest.Mock).mockReturnValue({
      getDomain: jest.fn().mockResolvedValue(null),
    });

    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };

    const result = await agent.process(context);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Domain test-domain not found');
  });

  it('should clean up resources', async () => {
    // Process a document first
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };
    await agent.process(context);
    expect(agent.getProcessingCount()).toBe(1);

    // Clean up
    await agent.cleanup();
    expect(agent.getProcessingCount()).toBe(0);
  });
}); 