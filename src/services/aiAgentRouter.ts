
export type AgentType = 'contract' | 'legal_research' | 'compliance' | 'general';

export interface AgentContext {
  previousQuestions: string[];
  documentTypes: string[];
  userRole: string;
  sessionHistory: any[];
}

export interface AgentResponse {
  agentType: AgentType;
  confidence: number;
  reasoning: string;
  suggestedPrompt: string;
}

class AIAgentRouter {
  private contractKeywords = [
    'szerződés', 'megállapodás', 'feltétel', 'felmondás', 'módosítás',
    'kötelezettség', 'jog', 'kártérítés', 'garancia', 'szavatosság'
  ];

  private legalResearchKeywords = [
    'jogszabály', 'törvény', 'rendelet', 'határozat', 'precedens',
    'bírósági', 'ítélet', 'jogi', 'értelmezés', 'norma'
  ];

  private complianceKeywords = [
    'megfelelőség', 'előírás', 'szabályozás', 'ellenőrzés', 'audit',
    'kockázat', 'biztonság', 'adatvédelem', 'gdpr', 'mekh'
  ];

  analyzeQuestion(question: string, context?: AgentContext): AgentResponse {
    const questionLower = question.toLowerCase();
    const scores = {
      contract: this.calculateScore(questionLower, this.contractKeywords),
      legal_research: this.calculateScore(questionLower, this.legalResearchKeywords),
      compliance: this.calculateScore(questionLower, this.complianceKeywords),
      general: 0.3 // Base score for general queries
    };

    // Add context-based scoring
    if (context) {
      this.adjustScoresWithContext(scores, context);
    }

    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as AgentType] > scores[b[0] as AgentType] ? a : b
    );

    const agentType = bestMatch[0] as AgentType;
    const confidence = bestMatch[1];

    return {
      agentType,
      confidence,
      reasoning: this.getReasoningForAgent(agentType, confidence),
      suggestedPrompt: this.enhancePromptForAgent(question, agentType)
    };
  }

  private calculateScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }

  private adjustScoresWithContext(scores: Record<AgentType, number>, context: AgentContext) {
    // Boost scores based on recent questions
    const recentQuestions = context.previousQuestions.slice(0, 3).join(' ').toLowerCase();
    
    if (recentQuestions.includes('szerződés')) {
      scores.contract += 0.2;
    }
    
    if (context.documentTypes.includes('szerződés')) {
      scores.contract += 0.3;
    }

    // Role-based adjustments
    if (context.userRole === 'jogász') {
      scores.legal_research += 0.1;
    }
  }

  private getReasoningForAgent(agentType: AgentType, confidence: number): string {
    const reasonings = {
      contract: 'Szerződéses elemzésre specializált ágens kiválasztva a kérdésben található szerződéses fogalmak alapján.',
      legal_research: 'Jogi kutatási ágens kiválasztva a jogszabályi hivatkozások miatt.',
      compliance: 'Megfelelőségi ágens kiválasztva a szabályozási kérdések alapján.',
      general: 'Általános ágens kiválasztva, mivel a kérdés nem tartozik specifikus szakterülethez.'
    };

    return reasonings[agentType] + ` (Megbízhatóság: ${Math.round(confidence * 100)}%)`;
  }

  private enhancePromptForAgent(question: string, agentType: AgentType): string {
    const enhancements = {
      contract: `Szerződéses szakértőként elemezze a következő kérdést, különös figyelmet fordítva a jogi kötelezettségekre és kockázatokra: ${question}`,
      legal_research: `Jogi kutatási szakértőként válaszoljon a kérdésre, hivatkozva a releváns jogszabályokra és precedensekre: ${question}`,
      compliance: `Megfelelőségi szakértőként értékelje a kérdést, azonosítva a potenciális szabályozási kockázatokat: ${question}`,
      general: `Jogi szakértőként adjon átfogó választ a következő kérdésre: ${question}`
    };

    return enhancements[agentType];
  }
}

export const aiAgentRouter = new AIAgentRouter();
