
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare } from 'lucide-react';

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
}

export function SuggestedQuestions({ onQuestionSelect, isLoading }: SuggestedQuestionsProps) {
  const suggestedQuestions = [
    'Milyen feltételekkel lehet energiaszerződést módosítani?',
    'Mi a teendő energiaszolgáltatói szerződésszegés esetén?',
    'Hogyan működik az energiapiaci ártámogatás rendszer?',
    'Milyen jogok illetik meg a fogyasztót áramkimaradás esetén?',
    'Mi a különbség az egyetemes és versenypiaci szolgáltatás között?',
    'Hogyan lehet panaszt tenni az energiaszolgáltató ellen?'
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="suggested-questions">
        <AccordionTrigger className="text-left">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-mav-blue" />
            <span className="text-lg font-medium">Javasolt Kérdések ({suggestedQuestions.length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {suggestedQuestions.map((q, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3 justify-start hover:bg-mav-blue hover:text-white transition-colors"
                onClick={() => onQuestionSelect(q)}
                disabled={isLoading}
              >
                <div className="text-sm">{q}</div>
              </Button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
