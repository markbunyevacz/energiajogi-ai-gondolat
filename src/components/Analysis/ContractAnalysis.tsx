import { useState } from 'react';
import { ContractAnalysis } from '@/types';
import { ContractInput } from './ContractInput';
import { ContractAnalysisResults } from './ContractAnalysisResults';
import { generateMockRisks, generateMockRecommendations } from './utils/mockDataGenerators';

export function ContractAnalysisComponent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ContractAnalysis[]>([
    {
      id: '1',
      contractId: 'MVM-2024-001',
      riskLevel: 'medium',
      risks: [
        {
          type: 'legal',
          severity: 'high',
          description: 'Force majeure klauzula hiányos - nem tartalmazza az energiapiaci specifikus eseményeket',
          recommendation: 'Egészítse ki a force majeure klauzulát energiapiaci eseményekkel (pl. hálózati kapacitáshiány, szabályozási változások)',
          section: '12. szakasz'
        },
        {
          type: 'financial',
          severity: 'medium',
          description: 'Árazási formula nem tartalmaz inflációs indexet',
          recommendation: 'Vezessen be inflációs indexet az árazási formulába a vásárlóerő megőrzése érdekében',
          section: '7.2 pont'
        },
        {
          type: 'operational',
          severity: 'low',
          description: 'Teljesítmény monitoring feltételek nem egyértelműek',
          recommendation: 'Pontosítsa a teljesítmény mérési módszereket és gyakoriságot',
          section: '15. szakasz'
        }
      ],
      recommendations: [
        'Force majeure klauzula bővítése energiapiaci eseményekkel',
        'Inflációs index beépítése az árazási formulába',
        'Teljesítmény monitoring feltételek pontosítása',
        'Felmondási feltételek felülvizsgálata'
      ],
      summary: 'A szerződés általánosságban megfelelő, de három területen javasolt javítások végrehajtása. A legnagyobb kockázat a hiányos force majeure klauzula.',
      timestamp: '2024-01-15T11:30:00Z'
    }
  ]);

  const handleAnalyze = async (contractText: string) => {
    setIsAnalyzing(true);
    
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
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <ContractInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <ContractAnalysisResults analyses={analysisResults} />
    </div>
  );
}
