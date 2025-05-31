import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QuestionSection } from './sections/QuestionSection';
import { AnswerSection } from './sections/AnswerSection';
import { SourcesSection } from './sections/SourcesSection';
import { ActionsSection } from './sections/ActionsSection';

interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
  created_at: string;
}

interface QASessionCardProps {
  session: QASession;
}

export function QASessionCard({ session }: QASessionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <QuestionSection 
            question={session.question}
            confidence={session.confidence}
            createdAt={session.created_at}
          />

          <Separator />

          <AnswerSection answer={session.answer} />

          <SourcesSection sources={session.sources} />

          <Separator />

          <ActionsSection 
            question={session.question}
            answer={session.answer}
          />
        </div>
      </CardContent>
    </Card>
  );
}
