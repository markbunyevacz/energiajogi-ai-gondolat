
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ContractAnalysisItem {
  id: string;
  contract_id: string;
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  analyzed_by: string;
  created_at: string;
  document?: {
    title: string;
    type: string;
  };
  risks?: Array<{
    id: string;
    type: 'legal' | 'financial' | 'operational';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
    section?: string;
  }>;
}

interface AnalysisStats {
  total: number;
  byRiskLevel: Record<string, number>;
  byType: Record<string, number>;
  recentAnalyses: number;
}

export function ContractAnalysisDashboard() {
  const [analyses, setAnalyses] = useState<ContractAnalysisItem[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({
    total: 0,
    byRiskLevel: {},
    byType: {},
    recentAnalyses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContractAnalysisItem | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: analysesData, error: analysesError } = await supabase
        .from('contract_analyses')
        .select(`
          *,
          documents!inner(title, type),
          risks(*)
        `)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      const formattedAnalyses = (analysesData || []).map(analysis => ({
        ...analysis,
        document: analysis.documents,
        risks: analysis.risks || []
      }));

      setAnalyses(formattedAnalyses);
      calculateStats(formattedAnalyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (analysesData: ContractAnalysisItem[]) => {
    const total = analysesData.length;
    const byRiskLevel = analysesData.reduce((acc, analysis) => {
      acc[analysis.risk_level] = (acc[analysis.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = analysesData.reduce((acc, analysis) => {
      const type = analysis.document?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAnalyses = analysesData.filter(
      analysis => new Date(analysis.created_at) > weekAgo
    ).length;

    setStats({ total, byRiskLevel, byType, recentAnalyses });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Magas kockázat';
      case 'medium': return 'Közepes kockázat';
      case 'low': return 'Alacsony kockázat';
      default: return level;
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Shield className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Összes elemzés</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.recentAnalyses}</div>
            <div className="text-sm text-gray-600">Elmúlt 7 nap</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{stats.byRiskLevel.high || 0}</div>
            <div className="text-sm text-gray-600">Magas kockázat</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((stats.byRiskLevel.low || 0) / Math.max(stats.total, 1) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Alacsony kockázat</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Elemzések listája</TabsTrigger>
          <TabsTrigger value="statistics">Statisztikák</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Még nincsenek elemzések
                </h3>
                <p className="text-gray-600">
                  Töltse fel és elemezze első szerződését a Dokumentumok fülön.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-mav-blue" />
                          <h3 className="font-medium text-gray-900">
                            {analysis.document?.title || `Szerződés ${analysis.contract_id}`}
                          </h3>
                          <Badge variant="outline">
                            {analysis.document?.type || 'szerződés'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {analysis.summary}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(analysis.created_at).toLocaleDateString('hu-HU')}
                          </span>
                          <span>{analysis.risks?.length || 0} kockázat azonosítva</span>
                          <span>{analysis.recommendations.length} javaslat</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskLevelColor(analysis.risk_level)}>
                          {getRiskIcon(analysis.risk_level)}
                          <span className="ml-1">{getRiskLevelLabel(analysis.risk_level)}</span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnalysis(analysis)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Részletek
                        </Button>
                      </div>
                    </div>

                    {analysis.risks && analysis.risks.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm text-gray-900 mb-2">
                          Főbb kockázatok:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.risks.slice(0, 3).map((risk, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {risk.type === 'legal' && 'Jogi'}
                              {risk.type === 'financial' && 'Pénzügyi'}
                              {risk.type === 'operational' && 'Működési'}
                              {' - '}
                              {risk.severity === 'high' && 'Magas'}
                              {risk.severity === 'medium' && 'Közepes'}
                              {risk.severity === 'low' && 'Alacsony'}
                            </Badge>
                          ))}
                          {analysis.risks.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{analysis.risks.length - 3} további
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kockázati szintek eloszlása</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.byRiskLevel).map(([level, count]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{getRiskLevelLabel(level)}</span>
                      <span>{count} ({Math.round(count / Math.max(stats.total, 1) * 100)}%)</span>
                    </div>
                    <Progress value={count / Math.max(stats.total, 1) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dokumentum típusok</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>{count}</span>
                    </div>
                    <Progress value={count / Math.max(stats.total, 1) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Analysis Detail Modal - placeholder for future implementation */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedAnalysis.document?.title || `Szerződés ${selectedAnalysis.contract_id}`}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnalysis(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskLevelColor(selectedAnalysis.risk_level)}>
                    {getRiskIcon(selectedAnalysis.risk_level)}
                    <span className="ml-1">{getRiskLevelLabel(selectedAnalysis.risk_level)}</span>
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedAnalysis.created_at).toLocaleString('hu-HU')}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Összefoglaló:</h4>
                  <p className="text-gray-700">{selectedAnalysis.summary}</p>
                </div>

                {selectedAnalysis.risks && selectedAnalysis.risks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Azonosított kockázatok:</h4>
                    <div className="space-y-3">
                      {selectedAnalysis.risks.map((risk, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {risk.type === 'legal' && 'Jogi'}
                              {risk.type === 'financial' && 'Pénzügyi'}
                              {risk.type === 'operational' && 'Működési'}
                            </Badge>
                            <Badge className={getRiskLevelColor(risk.severity)}>
                              {getRiskLevelLabel(risk.severity)}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{risk.description}</p>
                          <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                            <strong>Javaslat:</strong> {risk.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Általános javaslatok:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
