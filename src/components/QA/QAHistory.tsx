
import { Card, CardContent } from "@/components/ui/card";
import { QASessionCard } from './QASessionCard';

interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
  created_at: string;
}

interface QAHistoryProps {
  sessions: QASession[];
}

export function QAHistory({ sessions }: QAHistoryProps) {
  return (
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
          <QASessionCard key={session.id} session={session} />
        ))
      )}
    </div>
  );
}
