
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2 } from 'lucide-react';
import { aiAgentRouter, AgentContext } from '@/services/aiAgentRouter';
import { conversationContextManager } from '@/services/conversationContext';
import { AgentIndicator } from '@/components/AI/AgentIndicator';
import { useAuth } from '@/hooks/useAuth';

interface QuestionInputProps {
  onSubmit: (question: string, agentType?: string, conversationContext?: any) => void;
  isLoading: boolean;
  results?: any;
  selectedQuestion: string;
  onQuestionChange: (question: string) => void;
}

export function QuestionInput({ 
  onSubmit, 
  isLoading, 
  selectedQuestion, 
  onQuestionChange 
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [agentAnalysis, setAgentAnalysis] = useState<any>(null);
  const { user, profile } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuestion = selectedQuestion || question;
    if (finalQuestion.trim() && user) {
      // Get conversation context for this session
      const sessionId = user.id;
      const currentContext = conversationContextManager.getContext(sessionId);
      
      // Get recent questions for context
      const recentQuestions = conversationContextManager.getRecentQuestions(sessionId, 3);
      
      // Analyze question with AI agent router
      const context: AgentContext = {
        previousQuestions: recentQuestions,
        documentTypes: [], // This would come from uploaded documents
        userRole: profile?.role || 'jogász',
        sessionHistory: currentContext?.messages || []
      };

      const analysis = aiAgentRouter.analyzeQuestion(finalQuestion, context);
      setAgentAnalysis(analysis);
      
      // Prepare conversation context for the API
      const conversationContext = {
        sessionId: sessionId,
        currentTopic: currentContext?.currentTopic,
        recentQuestions: recentQuestions,
        userRole: profile?.role || 'jogász',
        messageCount: currentContext?.messages.length || 0
      };

      onSubmit(analysis.suggestedPrompt, analysis.agentType, conversationContext);
      setQuestion('');
      onQuestionChange('');
    }
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    onQuestionChange(value);
    
    // Reset agent analysis when question changes
    if (agentAnalysis) {
      setAgentAnalysis(null);
    }
  };

  const currentQuestion = selectedQuestion || question;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {agentAnalysis && (
            <AgentIndicator 
              agentType={agentAnalysis.agentType}
              confidence={agentAnalysis.confidence}
              reasoning={agentAnalysis.reasoning}
            />
          )}
          
          <div className="space-y-2">
            <Textarea
              value={currentQuestion}
              onChange={(e) => handleQuestionChange(e.target.value)}
              placeholder="Tegye fel kérdését az energiajogi dokumentumokkal kapcsolatban..."
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Az AI elemzi a kérdést és kiválasztja a megfelelő szakértői ágenst
            </p>
            <Button 
              type="submit" 
              disabled={!currentQuestion.trim() || isLoading}
              className="bg-mav-blue hover:bg-mav-blue-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kérdés elküldése
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
