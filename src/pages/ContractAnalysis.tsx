import { useState } from 'react';
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { ContractAnalysisComponent } from "@/components/Analysis/ContractAnalysisComponent";
import { ContractAnalysisDashboard } from "@/components/Analysis/ContractAnalysisDashboard";
import { ContractAnalysisHeader } from "@/components/Analysis/ContractAnalysisHeader";
import { ContractsList } from "@/components/Analysis/ContractsList";
import { ContractsEmptyState } from "@/components/Analysis/ContractsEmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAnalysis } from '@/types';
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useContractAnalysis } from "@/hooks/useContractAnalysis";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from 'react';

const ContractAnalysisPage = () => {
  console.log('ContractAnalysisPage: Component rendering started');
  
  const { trackPageView } = useAnalyticsTracking();
  const [activeTab, setActiveTab] = useState("contracts");
  
  console.log('ContractAnalysisPage: Calling useContractAnalysis hook');
  const { analyses, availableContracts, analyzeContract } = useContractAnalysis();
  
  console.log('ContractAnalysisPage: Hook data received', {
    analysesCount: analyses.length,
    contractsCount: availableContracts.length
  });

  useEffect(() => {
    console.log('ContractAnalysisPage: useEffect for trackPageView running');
    trackPageView('/contract-analysis');
  }, [trackPageView]);

  const handleSwitchToAnalyze = () => {
    console.log('ContractAnalysisPage: Switching to analyze tab');
    setActiveTab("analyze");
  };

  console.log('ContractAnalysisPage: About to render JSX');

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <ContractAnalysisHeader />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                  <TabsTrigger value="contracts">Szerződések ({availableContracts.length})</TabsTrigger>
                  <TabsTrigger value="dashboard">Elemzések ({analyses.length})</TabsTrigger>
                  <TabsTrigger value="analyze">Új Elemzés</TabsTrigger>
                </TabsList>

                <TabsContent value="contracts" className="space-y-6">
                  {availableContracts.length === 0 ? (
                    <ContractsEmptyState onSwitchToAnalyze={handleSwitchToAnalyze} />
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
    </ErrorBoundary>
  );
};

console.log('ContractAnalysisPage: Component definition complete');

export default ContractAnalysisPage;
