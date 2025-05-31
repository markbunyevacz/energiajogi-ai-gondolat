import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AgentTesterProps {
  onTestComplete: (results: any) => void;
}

export function AgentTester({ onTestComplete }: AgentTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [agentType, setAgentType] = useState('general');

  const handleTest = async () => {
    if (!question.trim()) {
      toast.error('Kérjük adjon meg egy kérdést');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate agent testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      onTestComplete({
        question,
        agentType,
        status: 'success',
        response: 'Teszt válasz'
      });
      toast.success('Teszt sikeresen lefutott');
    } catch (error) {
      console.error('Agent test error:', error);
      toast.error('Hiba a teszt futtatása során');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Tesztelő</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Kérdés</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Adjon meg egy kérdést a teszteléshez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-type">Agent típus</Label>
          <Select value={agentType} onValueChange={setAgentType}>
            <SelectTrigger>
              <SelectValue placeholder="Válasszon agent típust" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Általános</SelectItem>
              <SelectItem value="legal">Jogi</SelectItem>
              <SelectItem value="contract">Szerződés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleTest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Tesztelés...
            </>
          ) : (
            'Teszt indítása'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
