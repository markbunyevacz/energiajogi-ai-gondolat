import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, FileText, Brain, Shield } from 'lucide-react';
import { ContractAnalysis } from '@/types';

export function AnalysisProcessingSteps() {
  const steps = [
    {
      id: '1',
      name: 'Dokumentum Feldolgozás',
      status: 'completed',
      description: 'A szerződés szövegének előfeldolgozása és strukturálása'
    },
    {
      id: '2',
      name: 'Kockázatelemzés',
      status: 'completed',
      description: 'Jogi és üzleti kockázatok azonosítása'
    },
    {
      id: '3',
      name: 'Javaslatok Generálása',
      status: 'completed',
      description: 'Javítási és optimalizálási javaslatok kidolgozása'
    },
    {
      id: '4',
      name: 'Összegzés',
      status: 'completed',
      description: 'Elemzési eredmények összefoglalása'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Befejezve';
      case 'processing':
        return 'Folyamatban';
      case 'error':
        return 'Hiba';
      default:
        return 'Várakozik';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Feldolgozási Állapot</h4>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {completedSteps}/{steps.length} befejezve
        </Badge>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {step.name}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(step.status)}`}>
                  {getStatusText(step.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
