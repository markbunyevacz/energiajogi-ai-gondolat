
import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { ContractAnalysis } from '@/types';
import { toast } from 'sonner';
import { StoredDocument } from './contractAnalysis/types';
import { 
  fetchContractAnalyses, 
  fetchAvailableContracts 
} from './contractAnalysis/analysisApi';
import { 
  analyzeContract as analyzeContractAction, 
  saveDocumentAndAnalyze as saveDocumentAndAnalyzeAction 
} from './contractAnalysis/contractAnalysisActions';

export function useContractAnalysis() {
  console.log('useContractAnalysis: Hook called');
  
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [availableContracts, setAvailableContracts] = useState<StoredDocument[]>([]);

  console.log('useContractAnalysis: Current state', {
    userId: user?.id,
    analysesCount: analyses.length,
    contractsCount: availableContracts.length
  });

  const fetchAnalyses = async () => {
    console.log('useContractAnalysis: fetchAnalyses called');
    if (!user) {
      console.log('useContractAnalysis: No user, skipping fetchAnalyses');
      return;
    }

    try {
      console.log('useContractAnalysis: Fetching analyses for user:', user.id);
      const analysesData = await fetchContractAnalyses(user.id);
      console.log('useContractAnalysis: Analyses fetched:', analysesData.length);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('useContractAnalysis: Error fetching contract analyses:', error);
      toast.error('Hiba az elemzések betöltésekor');
    }
  };

  const fetchContracts = async () => {
    console.log('useContractAnalysis: fetchContracts called');
    if (!user) {
      console.log('useContractAnalysis: No user, skipping fetchContracts');
      return;
    }

    try {
      console.log('useContractAnalysis: Fetching contracts for user:', user.id);
      const contractsData = await fetchAvailableContracts(user.id);
      console.log('useContractAnalysis: Contracts fetched:', contractsData.length);
      setAvailableContracts(contractsData);
    } catch (error) {
      console.error('useContractAnalysis: Error fetching available contracts:', error);
      toast.error('Hiba a szerződések betöltésekor');
    }
  };

  const handleStatusUpdate = (
    documentId: string, 
    status: StoredDocument['analysis_status'], 
    error?: string
  ) => {
    console.log('useContractAnalysis: Status update', { documentId, status, error });
    // Update local state
    setAvailableContracts(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, analysis_status: status, analysis_error: error || null }
        : doc
    ));
  };

  const analyzeContract = async (document: StoredDocument) => {
    console.log('useContractAnalysis: analyzeContract called for document:', document.id);
    if (!user) {
      console.log('useContractAnalysis: No user for analyze');
      return;
    }
    
    await analyzeContractAction(
      document,
      user.id,
      handleStatusUpdate,
      fetchAnalyses
    );
  };

  const saveDocumentAndAnalyze = async (file: File, content: string) => {
    console.log('useContractAnalysis: saveDocumentAndAnalyze called');
    if (!user) {
      console.log('useContractAnalysis: No user for save and analyze');
      return;
    }
    
    await saveDocumentAndAnalyzeAction(
      file,
      content,
      user.id,
      fetchContracts,
      analyzeContract
    );
  };

  useEffect(() => {
    console.log('useContractAnalysis: useEffect triggered', { hasUser: !!user, userId: user?.id });
    if (user) {
      console.log('User authenticated, fetching data for user:', user.id);
      fetchAnalyses();
      fetchContracts();
    }
  }, [user]);

  console.log('useContractAnalysis: Returning hook data');
  return {
    analyses,
    availableContracts,
    analyzeContract,
    saveDocumentAndAnalyze,
    fetchAnalyses,
    fetchAvailableContracts: fetchContracts
  };
}
