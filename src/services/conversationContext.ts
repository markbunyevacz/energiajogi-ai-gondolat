export interface ConversationMessage {
  id: string;
  question: string;
  answer: string;
  agentType: string;
  timestamp: Date;
  sources: string[];
}

export interface ConversationContext {
  sessionId: string;
  messages: ConversationMessage[];
  currentTopic?: string;
  documentContext: string[];
  userRole: string;
}

class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();

  getContext(sessionId: string): ConversationContext | null {
    return this.contexts.get(sessionId) || null;
  }

  updateContext(sessionId: string, message: ConversationMessage, userRole: string = 'jogász') {
    let context = this.contexts.get(sessionId);
    
    if (!context) {
      context = {
        sessionId,
        messages: [],
        documentContext: [],
        userRole
      };
    }

    context.messages.push(message);
    
    // Keep only last 10 messages for performance
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    // Update current topic based on recent messages
    context.currentTopic = this.extractTopic(context.messages);
    
    this.contexts.set(sessionId, context);
    
    return context;
  }

  private extractTopic(messages: ConversationMessage[]): string {
    const recentQuestions = messages.slice(-3).map(m => m.question).join(' ');
    
    // Simple keyword-based topic extraction
    const topics = {
      'energiaszerződés': ['energia', 'szerződés', 'áram', 'gáz'],
      'megfelelőség': ['megfelelőség', 'előírás', 'szabályozás'],
      'jogi_kutatás': ['jogszabály', 'törvény', 'rendelet']
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => recentQuestions.toLowerCase().includes(keyword))) {
        return topic;
      }
    }

    return 'általános';
  }

  getRecentQuestions(sessionId: string, count: number = 5): string[] {
    const context = this.contexts.get(sessionId);
    if (!context) return [];
    
    return context.messages
      .slice(-count)
      .map(m => m.question);
  }

  clearContext(sessionId: string) {
    this.contexts.delete(sessionId);
  }
}

export const conversationContextManager = new ConversationContextManager();
