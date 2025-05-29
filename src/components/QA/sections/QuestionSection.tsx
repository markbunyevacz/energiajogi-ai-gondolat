
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';
import { formatTimestamp, getConfidenceColor, getConfidenceLabel } from '../utils/qaHelpers';

interface QuestionSectionProps {
  question: string;
  confidence: number;
  createdAt: string;
}

export function QuestionSection({ question, confidence, createdAt }: QuestionSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Kérdés:</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimestamp(createdAt)}
          </Badge>
          <Badge variant="secondary" className={getConfidenceColor(confidence)}>
            {confidence}% - {getConfidenceLabel(confidence)}
          </Badge>
        </div>
      </div>
      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{question}</p>
    </div>
  );
}
