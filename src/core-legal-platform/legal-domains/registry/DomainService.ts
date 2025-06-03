import { supabase } from '../../../integrations/supabase/client';
import { LegalDomain } from '../types';
import { Database } from '../../../integrations/supabase/types';

export class DomainService {
  private static instance: DomainService;

  private constructor() {}

  public static getInstance(): DomainService {
    if (!DomainService.instance) {
      DomainService.instance = new DomainService();
    }
    return DomainService.instance;
  }

  async registerDomain(domain: Omit<LegalDomain, 'id' | 'metadata'>): Promise<LegalDomain> {
    const { data, error } = await supabase
      .from('legal_domains')
      .insert({
        code: domain.code,
        name: domain.name,
        description: domain.description,
        active: domain.active,
        document_types: domain.documentTypes,
        processing_rules: JSON.stringify(domain.processingRules),
        compliance_requirements: JSON.stringify(domain.complianceRequirements),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register domain: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async getDomain(code: string): Promise<LegalDomain | null> {
    const { data, error } = await supabase
      .from('legal_domains')
      .select()
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async listDomains(): Promise<LegalDomain[]> {
    const { data, error } = await supabase
      .from('legal_domains')
      .select()
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to list domains: ${error.message}`);
    }

    return data.map(this.mapToDomain);
  }

  async updateDomain(code: string, updates: Partial<LegalDomain>): Promise<LegalDomain> {
    const { data, error } = await supabase
      .from('legal_domains')
      .update({
        name: updates.name,
        description: updates.description,
        active: updates.active,
        document_types: updates.documentTypes,
        processing_rules: updates.processingRules ? JSON.stringify(updates.processingRules) : undefined,
        compliance_requirements: updates.complianceRequirements ? JSON.stringify(updates.complianceRequirements) : undefined,
      })
      .eq('code', code)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update domain: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(data: Database['public']['Tables']['legal_domains']['Row']): LegalDomain {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      active: data.active,
      documentTypes: data.document_types,
      processingRules: JSON.parse(data.processing_rules as string),
      complianceRequirements: JSON.parse(data.compliance_requirements as string),
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  }
} 