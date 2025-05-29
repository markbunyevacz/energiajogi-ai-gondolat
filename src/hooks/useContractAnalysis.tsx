
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
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [availableContracts, setAvailableContracts] = useState<StoredDocument[]>([]);

  const fetchAnalyses = async () => {
    if (!user) return;

    try {
      const analysesData = await fetchContractAnalyses(user.id);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Error fetching contract analyses:', error);
    }
  };

  const fetchContracts = async () => {
    if (!user) return;

    try {
      const contractsData = await fetchAvailableContracts(user.id);
      setAvailableContracts(contractsData);
    } catch (error) {
      console.error('Error fetching available contracts:', error);
      toast.error('Hiba a szerződések betöltésekor');
    }
  };

  const handleStatusUpdate = (
    documentId: string, 
    status: StoredDocument['analysis_status'], 
    error?: string
  ) => {
    // Update local state
    setAvailableContracts(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, analysis_status: status, analysis_error: error || null }
        : doc
    ));
  };

  const analyzeContract = async (document: StoredDocument) => {
    if (!user) return;
    
    await analyzeContractAction(
      document,
      user.id,
      handleStatusUpdate,
      fetchAnalyses
    );
  };

  const saveDocumentAndAnalyze = async (file: File, content: string) => {
    if (!user) return;
    
    await saveDocumentAndAnalyzeAction(
      file,
      content,
      user.id,
      fetchContracts,
      analyzeContract
    );
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching data for user:', user.id);
      fetchAnalyses();
      fetchContracts();
    }
  }, [user]);

  return {
    analyses,
    availableContracts,
    analyzeContract,
    saveDocumentAndAnalyze,
    fetchAnalyses,
    fetchAvailableContracts: fetchContracts
  };
}
