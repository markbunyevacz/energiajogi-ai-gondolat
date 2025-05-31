import React from 'react';

interface AnswerSectionProps {
  answer: string;
}

export function AnswerSection({ answer }: AnswerSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-900">AI Válasz:</h3>
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700 whitespace-pre-line">{answer}</p>
      </div>
    </div>
  );
}
