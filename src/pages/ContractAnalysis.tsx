
import { useState } from 'react';
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { ContractAnalysisComponent } from "@/components/Analysis/ContractAnalysis";
import { ContractAnalysisDashboard } from "@/components/Analysis/ContractAnalysisDashboard";
import { ContractAnalysisHeader } from "@/components/Analysis/ContractAnalysisHeader";
import { ContractsList } from "@/components/Analysis/ContractsList";
import { ContractsEmptyState } from "@/components/Analysis/ContractsEmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAnalysis } from '@/types';
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useContractAnalysis } from "@/hooks/useContractAnalysis";
import { useEffect } from 'react';

const ContractAnalysisPage = () => {
  const { trackPageView } = useAnalyticsTracking();
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContractAnalysis | null>(null);
  const { analyses, availableContracts, analyzeContract } = useContractAnalysis();

  useEffect(() => {
    trackPageView('/contract-analysis');
  }, [trackPageView]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <ContractAnalysisHeader />

            <Tabs defaultValue="contracts" className="space-y-6">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="contracts">Szerződések ({availableContracts.length})</TabsTrigger>
                <TabsTrigger value="dashboard">Elemzések ({analyses.length})</TabsTrigger>
                <TabsTrigger value="analyze">Új Elemzés</TabsTrigger>
              </TabsList>

              <TabsContent value="contracts" className="space-y-6">
                {availableContracts.length === 0 ? (
                  <ContractsEmptyState />
                ) : (
                  <ContractsList 
                    contracts={availableContracts}
                    onAnalyzeContract={analyzeContract}
                  />
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
