import { ContractAnalysis } from '@/types';

export const sortAnalyses = (analyses: ContractAnalysis[], sortBy: string): ContractAnalysis[] => {
  return [...analyses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      case 'risk':
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      case 'contract':
        // Handle null contractId values safely
        const aContractId = a.contractId || '';
        const bContractId = b.contractId || '';
        return aContractId.localeCompare(bContractId);
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
    const contractIdMatch = analysis.contractId?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    const summaryMatch = analysis.summary?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    return contractIdMatch || summaryMatch;
  });

  if (filterRisk !== 'all') {
    filtered = filtered.filter(analysis => analysis.riskLevel === filterRisk);
  }

  return filtered;
};

export const exportAnalysis = (analysis: ContractAnalysis): void => {
  // Generate a proper filename
  const getFileName = () => {
    if (analysis.contractId && analysis.contractId !== 'null') {
      return `contract-analysis-${analysis.contractId}.json`;
    }
    return `contract-analysis-${analysis.id.slice(0, 8)}.json`;
  };

  const exportData = {
    id: analysis.id,
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
  link.download = getFileName();
  link.click();
  URL.revokeObjectURL(url);
};

export const calculateCompletionRate = (analysesCount: number): number => {
  return analysesCount > 0 ? Math.min(95, 75 + analysesCount * 5) : 0;
};
