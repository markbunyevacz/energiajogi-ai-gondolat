
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { optimizedDocumentService } from '@/services/optimizedDocumentService';
import { toast } from 'sonner';
import { QuestionInput } from './QuestionInput';
import { SuggestedQuestions } from './SuggestedQuestions';
import { LegalSourcesWidget } from './LegalSourcesWidget';
import { QAHistory } from './QAHistory';

interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
  created_at: string;
}

export function QuestionAnswer() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<QASession[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const { user } = useAuth();
  const { search, results } = useOptimizedSearch(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('qa_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Hiba a korábbi kérdések betöltésekor');
    } else {
      setSessions(data || []);
    }
  };

  const handleQuestionSubmit = async (question: string) => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      // Use optimized search first
      await search(question);
      
      // Calculate confidence based on search results
      const searchResults = results || { chunks: [], totalResults: 0, processingTime: 0 };
      const sources = searchResults.chunks.map(chunk => `Dokumentum ${chunk.document_id}`);
      const confidence = optimizedDocumentService.calculateConfidence(searchResults, sources);

      // Call the AI Q&A edge function with improved context
      const { data, error } = await supabase.functions.invoke('ai-question-answer', {
        body: {
          question: question,
          userId: user.id,
          searchResults: searchResults.chunks || [],
          confidence: confidence
        },
      });

      if (error) throw error;

      if (data.success) {
        setSessions(prev => [data.session, ...prev]);
        toast.success('Kérdés sikeresen feldolgozva');
      } else {
        throw new Error(data.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Error processing question:', error);
      toast.error('Hiba a kérdés feldolgozásakor. Kérjük próbálja újra.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <QuestionInput 
            onSubmit={handleQuestionSubmit}
            isLoading={isLoading}
            results={results}
            selectedQuestion={selectedQuestion}
            onQuestionChange={setSelectedQuestion}
          />
        </div>
        <LegalSourcesWidget />
      </div>

      <SuggestedQuestions 
        onQuestionSelect={handleQuestionSelect}
        isLoading={isLoading}
      />

      <QAHistory sessions={sessions} />
    </div>
  );
}
