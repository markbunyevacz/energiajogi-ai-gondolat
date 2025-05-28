
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Book, Clock, ThumbsUp, ThumbsDown, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
  created_at: string;
}

export function QuestionAnswer() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<QASession[]>([]);
  const { user } = useAuth();

  const suggestedQuestions = [
    'Milyen feltételekkel lehet energiaszerződést módosítani?',
    'Mi a teendő energiaszolgáltatói szerződésszegés esetén?',
    'Hogyan működik az energiapiaci ártámogatás rendszer?',
    'Milyen jogok illetik meg a fogyasztót áramkimaradás esetén?',
    'Mi a különbség az egyetemes és versenypiaci szolgáltatás között?',
    'Hogyan lehet panaszt tenni az energiaszolgáltató ellen?'
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !user) return;

    setIsLoading(true);
    
    try {
      // Generate a mock answer for now (will be replaced with real AI in Phase 3)
      const mockAnswer = generateMockAnswer(question);
      const mockSources = generateMockSources();
      const confidence = Math.floor(Math.random() * 20) + 80;

      const { data, error } = await supabase
        .from('qa_sessions')
        .insert({
          question: question,
          answer: mockAnswer,
          sources: mockSources,
          confidence: confidence,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setQuestion('');
      toast.success('Kérdés sikeresen elküldve');
    } catch (error) {
      console.error('Error saving Q&A session:', error);
      toast.error('Hiba a kérdés mentésekor');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAnswer = (q: string): string => {
    const answers = [
      'Az energiajogi szabályozás szerint ez a kérdés több jogszabályban is szabályozott. A VET alapján...',
      'A MEKH rendeletei szerint ebben az esetben a szolgáltató köteles...',
      'Az energiapiaci szabályozás értelmében a fogyasztó jogosult...',
      'A hatályos jogszabályok alapján ez a helyzet a következőképpen alakul...'
    ];
    return answers[Math.floor(Math.random() * answers.length)] + ' [Ez egy demo válasz. A valódi AI válaszok a következő fázisban kerülnek implementálásra.]';
  };

  const generateMockSources = (): string[] => {
    const sources = [
      'VET 2007. évi LXXXVI. törvény',
      'MEKH Rendelet 2/2013',
      'Fogyasztóvédelmi szabályzat',
      'Egyetemes Szolgáltatási Szabályzat',
      'MVM Szerződési feltételek',
      'E.ON Általános Szerződési Feltételek'
    ];
    return sources.slice(0, Math.floor(Math.random() * 3) + 2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Szöveg vágólapra másolva');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} perce`;
    } else if (diffHours < 24) {
      return `${diffHours} órája`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} napja`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-mav-blue" />
            <span>Jogi Kérdés Feltevése</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
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
                    Feldolgozás...
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

      {/* Suggested Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Javasolt Kérdések</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedQuestions.map((q, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3 justify-start hover:bg-mav-blue hover:text-white transition-colors"
                onClick={() => setQuestion(q)}
              >
                <div className="text-sm">{q}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Q&A History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Korábbi Kérdések és Válaszok</h2>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Még nem tett fel kérdéseket.</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Question */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Kérdés:</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(session.created_at)}
                        </Badge>
                        <Badge variant="secondary" className={`${
                          session.confidence > 90 ? 'bg-green-100 text-green-800' :
                          session.confidence > 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {session.confidence}% megbízhatóság
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{session.question}</p>
                  </div>

                  <Separator />

                  {/* Answer */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Válasz:</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{session.answer}</p>
                    </div>
                  </div>

                  {/* Sources */}
                  {session.sources.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <Book className="w-4 h-4 mr-2" />
                          Források:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {session.sources.map((source, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-mav-blue hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <Separator />
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
                      onClick={() => copyToClipboard(`Kérdés: ${session.question}\n\nVálasz: ${session.answer}`)}
                      className="text-gray-500"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Másolás
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
