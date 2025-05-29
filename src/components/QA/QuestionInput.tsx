
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from 'lucide-react';

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>;
  isLoading: boolean;
  results?: {
    totalResults: number;
    processingTime: number;
  } | null;
  selectedQuestion?: string;
  onQuestionChange?: (question: string) => void;
}

export function QuestionInput({ 
  onSubmit, 
  isLoading, 
  results, 
  selectedQuestion = '', 
  onQuestionChange 
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');

  // Update the question when a suggested question is selected
  useEffect(() => {
    if (selectedQuestion) {
      setQuestion(selectedQuestion);
    }
  }, [selectedQuestion]);

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    if (onQuestionChange) {
      onQuestionChange(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    await onSubmit(question.trim());
    setQuestion('');
    if (onQuestionChange) {
      onQuestionChange('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-mav-blue" />
          <span>Jogi Kérdés Feltevése</span>
          {results && (
            <Badge variant="outline" className="ml-auto">
              {results.totalResults} találat | {results.processingTime.toFixed(1)}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={question}
              onChange={(e) => handleQuestionChange(e.target.value)}
              placeholder="Írja be energiajogi kérdését... (pl. Mi a teendő energiaszolgáltatói szerződésszegés esetén?)"
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {question.length}/1000 karakter
            </div>
            <Button 
              type="submit" 
              disabled={!question.trim() || isLoading}
              className="bg-mav-blue hover:bg-mav-blue-dark"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  AI feldolgozás...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kérdés Elküldése
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
