
import { ContractAnalysis } from '@/types';

export const sortAnalyses = (analyses: ContractAnalysis[], sortBy: string): ContractAnalysis[] => {
  return [...analyses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'risk':
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      case 'contract':
        return a.contractId.localeCompare(b.contractId);
      default:
        return 0;
    }
  });
};

export const filterAnalyses = (
  analyses: ContractAnalysis[], 
  searchTerm: string, 
  filterRisk: string
): ContractAnalysis[] => {
  let filtered = analyses.filter(analysis => {
    const contractIdMatch = analysis.contractId?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const summaryMatch = analysis.summary?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return contractIdMatch || summaryMatch;
  });

  if (filterRisk !== 'all') {
    filtered = filtered.filter(analysis => analysis.riskLevel === filterRisk);
  }

  return filtered;
};

export const exportAnalysis = (analysis: ContractAnalysis): void => {
  const exportData = {
    contractId: analysis.contractId,
    riskLevel: analysis.riskLevel,
    summary: analysis.summary,
    risks: analysis.risks,
    recommendations: analysis.recommendations,
    timestamp: analysis.timestamp
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contract-analysis-${analysis.contractId}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const calculateCompletionRate = (analysesCount: number): number => {
  return analysesCount > 0 ? Math.min(95, 75 + analysesCount * 5) : 0;
};
