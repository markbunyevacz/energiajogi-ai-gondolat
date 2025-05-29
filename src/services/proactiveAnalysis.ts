
import { supabase } from '@/integrations/supabase/client';

export interface ProactiveRecommendation {
  id: string;
  type: 'contract_review' | 'compliance_alert' | 'legal_update' | 'risk_assessment';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  relatedDocuments: string[];
  createdAt: Date;
}

class ProactiveAnalysisService {
  async generateRecommendations(userId: string): Promise<ProactiveRecommendation[]> {
    const recommendations: ProactiveRecommendation[] = [];

    // Analyze recent document uploads
    const recentDocuments = await this.getRecentDocuments(userId);
    
    // Check for contracts that need review
    const contractReviews = await this.analyzeContractsForReview(recentDocuments);
    recommendations.push(...contractReviews);

    // Check for compliance issues
    const complianceAlerts = await this.generateComplianceAlerts(userId);
    recommendations.push(...complianceAlerts);

    // Check for legal updates
    const legalUpdates = await this.checkForLegalUpdates();
    recommendations.push(...legalUpdates);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async getRecentDocuments(userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('uploaded_by', userId)
      .gte('upload_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching recent documents:', error);
      return [];
    }

    return data || [];
  }

  private async analyzeContractsForReview(documents: any[]): Promise<ProactiveRecommendation[]> {
    const contracts = documents.filter(doc => doc.type === 'szerződés');
    const recommendations: ProactiveRecommendation[] = [];

    for (const contract of contracts) {
      // Simple heuristic: contracts uploaded more than 7 days ago might need review
      const uploadDate = new Date(contract.upload_date);
      const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpload > 7) {
        recommendations.push({
          id: `contract-review-${contract.id}`,
          type: 'contract_review',
          title: `Szerződés áttekintés javasolt: ${contract.title}`,
          description: 'Ez a szerződés már egy hete fel van töltve, de még nem történt alapos elemzés. Javasoljuk a kockázatelemzés elvégzését.',
          priority: 'medium',
          actionable: true,
          relatedDocuments: [contract.id],
          createdAt: new Date()
        });
      }
    }

    return recommendations;
  }

  private async generateComplianceAlerts(userId: string): Promise<ProactiveRecommendation[]> {
    // Check for common compliance issues based on document content
    const { data: analyses, error } = await supabase
      .from('contract_analyses')
      .select('*')
      .eq('analyzed_by', userId)
      .eq('risk_level', 'high')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !analyses || analyses.length === 0) {
      return [];
    }

    return [{
      id: 'compliance-alert-high-risk',
      type: 'compliance_alert',
      title: 'Magas kockázatú szerződések észlelve',
      description: `${analyses.length} szerződés tartalmaz magas kockázatú elemeket. Azonnali áttekintés szükséges.`,
      priority: 'high',
      actionable: true,
      relatedDocuments: analyses.map(a => a.contract_id).filter(Boolean),
      createdAt: new Date()
    }];
  }

  private async checkForLegalUpdates(): Promise<ProactiveRecommendation[]> {
    // In a real implementation, this would check external legal databases
    // For now, we'll return a mock recommendation
    return [{
      id: 'legal-update-energy',
      type: 'legal_update',
      title: 'Új energiajogi rendelet hatályba lépése',
      description: 'A MEKH új rendelete változásokat hoz az energiaszerződések területén. Ellenőrizze a meglévő szerződéseket.',
      priority: 'medium',
      actionable: true,
      relatedDocuments: [],
      createdAt: new Date()
    }];
  }
}

export const proactiveAnalysisService = new ProactiveAnalysisService();
