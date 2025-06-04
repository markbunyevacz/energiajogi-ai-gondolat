import { Domain } from './types';
import { CitationError } from './errors';
import { SupabaseClient } from '@supabase/supabase-js';

export class SecurityManager {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateAccess(
    userId: string,
    domain: Domain,
    documentId: string
  ): Promise<boolean> {
    try {
      // Check user's domain permissions
      const { data: permissions, error: permError } = await this.supabase
        .from('user_domain_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('domain', domain)
        .single();

      if (permError) {
        throw new CitationError(
          'Failed to check domain permissions',
          'PERMISSION_CHECK_FAILED',
          'error',
          true,
          { userId, domain, error: permError }
        );
      }

      if (!permissions?.has_access) {
        return false;
      }

      // Check document-specific access
      const { data: docAccess, error: docError } = await this.supabase
        .from('document_access_control')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .single();

      if (docError) {
        throw new CitationError(
          'Failed to check document access',
          'DOCUMENT_ACCESS_CHECK_FAILED',
          'error',
          true,
          { documentId, userId, error: docError }
        );
      }

      return docAccess?.has_access ?? false;
    } catch (error) {
      if (error instanceof CitationError) {
        throw error;
      }
      throw new CitationError(
        'Security validation failed',
        'SECURITY_VALIDATION_FAILED',
        'error',
        true,
        { userId, domain, documentId, error }
      );
    }
  }

  async grantAccess(
    userId: string,
    domain: Domain,
    documentId: string
  ): Promise<void> {
    try {
      // Grant domain access if not already granted
      await this.supabase
        .from('user_domain_permissions')
        .upsert({
          user_id: userId,
          domain,
          has_access: true,
          granted_at: new Date().toISOString()
        });

      // Grant document access
      await this.supabase
        .from('document_access_control')
        .upsert({
          user_id: userId,
          document_id: documentId,
          has_access: true,
          granted_at: new Date().toISOString()
        });
    } catch (error) {
      throw new CitationError(
        'Failed to grant access',
        'ACCESS_GRANT_FAILED',
        'error',
        true,
        { userId, domain, documentId, error }
      );
    }
  }

  async revokeAccess(
    userId: string,
    domain: Domain,
    documentId: string
  ): Promise<void> {
    try {
      // Revoke document access
      await this.supabase
        .from('document_access_control')
        .update({ has_access: false, revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('document_id', documentId);

      // Check if user has access to other documents in the domain
      const { data: otherDocs } = await this.supabase
        .from('document_access_control')
        .select('document_id')
        .eq('user_id', userId)
        .eq('has_access', true);

      // If no other documents, revoke domain access
      if (!otherDocs?.length) {
        await this.supabase
          .from('user_domain_permissions')
          .update({ has_access: false, revoked_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('domain', domain);
      }
    } catch (error) {
      throw new CitationError(
        'Failed to revoke access',
        'ACCESS_REVOKE_FAILED',
        'error',
        true,
        { userId, domain, documentId, error }
      );
    }
  }
} 