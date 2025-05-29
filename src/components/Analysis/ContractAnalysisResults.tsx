
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, CheckCircle } from 'lucide-react';
import { ContractAnalysis } from '@/types';
import { RiskCard } from './RiskCard';
import { AnalysisSummaryCards } from './AnalysisSummaryCards';

interface ContractAnalysisResultsProps {
  analyses: ContractAnalysis[];
}

export function ContractAnalysisResults({ analyses }: ContractAnalysisResultsProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Magas';
      case 'medium': return 'Közepes';
      case 'low': return 'Alacsony';
      default: return level;
    }
  };

  if (analyses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Elemzési Eredmények</h2>
      
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-mav-blue" />
                <span>Szerződés: {analysis.contractId}</span>
              </CardTitle>
              <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                {getRiskLevelLabel(analysis.riskLevel)} kockázat
              </Badge>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {analysis.summary}
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="risks" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="risks">Kockázatok ({analysis.risks.length})</TabsTrigger>
                <TabsTrigger value="recommendations">Javaslatok</TabsTrigger>
                <TabsTrigger value="summary">Összefoglaló</TabsTrigger>
              </TabsList>
              
              <TabsContent value="risks" className="space-y-4">
                {analysis.risks.map((risk, index) => (
                  <RiskCard key={index} risk={risk} index={index} />
                ))}
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-900">{rec}</p>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="summary" className="space-y-4">
                <AnalysisSummaryCards />
                
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Részletes Összefoglaló</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysis.summary} Az azonosított kockázatok kezelése javíthatja a szerződés biztonságát és csökkentheti a jogi kockázatokat. A javasolt módosítások implementálása után a szerződés megfelelőségi szintje várhatóan 95% fölé emelkedik.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
