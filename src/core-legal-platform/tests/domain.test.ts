import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { MessageQueue } from '../queue/MessageQueue';
import { AgentError, ErrorCode } from '../errors/AgentError';
import { Database } from '@/integrations/supabase/types';

type LegalDomain = Database['public']['Tables']['legal_domains']['Row'];
type LegalDocument = Database['public']['Tables']['legal_documents']['Row'];

describe('Multi-Domain Legal System', () => {
  let messageQueue: MessageQueue;

  beforeEach(async () => {
    messageQueue = MessageQueue.getInstance();
    // Clean up test data
    await supabase.from('queue_messages').delete().neq('id', '');
    await supabase.from('legal_hierarchy').delete().neq('id', '');
    await supabase.from('legal_documents').delete().neq('id', '');
    await supabase.from('legal_domains').delete().neq('code', 'energy');
  });

  afterEach(() => {
    messageQueue.stop();
  });

  describe('Legal Domains', () => {
    it('should create a new legal domain', async () => {
      const { data, error } = await supabase
        .from('legal_domains')
        .insert({
          code: 'tax',
          name: 'Tax Law',
          description: 'Hungarian tax law and regulations',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        code: 'tax',
        name: 'Tax Law',
        description: 'Hungarian tax law and regulations',
      });
    });

    it('should prevent duplicate domain codes', async () => {
      const { error } = await supabase
        .from('legal_domains')
        .insert({
          code: 'tax',
          name: 'Tax Law',
          description: 'Hungarian tax law and regulations',
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // Unique violation
    });

    it('should support domain hierarchy', async () => {
      const { data: parent, error: parentError } = await supabase
        .from('legal_domains')
        .insert({
          code: 'tax',
          name: 'Tax Law',
          description: 'Hungarian tax law and regulations',
        })
        .select()
        .single();

      expect(parentError).toBeNull();
      expect(parent).not.toBeNull();

      const { data: child, error: childError } = await supabase
        .from('legal_domains')
        .insert({
          code: 'vat',
          name: 'VAT Law',
          description: 'Hungarian VAT regulations',
          parent_domain_id: parent!.id,
        })
        .select()
        .single();

      expect(childError).toBeNull();
      expect(child).not.toBeNull();
      expect(child!.parent_domain_id).toBe(parent!.id);
    });
  });

  describe('Legal Documents', () => {
    it('should create a document in a specific domain', async () => {
      const { data: domain, error: domainError } = await supabase
        .from('legal_domains')
        .insert({
          code: 'tax',
          name: 'Tax Law',
          description: 'Hungarian tax law and regulations',
        })
        .select()
        .single();

      expect(domainError).toBeNull();
      expect(domain).not.toBeNull();

      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .insert({
          title: 'Test Tax Law',
          content: 'Test content',
          document_type: 'law',
          domain_id: domain!.id,
          hierarchy_level: 'statutory',
        })
        .select()
        .single();

      expect(docError).toBeNull();
      expect(document).toMatchObject({
        title: 'Test Tax Law',
        document_type: 'law',
        domain_id: domain!.id,
        hierarchy_level: 'statutory',
      });
    });

    it('should support document hierarchy', async () => {
      const { data: energyDomain } = await supabase
        .from('legal_domains')
        .select('id')
        .eq('code', 'energy')
        .single();

      expect(energyDomain).not.toBeNull();

      const { data: parent, error: parentError } = await supabase
        .from('legal_documents')
        .insert({
          title: 'Parent Law',
          content: 'Parent content',
          document_type: 'law',
          domain_id: energyDomain!.id,
        })
        .select()
        .single();

      expect(parentError).toBeNull();
      expect(parent).not.toBeNull();

      const { data: child, error: childError } = await supabase
        .from('legal_documents')
        .insert({
          title: 'Child Regulation',
          content: 'Child content',
          document_type: 'regulation',
          domain_id: energyDomain!.id,
        })
        .select()
        .single();

      expect(childError).toBeNull();
      expect(child).not.toBeNull();

      const { data: hierarchy, error: hierarchyError } = await supabase
        .from('legal_hierarchy')
        .insert({
          parent_document_id: parent!.id,
          child_document_id: child!.id,
          relationship_type: 'implements',
        })
        .select()
        .single();

      expect(hierarchyError).toBeNull();
      expect(hierarchy).toMatchObject({
        parent_document_id: parent!.id,
        child_document_id: child!.id,
        relationship_type: 'implements',
      });
    });

    it('should prevent circular references in document hierarchy', async () => {
      const { data: energyDomain } = await supabase
        .from('legal_domains')
        .select('id')
        .eq('code', 'energy')
        .single();

      expect(energyDomain).not.toBeNull();

      const { data: doc1, error: doc1Error } = await supabase
        .from('legal_documents')
        .insert({
          title: 'Document 1',
          content: 'Content 1',
          document_type: 'law',
          domain_id: energyDomain!.id,
        })
        .select()
        .single();

      expect(doc1Error).toBeNull();
      expect(doc1).not.toBeNull();

      const { data: doc2, error: doc2Error } = await supabase
        .from('legal_documents')
        .insert({
          title: 'Document 2',
          content: 'Content 2',
          document_type: 'law',
          domain_id: energyDomain!.id,
        })
        .select()
        .single();

      expect(doc2Error).toBeNull();
      expect(doc2).not.toBeNull();

      // Create first relationship
      const { error: hierarchy1Error } = await supabase
        .from('legal_hierarchy')
        .insert({
          parent_document_id: doc1!.id,
          child_document_id: doc2!.id,
          relationship_type: 'references',
        });

      expect(hierarchy1Error).toBeNull();

      // Attempt to create circular reference
      const { error: hierarchy2Error } = await supabase
        .from('legal_hierarchy')
        .insert({
          parent_document_id: doc2!.id,
          child_document_id: doc1!.id,
          relationship_type: 'references',
        });

      expect(hierarchy2Error).not.toBeNull();
    });
  });

  describe('Message Queue', () => {
    it('should enqueue and process messages', async () => {
      const messageId = await messageQueue.enqueueMessage('document_processing', {
        documentId: 'test-id',
        action: 'analyze',
      });

      expect(messageId).toBeDefined();

      const { data: message, error } = await supabase
        .from('queue_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      expect(error).toBeNull();
      expect(message).toMatchObject({
        type: 'document_processing',
        status: 'pending',
      });
    });

    it('should handle message processing errors', async () => {
      const messageId = await messageQueue.enqueueMessage('document_processing', {
        documentId: 'non-existent',
        action: 'analyze',
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: message, error } = await supabase
        .from('queue_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      expect(error).toBeNull();
      expect(message).not.toBeNull();
      expect(message!.status).toBe('failed');
      expect(message!.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should properly handle domain not found errors', async () => {
      const error = new AgentError(
        ErrorCode.DOMAIN_NOT_FOUND,
        'Domain not found',
        { domainCode: 'non-existent' }
      );

      expect(error.code).toBe(ErrorCode.DOMAIN_NOT_FOUND);
      expect(error.details).toMatchObject({ domainCode: 'non-existent' });
      expect(AgentError.isRetryable(error)).toBe(false);
    });

    it('should properly handle retryable errors', async () => {
      const error = new AgentError(
        ErrorCode.TIMEOUT_ERROR,
        'Request timed out',
        { retryCount: 1 }
      );

      expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
      expect(AgentError.isRetryable(error)).toBe(true);
    });

    it('should properly handle fatal errors', async () => {
      const error = new AgentError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid credentials',
        { userId: 'test-user' }
      );

      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(AgentError.isFatal(error)).toBe(true);
    });
  });
}); 