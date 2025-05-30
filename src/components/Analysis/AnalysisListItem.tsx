import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Download, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ContractAnalysis } from '@/types';
import { AnalysisProcessingSteps } from './AnalysisProcessingSteps';

interface AnalysisListItemProps {
  analysis: ContractAnalysis;
  onSelect?: (analysis: ContractAnalysis) => void;
  onExport: (analysis: ContractAnalysis) => void;
}

interface AnalysisProcessingStepsProps {
  analysis: ContractAnalysis;
}

export function AnalysisListItem({ analysis, onSelect, onExport }: AnalysisListItemProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return 'Magas';
      case 'medium':
        return 'Közepes';
      case 'low':
        return 'Alacsony';
      default:
        return 'Ismeretlen';
    }
  };

  const getContractDisplayName = () => {
    return `Szerződés ${analysis.contractId || analysis.id}`;
  };

  const handleExport = () => {
    console.log('Exporting analysis:', analysis.id);
    onExport(analysis);
  };

  const handleViewDetails = () => {
    console.log('Viewing details for analysis:', analysis.id);
    if (onSelect) {
      onSelect(analysis);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>{getContractDisplayName()}</span>
          </CardTitle>
          <Badge className={getRiskLevelColor(analysis.riskLevel)}>
            {getRiskLevelText(analysis.riskLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium">{getContractDisplayName()}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Elemzési eredmények exportálása JSON formátumban</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
            >
              <Eye className="w-4 h-4 mr-1" />
              Részletek
            </Button>
          </div>
        </div>

        <AnalysisProcessingSteps analysis={analysis} />
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">{analysis.summary || 'Nincs összefoglaló elérhető'}</p>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{analysis.risks?.length || 0} kockázat azonosítva</span>
            <span>{new Date(analysis.timestamp).toLocaleDateString('hu-HU')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
