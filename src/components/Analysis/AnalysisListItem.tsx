import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from 'lucide-react';
import { formatTimestamp } from '@/components/QA/utils/qaHelpers';
import type { ContractAnalysis } from '@/types';

interface AnalysisListItemProps {
  analysis: ContractAnalysis;
  onClick?: () => void;
}

export function AnalysisListItem({ analysis, onClick }: AnalysisListItemProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {analysis.title}
              </h3>
              <Badge variant="secondary" className="ml-2">
                {analysis.status}
              </Badge>
            </div>
            
            <p className="mt-1 text-sm text-gray-500 truncate">
              {analysis.description}
            </p>
            
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatTimestamp(analysis.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
