
import { useState, useEffect } from 'react';
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { ContractAnalysisComponent } from "@/components/Analysis/ContractAnalysis";
import { ContractAnalysisDashboard } from "@/components/Analysis/ContractAnalysisDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ContractAnalysis } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

const ContractAnalysisPage = () => {
  const { user } = useAuth();
  const { trackPageView } = useAnalyticsTracking();
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContractAnalysis | null>(null);

  useEffect(() => {
    trackPageView('/contract-analysis');
    if (user) {
      fetchAnalyses();
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Szerződéselemzés</h1>
              <p className="text-gray-600 mt-2">
                AI-alapú szerződéselemzés, kockázatértékelés és megfelelőségi ellenőrzés
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="analyze">Új Elemzés</TabsTrigger>
              </TabsList>

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
