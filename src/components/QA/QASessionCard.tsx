
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Book, ThumbsUp, ThumbsDown, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Szöveg vágólapra másolva');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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

          {/* Answer */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">AI Válasz:</h3>
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
  );
}
