import { BaseAgent, AgentConfig, AgentContext, AgentResult, AgentSecurityError, BatchProcessingResult } from '../BaseAgent';
import { DomainRegistry } from '../../../legal-domains/registry/DomainRegistry';
import { LegalDocument } from '../../../legal-domains/types';
import { supabase } from '../../../integrations/supabase/client';

// Mock dependencies
jest.mock('../../../legal-domains/registry/DomainRegistry');
jest.mock('../../../integrations/supabase/client');

// Create a concrete test implementation of BaseAgent
class TestAgent extends BaseAgent {
  public async initialize(): Promise<void> {
    // Test implementation
  }

  public async process(context: AgentContext): Promise<AgentResult> {
    return {
      success: true,
      message: 'Test processing complete',
      data: { processed: true },
    };
  }

  // Make protected methods public for testing
  public async getDocument(id: string, user?: { id: string; role: string; permissions: string[] }): Promise<LegalDocument> {
    const doc = await super.getDocument(id, user);
    if (!doc) {
      throw new Error('Document not found');
    }
    return doc;
  }

  public async processBatch(
    documents: LegalDocument[],
    user?: { id: string; role: string; permissions: string[] }
  ): Promise<BatchProcessingResult> {
    return super.processBatch(documents, user);
  }

  public async queueForBatchProcessing(
    document: LegalDocument,
    user?: { id: string; role: string; permissions: string[] }
  ): Promise<void> {
    return super.queueForBatchProcessing(document, user);
  }

  public async cleanup(): Promise<void> {
    return super.cleanup();
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  const mockConfig: AgentConfig = {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'A test agent implementation',
    domainCode: 'test-domain',
    enabled: true,
    securityConfig: {
      requireAuth: true,
      allowedRoles: ['admin', 'editor'],
      allowedDomains: ['test-domain'],
    },
    cacheConfig: {
      ttl: 300,
      maxSize: 1000,
    },
    batchConfig: {
      maxBatchSize: 5,
      batchTimeout: 1000,
    },
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

  const mockUser = {
    id: 'user-1',
    role: 'admin',
    permissions: ['read', 'write'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new TestAgent(mockConfig);
  });

  it('should create an agent with valid configuration', () => {
    expect(agent.getConfig()).toEqual(mockConfig);
  });

  it('should throw error with invalid configuration', () => {
    const invalidConfig = {
      id: '',
      name: '',
      description: 'Test',
      domainCode: '',
      enabled: true,
    };

    expect(() => new TestAgent(invalidConfig as AgentConfig)).toThrow(
      'Agent must have an id, name, and domain code'
    );
  });

  it('should update configuration', async () => {
    const updates = {
      name: 'Updated Test Agent',
      description: 'Updated description',
    };

    await agent.updateConfig(updates);
    expect(agent.getConfig()).toEqual({
      ...mockConfig,
      ...updates,
    });
  });

  it('should check if agent is enabled', () => {
    expect(agent.isEnabled()).toBe(true);
    agent.setEnabled(false);
    expect(agent.isEnabled()).toBe(false);
  });

  it('should process a document', async () => {
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };

    const result = await agent.process(context);
    expect(result).toEqual({
      success: true,
      message: 'Test processing complete',
      data: { processed: true },
    });
  });

  it('should handle errors during processing', async () => {
    const error = new Error('Test error');
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
    };

    const result = agent.handleError(error, context);
    expect(result).toEqual({
      success: false,
      message: `Error processing document ${mockDocument.id}: ${error.message}`,
      error,
    });
  });

  describe('Security Features', () => {
    it('should require authentication when configured', async () => {
      const context: AgentContext = {
        document: mockDocument,
        domain: 'test-domain',
      };

      await expect(agent.getDocument('doc-1')).rejects.toThrow(AgentSecurityError);
    });

    it('should verify user authentication', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const isAuthenticated = await (agent as any).verifyAuthentication('user-1');
      expect(isAuthenticated).toBe(true);
    });

    it('should check user permissions', async () => {
      const hasPermissions = (agent as any).hasRequiredPermissions(mockUser);
      expect(hasPermissions).toBe(true);
    });

    it('should reject unauthorized users', async () => {
      const unauthorizedUser = {
        id: 'user-2',
        role: 'viewer',
        permissions: ['read'],
      };

      const hasPermissions = (agent as any).hasRequiredPermissions(unauthorizedUser);
      expect(hasPermissions).toBe(false);
    });
  });

  describe('Performance Features', () => {
    it('should cache document retrievals', async () => {
      const context: AgentContext = {
        document: mockDocument,
        domain: 'test-domain',
        user: mockUser,
      };

      // First call should hit the database
      await agent.getDocument('doc-1', mockUser);
      expect(supabase.from).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await agent.getDocument('doc-1', mockUser);
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should process documents in batches', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        ...mockDocument,
        id: `doc-${i}`,
      }));

      const result = await agent.processBatch(documents, mockUser);
      expect(result.total).toBe(10);
      expect(result.successful).toBe(10);
      expect(result.failed).toBe(0);
    });

    it('should queue documents for batch processing', async () => {
      jest.useFakeTimers();

      // Queue documents
      for (let i = 0; i < 3; i++) {
        agent.queueForBatchProcessing({ ...mockDocument, id: `doc-${i}` }, mockUser);
      }

      // Process should not be called yet
      expect(agent.process).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // Process should be called
      expect(agent.process).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it('should clean up resources', async () => {
      // Queue some documents
      agent.queueForBatchProcessing(mockDocument, mockUser);

      // Clean up
      await agent.cleanup();

      // Cache should be empty
      const cached = (agent as any).documentCache.get('doc-1');
      expect(cached).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      await expect(agent.getDocument('doc-1', mockUser)).rejects.toThrow(AgentSecurityError);
    });

    it('should handle permission errors', async () => {
      const unauthorizedUser = {
        id: 'user-2',
        role: 'viewer',
        permissions: ['read'],
      };

      await expect(agent.getDocument('doc-1', unauthorizedUser)).rejects.toThrow(AgentSecurityError);
    });

    it('should handle batch processing errors', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        ...mockDocument,
        id: `doc-${i}`,
      }));

      // Mock process to fail for some documents
      (agent.process as jest.Mock).mockImplementation((context) => {
        if (context.document.id === 'doc-5') {
          throw new Error('Processing failed');
        }
        return Promise.resolve({
          success: true,
          message: 'Success',
        });
      });

      const result = await agent.processBatch(documents, mockUser);
      expect(result.total).toBe(10);
      expect(result.successful).toBe(9);
      expect(result.failed).toBe(1);
    });
  });
}); 