import { supabase } from '../../integrations/supabase/client.js';
import type { Database } from '../../integrations/supabase/types.js';

type LegalDocument = Database['public']['Tables']['legal_documents']['Row'];
type LegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert'];
type LegalChange = Database['public']['Tables']['legal_changes']['Row'];
type LegalChangeInsert = Database['public']['Tables']['legal_changes']['Insert'];
type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type ContractImpact = Database['public']['Tables']['contract_impacts']['Row'];
type ContractImpactInsert = Database['public']['Tables']['contract_impacts']['Insert'];

export class LegalDocumentService {
  // Legal Documents
  async createLegalDocument(document: LegalDocumentInsert): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getLegalDocument(id: string): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async listLegalDocuments(): Promise<LegalDocument[]> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select()
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Legal Changes
  async createLegalChange(change: LegalChangeInsert): Promise<LegalChange> {
    const { data, error } = await supabase
      .from('legal_changes')
      .insert(change)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getLegalChangesByDocument(documentId: string): Promise<LegalChange[]> {
    const { data, error } = await supabase
      .from('legal_changes')
      .select()
      .eq('document_id', documentId)
      .order('detected_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Contracts
  async createContract(contract: ContractInsert): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getContract(id: string): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async listContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select()
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Contract Impacts
  async createContractImpact(impact: ContractImpactInsert): Promise<ContractImpact> {
    const { data, error } = await supabase
      .from('contract_impacts')
      .insert(impact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getContractImpacts(contractId: string): Promise<ContractImpact[]> {
    const { data, error } = await supabase
      .from('contract_impacts')
      .select(`
        *,
        legal_changes (
          id,
          change_type,
          description,
          impact_level
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Analysis Methods
  async analyzeContractImpact(contractId: string, changeId: string): Promise<ContractImpact> {
    // Get contract and change details
    const [contract, change] = await Promise.all([
      this.getContract(contractId),
      supabase
        .from('legal_changes')
        .select()
        .eq('id', changeId)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    ]);

    // Determine impact level based on contract risk and change impact
    const impactLevel = this.calculateImpactLevel(contract.risk_level, change.impact_level);
    
    // Create impact record
    return this.createContractImpact({
      contract_id: contractId,
      change_id: changeId,
      impact_description: `Impact of ${change.change_type} on ${contract.contract_name}`,
      action_required: this.generateActionRequired(impactLevel),
      priority_level: impactLevel
    });
  }

  private calculateImpactLevel(contractRisk: string, changeImpact: string): 'low' | 'medium' | 'high' | 'urgent' {
    const riskMap: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    const impactScore = riskMap[contractRisk] * riskMap[changeImpact];
    
    if (impactScore >= 12) return 'urgent';
    if (impactScore >= 9) return 'high';
    if (impactScore >= 6) return 'medium';
    return 'low';
  }

  private generateActionRequired(priority: string): string {
    const actions = {
      'urgent': 'Immediate review and update required',
      'high': 'Review and update within 1 week',
      'medium': 'Review and update within 2 weeks',
      'low': 'Review and update within 1 month'
    };
    return actions[priority as keyof typeof actions];
  }
} 