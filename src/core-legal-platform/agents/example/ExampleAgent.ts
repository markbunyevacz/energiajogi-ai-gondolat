import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '../base-agents/BaseAgent';
import { LegalDocumentService } from '../../../services/legal/legalDocumentService';
import { DomainRegistry } from '../../../legal-domains/registry/DomainRegistry';
import { LegalDocument, DocumentType } from '../../../legal-domains/types/index';
import NodeCache from 'node-cache';
import { supabase } from '../../../integrations/supabase/client';
import type { Database } from '../../../integrations/supabase/types';

export class ExampleAgent extends BaseAgent {
  private processingCount: number = 0;

  constructor(config: AgentConfig) {
    super(config);
  }

  public async initialize(): Promise<void> {
    // Initialize any required resources
    this.processingCount = 0;
    console.log(`Initialized ${this.config.name} agent`);
  }

  public async process(context: AgentContext): Promise<AgentResult> {
    try {
      if (!this.isEnabled()) {
        throw new Error('Agent is disabled');
      }

      // Example processing logic
      this.processingCount++;
      const domain = await this.getDomain();
      
      if (!domain) {
        throw new Error(`Domain ${this.config.domainCode} not found`);
      }

      // Process the document based on domain rules
      const result = {
        processed: true,
        count: this.processingCount,
        domain: domain.code,
        documentId: context.document.id,
      };

      return {
        success: true,
        message: `Successfully processed document ${context.document.id}`,
        data: result,
      };
    } catch (error) {
      return this.handleError(error as Error, context);
    }
  }

  public async cleanup(): Promise<void> {
    // Clean up any resources
    this.processingCount = 0;
    console.log(`Cleaned up ${this.config.name} agent`);
  }

  public getProcessingCount(): number {
    return this.processingCount;
  }

  public handleError(error: Error, context: AgentContext): AgentResult {
    // Implement error handling logic
    return {
      success: false,
      message: `Error processing document ${context.document.id}: ${error.message}`,
      error: error,
    };
  }

  protected async getDocument(documentId: string, user?: AgentContext['user']): Promise<LegalDocument | null> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new Error('Insufficient permissions to access document');
    }

    // Check cache first
    const cached = this.documentCache.get<LegalDocument>(documentId);
    if (cached) {
      return cached;
    }

    try {
      const dbDoc = await this.documentService.getLegalDocument(documentId);
      if (!dbDoc) return null;

      const document: LegalDocument = {
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

      this.documentCache.set(documentId, document);
      return document;
    } catch (error) {
      return null;
    }
  }

  protected async updateDocument(documentId: string, updates: Partial<LegalDocument>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new Error('Insufficient permissions to update document');
    }

    const dbDoc = await this.documentService.getLegalDocument(documentId);
    if (!dbDoc) {
      throw new Error('Document not found');
    }

    const updatedDoc = {
      ...dbDoc,
      title: updates.title ?? dbDoc.title,
      content: updates.content ?? dbDoc.content,
      document_type: updates.documentType as 'law' | 'regulation' | 'policy' | 'decision' | 'other' ?? dbDoc.document_type,
    };

    const document: LegalDocument = {
      id: updatedDoc.id,
      title: updatedDoc.title,
      content: updatedDoc.content,
      documentType: updatedDoc.document_type as DocumentType,
      domainId: this.config.domainCode,
      metadata: {
        created_at: updatedDoc.created_at,
        updated_at: updatedDoc.updated_at,
      },
    };

    this.documentCache.set(documentId, document);
    return document;
  }

  protected async createDocument(document: Omit<LegalDocument, 'id' | 'metadata'>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new Error('Insufficient permissions to create document');
    }

    const dbDoc = {
      title: document.title,
      content: document.content,
      document_type: document.documentType as 'law' | 'regulation' | 'policy' | 'decision' | 'other',
      source_url: null,
      publication_date: null,
    };

    const created = await this.documentService.createLegalDocument(dbDoc);
    const newDocument: LegalDocument = {
      id: created.id,
      title: created.title,
      content: created.content,
      documentType: created.document_type as DocumentType,
      domainId: this.config.domainCode,
      metadata: {
        created_at: created.created_at,
        updated_at: created.updated_at,
      },
    };

    this.documentCache.set(created.id, newDocument);
    return newDocument;
  }

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
}

export class AgentSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentSecurityError';
  }
}

type DbLegalDocument = Database['public']['Tables']['legal_documents']['Row'];
type DbLegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert']; 