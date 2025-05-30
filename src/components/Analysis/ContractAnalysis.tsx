import { useState } from 'react';
import type { ContractAnalysis } from '@/types';
import { ContractInput } from './ContractInput';
import { ContractAnalysisResults } from './ContractAnalysisResults';
import { generateMockRisks, generateMockRecommendations } from './utils/mockDataGenerators';
import { toast } from 'sonner';

export function ContractAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ContractAnalysis[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      setTimeout(() => {
        const newAnalysis: ContractAnalysis = {
          id: Math.random().toString(36).substr(2, 9),
          contractId: `DEMO-${Date.now()}`,
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          risks: generateMockRisks(),
          recommendations: generateMockRecommendations(),
          summary: 'Az AI elemzés befejeződött. A szerződés részletes áttekintése alapján azonosított kockázatok és javaslatok.',
          timestamp: new Date().toISOString()
        };
        
        setAnalysisResults(prev => [newAnalysis, ...prev]);
        setIsAnalyzing(false);
        toast.success('Elemzés sikeresen befejeződött');
      }, 3000);
    } catch (error) {
      setIsAnalyzing(false);
      toast.error('Hiba történt az elemzés során', {
        description: 'Kérjük, próbálja újra később'
      });
    }
  };

  return (
    <div className="space-y-6">
      <ContractInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <ContractAnalysisResults analyses={analysisResults} />
    </div>
  );
}
