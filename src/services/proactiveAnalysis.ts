import { supabase } from '@/integrations/supabase/client';

export interface ProactiveRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'efficiency' | 'risk' | 'compliance' | 'opportunity';
  actionUrl?: string;
  estimatedImpact?: string;
}

interface AnalysisResult {
  type: string;
  confidence: number;
  data: Record<string, unknown>;
  timestamp: string;
}

interface AnalysisContext {
  documentId: string;
  userId: string;
  sessionId: string;
  metadata: Record<string, unknown>;
}

class ProactiveAnalysisService {
  async generateRecommendations(userId: string): Promise<ProactiveRecommendation[]> {
    try {
      // Fetch recent user activity
      const { data: recentSessions } = await supabase
        .from('qa_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch user's document interactions
      const { data: documents } = await supabase
        .from('documents')
        .select('type, metadata, created_at')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Analyze patterns and generate recommendations
      const recommendations: ProactiveRecommendation[] = [];

      // Analyze question patterns
      if (recentSessions && recentSessions.length > 0) {
        const questionTopics = this.analyzeQuestionTopics(recentSessions);
        recommendations.push(...this.generateTopicBasedRecommendations(questionTopics));
      }

      // Analyze document patterns
      if (documents && documents.length > 0) {
        const documentPatterns = this.analyzeDocumentPatterns(documents);
        recommendations.push(...this.generateDocumentBasedRecommendations(documentPatterns));
      }

      // Add general recommendations if no specific patterns found
      if (recommendations.length === 0) {
        recommendations.push(...this.getGeneralRecommendations());
      }

      return recommendations.slice(0, 6); // Limit to 6 recommendations
    } catch (error) {
      console.error('Error generating proactive recommendations:', error);
      return this.getGeneralRecommendations();
    }
  }

  private analyzeQuestionTopics(sessions: any[]): string[] {
    const topics: string[] = [];
    
    sessions.forEach(session => {
      const question = session.question.toLowerCase();
      
      if (question.includes('szerződés') || question.includes('contract')) {
        topics.push('contract');
      }
      if (question.includes('megfelelőség') || question.includes('compliance')) {
        topics.push('compliance');
      }
      if (question.includes('energia') || question.includes('energy')) {
        topics.push('energy');
      }
      if (question.includes('jog') || question.includes('legal')) {
        topics.push('legal');
      }
    });

    return [...new Set(topics)]; // Remove duplicates
  }

  private analyzeDocumentPatterns(documents: any[]): string[] {
    const patterns: string[] = [];
    
    documents.forEach(doc => {
      patterns.push(doc.type);
    });

    return [...new Set(patterns)];
  }

  private generateTopicBasedRecommendations(topics: string[]): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = [];

    if (topics.includes('contract')) {
      recommendations.push({
        id: 'contract-analysis',
        title: 'Szerződés Elemzés Optimalizálás',
        description: 'A legutóbbi szerződéses kérdései alapján javasoljuk automatizált szerződés elemzés beállítását.',
        priority: 'high',
        category: 'efficiency',
        actionUrl: '/contract-analysis',
        estimatedImpact: '30% időmegtakarítás'
      });
    }

    if (topics.includes('compliance')) {
      recommendations.push({
        id: 'compliance-monitoring',
        title: 'Megfelelőségi Monitoring',
        description: 'Állítson be proaktív megfelelőségi figyelmeztető rendszert a gyakori kérdései alapján.',
        priority: 'medium',
        category: 'compliance',
        estimatedImpact: 'Kockázat csökkentés'
      });
    }

    if (topics.includes('energy')) {
      recommendations.push({
        id: 'energy-law-updates',
        title: 'Energiajogi Frissítések',
        description: 'Iratkozzon fel az energiajogi változások automatikus értesítéseire.',
        priority: 'medium',
        category: 'opportunity',
        estimatedImpact: 'Naprakész jogismeret'
      });
    }

    return recommendations;
  }

  private generateDocumentBasedRecommendations(patterns: string[]): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = [];

    if (patterns.includes('szerződés')) {
      recommendations.push({
        id: 'contract-templates',
        title: 'Szerződés Sablonok',
        description: 'Hozzon létre szabványosított szerződés sablonokat a feltöltött dokumentumok alapján.',
        priority: 'medium',
        category: 'efficiency',
        estimatedImpact: '50% gyorsabb szerződéskészítés'
      });
    }

    if (patterns.includes('rendelet')) {
      recommendations.push({
        id: 'regulation-tracking',
        title: 'Rendelet Követés',
        description: 'Automatikus értesítés beállítása a releváns rendeletek változásairól.',
        priority: 'high',
        category: 'compliance',
        estimatedImpact: '100% megfelelőség'
      });
    }

    return recommendations;
  }

  private getGeneralRecommendations(): ProactiveRecommendation[] {
    return [
      {
        id: 'document-upload',
        title: 'Dokumentum Feltöltés',
        description: 'Töltse fel energiajogi dokumentumait a személyre szabott elemzésekért.',
        priority: 'medium',
        category: 'opportunity',
        actionUrl: '/documents',
        estimatedImpact: 'Pontosabb válaszok'
      },
      {
        id: 'ai-training',
        title: 'AI Rendszer Betanítás',
        description: 'Segítsen betanítani az AI rendszert specifikus kérdésekkel.',
        priority: 'low',
        category: 'efficiency',
        actionUrl: '/qa',
        estimatedImpact: 'Jobb AI teljesítmény'
      }
    ];
  }

  async trackRecommendationClick(recommendationId: string, userId: string): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: 'recommendation_clicked',
        event_data: { recommendation_id: recommendationId }
      });
    } catch (error) {
      console.error('Error tracking recommendation click:', error);
    }
  }
}

export const proactiveAnalysisService = new ProactiveAnalysisService();
