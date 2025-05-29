
import { useState, useEffect } from 'react';
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { ContractAnalysisComponent } from "@/components/Analysis/ContractAnalysis";
import { ContractAnalysisDashboard } from "@/components/Analysis/ContractAnalysisDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ContractAnalysis } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { FileText, Brain, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StoredDocument {
  id: string;
  title: string;
  type: string;
  file_size: number;
  upload_date: string;
  content: string | null;
}

const ContractAnalysisPage = () => {
  const { user } = useAuth();
  const { trackPageView } = useAnalyticsTracking();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContractAnalysis | null>(null);
  const [availableContracts, setAvailableContracts] = useState<StoredDocument[]>([]);

  useEffect(() => {
    trackPageView('/contract-analysis');
    if (user) {
      fetchAnalyses();
      fetchAvailableContracts();
    }
  }, [trackPageView, user]);

  const fetchAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contract_analyses')
        .select(`
          id,
          contract_id,
          risk_level,
          summary,
          recommendations,
          created_at,
          risks (
            type,
            severity,
            description,
            recommendation,
            section
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
        return;
      }

      const transformedAnalyses: ContractAnalysis[] = data.map(item => ({
        id: item.id,
        contractId: item.contract_id,
        riskLevel: item.risk_level as 'low' | 'medium' | 'high',
        summary: item.summary || '',
        recommendations: item.recommendations || [],
        timestamp: item.created_at,
        risks: item.risks || []
      }));

      setAnalyses(transformedAnalyses);
    } catch (error) {
      console.error('Error fetching contract analyses:', error);
    }
  };

  const fetchAvailableContracts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, type, file_size, upload_date, content')
        .eq('type', 'szerződés')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        return;
      }

      setAvailableContracts(data || []);
    } catch (error) {
      console.error('Error fetching available contracts:', error);
    }
  };

  const analyzeContract = async (document: StoredDocument) => {
    if (!document.content || !user) {
      toast.error('A dokumentum tartalma nem elérhető az elemzéshez');
      return;
    }

    try {
      toast.info('Szerződés elemzése folyamatban...');

      const { data, error } = await supabase.functions.invoke('analyze-contract', {
        body: {
          documentId: document.id,
          content: document.content,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Szerződés elemzése befejezve');
        // Refresh analyses to show new results
        fetchAnalyses();
      } else {
        throw new Error(data.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Hiba a szerződés elemzésekor');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Szerződéselemzés</h1>
                <p className="text-gray-600 mt-2">
                  AI-alapú szerződéselemzés, kockázatértékelés és megfelelőségi ellenőrzés
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Vissza a főoldalra</span>
              </Button>
            </div>

            <Tabs defaultValue="contracts" className="space-y-6">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="contracts">Szerződések ({availableContracts.length})</TabsTrigger>
                <TabsTrigger value="dashboard">Elemzések ({analyses.length})</TabsTrigger>
                <TabsTrigger value="analyze">Új Elemzés</TabsTrigger>
              </TabsList>

              <TabsContent value="contracts" className="space-y-6">
                {availableContracts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nincsenek feltöltött szerződések
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Töltsön fel szerződéseket a főoldalon az elemzés megkezdéséhez
                      </p>
                      <Button onClick={() => navigate('/')}>
                        Dokumentumok feltöltése
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>Elérhető Szerződések Elemzéshez</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {availableContracts.map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.title}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">Szerződés</Badge>
                                  <Button
                                    size="sm"
                                    onClick={() => analyzeContract(doc)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    <Brain className="w-4 h-4 mr-1" />
                                    Elemzés Indítása
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>{new Date(doc.upload_date).toLocaleDateString('hu-HU')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6">
                <ContractAnalysisDashboard 
                  analyses={analyses}
                  onAnalysisSelect={setSelectedAnalysis}
                />
              </TabsContent>

              <TabsContent value="analyze" className="space-y-6">
                <ContractAnalysisComponent />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ContractAnalysisPage;
