import { LegalDocument, DocumentType } from '../../legal-domains/types';
import { DomainRegistry } from '../../legal-domains/registry/DomainRegistry';
import { LegalDocumentService } from '../../../services/legal/legalDocumentService';
import type { Database } from '../../../integrations/supabase/types';
import NodeCache from 'node-cache';
import { supabase } from '../../../integrations/supabase/client';

type DbLegalDocument = Database['public']['Tables']['legal_documents']['Row'];
type DbLegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert'];

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  domainCode: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  cacheConfig?: {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum number of items in cache
  };
  batchConfig?: {
    maxBatchSize: number; // Maximum number of documents to process in a batch
    batchTimeout: number; // Maximum time to wait for batch completion in milliseconds
  };
  securityConfig?: {
    requireAuth: boolean; // Whether authentication is required
    allowedRoles: string[]; // Roles that can access this agent
    allowedDomains: string[]; // Domains this agent can access
  };
}

export interface AgentContext {
  document: LegalDocument;
  domain: string;
  metadata?: Record<string, any>;
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
  error?: Error;
}

export interface BatchProcessingResult {
  total: number;
  successful: number;
  failed: number;
  results: AgentResult[];
}

export class AgentSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentSecurityError';
  }
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected domainRegistry: DomainRegistry;
  protected documentService: LegalDocumentService;
  protected documentCache: NodeCache;
  protected batchQueue: LegalDocument[] = [];
  protected batchTimeout: NodeJS.Timeout | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
    this.domainRegistry = DomainRegistry.getInstance();
    this.documentService = new LegalDocumentService();
    
    // Initialize cache with config
    this.documentCache = new NodeCache({
      stdTTL: config.cacheConfig?.ttl ?? 300, // Default 5 minutes
      maxKeys: config.cacheConfig?.maxSize ?? 1000, // Default 1000 items
      checkperiod: 60, // Check for expired keys every minute
    });
  }

  /**
   * Initialize the agent with required resources and connections
   */
  public abstract initialize(): Promise<void>;

  /**
   * Process a document using the agent's specific logic
   */
  public abstract process(context: AgentContext): Promise<AgentResult>;

  /**
   * Process a batch of documents
   */
  public async processBatch(documents: LegalDocument[], user?: AgentContext['user']): Promise<BatchProcessingResult> {
    // Check security for batch processing
    if (this.config.securityConfig?.requireAuth && !user) {
      throw new AgentSecurityError('Authentication required for batch processing');
    }

    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions for batch processing');
    }

    const results: AgentResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process documents in chunks to avoid memory issues
    const chunkSize = this.config.batchConfig?.maxBatchSize ?? 10;
    for (let i = 0; i < documents.length; i += chunkSize) {
      const chunk = documents.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(doc => this.process({ document: doc, domain: this.config.domainCode, user }))
      );
      
      chunkResults.forEach(result => {
        results.push(result);
        if (result.success) successful++;
        else failed++;
      });
    }

    return {
      total: documents.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Queue a document for batch processing
   */
  public queueForBatchProcessing(document: LegalDocument, user?: AgentContext['user']): void {
    if (this.config.securityConfig?.requireAuth && !user) {
      throw new AgentSecurityError('Authentication required for batch processing');
    }

    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions for batch processing');
    }

    this.batchQueue.push(document);

    // Process batch if it reaches max size
    if (this.batchQueue.length >= (this.config.batchConfig?.maxBatchSize ?? 10)) {
      this.processBatchQueue(user);
    } else if (!this.batchTimeout) {
      // Set timeout for batch processing
      this.batchTimeout = setTimeout(
        () => this.processBatchQueue(user),
        this.config.batchConfig?.batchTimeout ?? 5000
      );
    }
  }

  /**
   * Process the current batch queue
   */
  private async processBatchQueue(user?: AgentContext['user']): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length > 0) {
      const batch = [...this.batchQueue];
      this.batchQueue = [];
      await this.processBatch(batch, user);
    }
  }

  /**
   * Clean up resources when the agent is no longer needed
   */
  public async cleanup(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    await this.processBatchQueue();
    this.documentCache.flushAll();
  }

  /**
   * Validate the agent's configuration
   */
  protected validateConfig(): void {
    if (!this.config.id || !this.config.name || !this.config.domainCode) {
      throw new Error('Agent must have an id, name, and domain code');
    }
  }

  /**
   * Get the agent's current configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update the agent's configuration
   */
  public async updateConfig(updates: Partial<AgentConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };
    this.validateConfig();
  }

  /**
   * Check if the agent is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable the agent
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get the agent's domain
   */
  public async getDomain() {
    return this.domainRegistry.getDomain(this.config.domainCode);
  }

  /**
   * Check if user has required permissions
   */
  protected hasRequiredPermissions(user: AgentContext['user']): boolean {
    if (!user) return false;

    const { allowedRoles, allowedDomains } = this.config.securityConfig ?? {};
    
    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return false;
    }

    // Check domain permissions
    if (allowedDomains && !allowedDomains.includes(this.config.domainCode)) {
      return false;
    }

    return true;
  }

  /**
   * Verify user authentication
   */
  protected async verifyAuthentication(userId: string): Promise<boolean> {
    if (!this.config.securityConfig?.requireAuth) {
      return true;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(userId);
      return !error && !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert database document to LegalDocument
   */
  private convertDbToLegalDocument(dbDoc: DbLegalDocument): LegalDocument {
    return {
      id: dbDoc.id,
      title: dbDoc.title,
      content: dbDoc.content,
      documentType: dbDoc.document_type as DocumentType,
      domainId: this.config.domainCode,
      metadata: {
        created_at: dbDoc.created_at,
        updated_at: dbDoc.updated_at,
      },
    };
  }

  /**
   * Convert LegalDocument to database insert type
   */
  private convertLegalToDbDocument(doc: Omit<LegalDocument, 'id' | 'metadata'>): DbLegalDocumentInsert {
    return {
      title: doc.title,
      content: doc.content,
      document_type: doc.documentType as 'law' | 'regulation' | 'policy' | 'decision' | 'other',
      source_url: null,
      publication_date: null,
    };
  }

  /**
   * Get a document by ID with caching
   */
  protected async getDocument(documentId: string, user?: AgentContext['user']): Promise<LegalDocument | null> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to access document');
    }

    // Check cache first
    const cached = this.documentCache.get<LegalDocument>(documentId);
    if (cached) {
      return cached;
    }

    try {
      const dbDoc = await this.documentService.getLegalDocument(documentId);
      const document = this.convertDbToLegalDocument(dbDoc);
      this.documentCache.set(documentId, document);
      return document;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a document
   */
  protected async updateDocument(documentId: string, updates: Partial<LegalDocument>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to update document');
    }

    const dbDoc = await this.documentService.getLegalDocument(documentId);
    const updatedDoc = {
      ...dbDoc,
      title: updates.title ?? dbDoc.title,
      content: updates.content ?? dbDoc.content,
      document_type: updates.documentType as 'law' | 'regulation' | 'policy' | 'decision' | 'other' ?? dbDoc.document_type,
    };
    const document = this.convertDbToLegalDocument(updatedDoc);
    this.documentCache.set(documentId, document);
    return document;
  }

  /**
   * Create a new document
   */
  protected async createDocument(document: Omit<LegalDocument, 'id' | 'metadata'>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to create document');
    }

    const dbDoc = this.convertLegalToDbDocument(document);
    const created = await this.documentService.createLegalDocument(dbDoc);
    const newDocument = this.convertDbToLegalDocument(created);
    this.documentCache.set(created.id, newDocument);
    return newDocument;
  }

  /**
   * Handle errors during agent operations
   */
  public handleError(error: Error, context: AgentContext): AgentResult {
    return {
      success: false,
      message: `Error processing document ${context.document.id}: ${error.message}`,
      error,
    };
  }
} 