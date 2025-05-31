import React from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ActionsSectionProps {
  question: string;
  answer: string;
}

export function ActionsSection({ question, answer }: ActionsSectionProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Szöveg vágólapra másolva');
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="text-gray-500">
          <ThumbsUp className="w-4 h-4 mr-1" />
          Hasznos
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-500">
          <ThumbsDown className="w-4 h-4 mr-1" />
          Nem hasznos
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(`Kérdés: ${question}\n\nVálasz: ${answer}`)}
        className="text-gray-500"
      >
        <Copy className="w-4 h-4 mr-1" />
        Másolás
      </Button>
    </div>
  );
}
