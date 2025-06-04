import { Domain, DomainPattern } from './types';
import { CitationError } from './errors';
import { SupabaseClient } from '@supabase/supabase-js';

export class DomainPatternManager {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPatternsForDomain(domain: Domain): Promise<DomainPattern[]> {
    try {
      const { data: patterns, error } = await this.supabase
        .from('domain_patterns')
        .select('*')
        .eq('domain', domain)
        .eq('is_active', true);

      if (error) {
        throw new CitationError(
          'Failed to fetch domain patterns',
          'PATTERN_FETCH_FAILED',
          'error',
          true,
          { domain, error }
        );
      }

      return patterns || [];
    } catch (error) {
      if (error instanceof CitationError) {
        throw error;
      }
      throw new CitationError(
        'Failed to get domain patterns',
        'DOMAIN_PATTERN_ERROR',
        'error',
        true,
        { domain, error }
      );
    }
  }

  async addPattern(domain: Domain, pattern: DomainPattern): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('domain_patterns')
        .insert({
          domain,
          pattern: pattern.pattern,
          description: pattern.description,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new CitationError(
          'Failed to add domain pattern',
          'PATTERN_ADD_FAILED',
          'error',
          true,
          { domain, pattern, error }
        );
      }
    } catch (error) {
      if (error instanceof CitationError) {
        throw error;
      }
      throw new CitationError(
        'Failed to add pattern',
        'PATTERN_ADD_ERROR',
        'error',
        true,
        { domain, pattern, error }
      );
    }
  }

  async deactivatePattern(patternId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('domain_patterns')
        .update({ is_active: false })
        .eq('id', patternId);

      if (error) {
        throw new CitationError(
          'Failed to deactivate pattern',
          'PATTERN_DEACTIVATE_FAILED',
          'error',
          true,
          { patternId, error }
        );
      }
    } catch (error) {
      if (error instanceof CitationError) {
        throw error;
      }
      throw new CitationError(
        'Failed to deactivate pattern',
        'PATTERN_DEACTIVATE_ERROR',
        'error',
        true,
        { patternId, error }
      );
    }
  }
} 