import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { ContractAnalysis } from '@/types';
import { Timeline, TimelineItem } from "../ui/timeline";

interface AnalysisTimelineProps {
  analysis: ContractAnalysis;
  analyses?: ContractAnalysis[];
}

export function AnalysisTimeline({ analysis, analyses = [] }: AnalysisTimelineProps) {
  const timelineItems = [
    {
      title: 'Dokumentum feltöltés',
      description: 'A dokumentum sikeresen feltöltve',
      date: analysis.created_at
    },
    {
      title: 'Kockázatelemzés',
      description: `${analysis.risks?.length || 0} kockázat azonosítva`,
      date: analysis.timestamp || analysis.created_at
    },
    {
      title: 'Javaslatok generálása',
      description: `${analysis.recommendations.length} javaslat készült`,
      date: analysis.timestamp || analysis.created_at
    }
  ];

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Ma';
    if (diffDays === 2) return 'Tegnap';
    if (diffDays <= 7) return `${diffDays} napja`;
    
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group analyses by date
  const groupedByDate = analyses.reduce((acc, analysis) => {
    const date = new Date(analysis.timestamp || analysis.created_at).toLocaleDateString('hu-HU');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(analysis);
    return acc;
  }, {} as Record<string, ContractAnalysis[]>);

  // Sort analyses by date
  const sortedAnalyses = Object.values(groupedByDate).flat().sort((a, b) => {
    return new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Elemzési Idősor</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {timelineItems.map((item, index) => (
            <TimelineItem
              key={index}
              title={item.title}
              description={item.description}
              date={item.date}
            />
          ))}
        </Timeline>

        <div className="space-y-6 mt-6">
          {Object.entries(groupedByDate).map(([dateString, dayAnalyses]) => (
            <div key={dateString} className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">
                  {formatDate(dayAnalyses[0].timestamp || dayAnalyses[0].created_at)}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {dayAnalyses.length} elemzés
                </Badge>
              </div>

              <div className="space-y-3">
                {dayAnalyses.map((analysis) => (
                  <div key={analysis.id} className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200"></div>
                    
                    <div className="flex items-start space-x-4">
                      {/* Timeline dot */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getRiskColor(analysis.riskLevel)}`}>
                        {getRiskIcon(analysis.riskLevel)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{analysis.contractId}</h4>
                            <Badge className={getRiskColor(analysis.riskLevel)}>
                              {analysis.riskLevel === 'high' ? 'Magas' :
                               analysis.riskLevel === 'medium' ? 'Közepes' : 'Alacsony'} kockázat
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(analysis.timestamp || analysis.created_at)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{analysis.summary}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>{analysis.risks.length} kockázat</span>
                            <span>{analysis.recommendations.length} javaslat</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Részletek →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {sortedAnalyses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Még nem található elemzés az idősoron.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
