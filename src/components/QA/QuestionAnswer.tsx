
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Book, Clock, ThumbsUp, ThumbsDown, Copy, ExternalLink, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { optimizedDocumentService } from '@/services/optimizedDocumentService';
import { officialSourceService } from '@/services/officialSourceService';
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
  const { search, results } = useOptimizedSearch(false);

  const suggestedQuestions = [
    'Milyen feltételekkel lehet energiaszerződést módosítani?',
    'Mi a teendő energiaszolgáltatói szerződésszegés esetén?',
    'Hogyan működik az energiapiaci ártámogatás rendszer?',
    'Milyen jogok illetik meg a fogyasztót áramkimaradás esetén?',
    'Mi a különbség az egyetemes és versenypiaci szolgáltatás között?',
    'Hogyan lehet panaszt tenni az energiaszolgáltató ellen?'
  ];

  const legalSources = officialSourceService.getAllSources();

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
      // Use optimized search first
      await search(question);
      
      // Calculate confidence based on search results
      const searchResults = results || { chunks: [], totalResults: 0, processingTime: 0 };
      const sources = searchResults.chunks.map(chunk => `Dokumentum ${chunk.document_id}`);
      const confidence = optimizedDocumentService.calculateConfidence(searchResults, sources);

      // Call the AI Q&A edge function with improved context
      const { data, error } = await supabase.functions.invoke('ai-question-answer', {
        body: {
          question: question.trim(),
          userId: user.id,
          searchResults: searchResults.chunks || [],
          confidence: confidence
        },
      });

      if (error) throw error;

      if (data.success) {
        setSessions(prev => [data.session, ...prev]);
        setQuestion('');
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'Magas megbízhatóság';
    if (confidence >= 60) return 'Közepes megbízhatóság';
    return 'Alacsony megbízhatóság';
  };

  const renderAnswerWithLinks = (answer: string): JSX.Element => {
    // Detect and link official sources
    const detectedSources = officialSourceService.detectSourcesInText(answer);
    let linkedAnswer = answer;
    
    // Replace detected sources with links
    detectedSources.forEach(({ source, matches }) => {
      matches.forEach(match => {
        const linkRegex = new RegExp(`\\b${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        linkedAnswer = linkedAnswer.replace(linkRegex, (matchedText) => {
          return `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline inline-flex items-center">${matchedText}<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
        });
      });
    });

    // Also link any existing URLs
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    linkedAnswer = linkedAnswer.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline inline-flex items-center">${url}<svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
    });

    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: linkedAnswer }}
      />
    );
  };

  const isUrl = (text: string): boolean => {
    return text.includes('http://') || text.includes('https://');
  };

  const extractUrlFromSource = (source: string): string | null => {
    const urlMatch = source.match(/(https?:\/\/[^\s)]+)/);
    return urlMatch ? urlMatch[1] : null;
  };

  const getSourceDisplayName = (source: string): string => {
    if (isUrl(source)) {
      return source.split(' - ')[0] || source;
    }
    return source;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          {/* Question Input */}
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
        </div>

        {/* External Legal Sources Widget */}
        <Card className="w-80 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <BookOpen className="w-5 h-5 text-mav-blue" />
              <span>Elsődleges Jogi Források</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {legalSources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <div className="font-medium text-sm">{source.name}</div>
                  <div className="text-xs text-gray-500">{source.description}</div>
                  <div className="text-xs text-gray-400 capitalize">{source.category}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-mav-blue transition-colors" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

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
                disabled={isLoading}
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
                        <Badge variant="secondary" className={getConfidenceColor(session.confidence)}>
                          {session.confidence}% - {getConfidenceLabel(session.confidence)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{session.question}</p>
                  </div>

                  <Separator />

                  {/* Answer with enhanced linking */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">AI Válasz:</h3>
                    {renderAnswerWithLinks(session.answer)}
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
                          {session.sources.map((source, index) => {
                            const url = extractUrlFromSource(source);
                            const displayName = getSourceDisplayName(source);
                            
                            if (url) {
                              return (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center"
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-mav-blue hover:text-white transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {displayName}
                                  </Badge>
                                </a>
                              );
                            } else {
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {source}
                                </Badge>
                              );
                            }
                          })}
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
