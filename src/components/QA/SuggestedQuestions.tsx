import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
}

export function SuggestedQuestions({ onQuestionSelect, isLoading }: SuggestedQuestionsProps) {
  const suggestedQuestions = [
    'Mi a különbség a munkavállaló és a vállalkozó között a magyar jogban?',
    'Hogyan kell GDPR-osan kezelni a munkavállalók személyes adatait?',
    'Milyen szerződéses kockázatok lehetnek egy szoftverfejlesztési projektben?'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Javasolt kérdések</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onQuestionSelect(question)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {question}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
