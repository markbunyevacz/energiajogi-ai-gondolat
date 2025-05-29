
import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { ContractAnalysis } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoredDocument {
  id: string;
  title: string;
  type: string;
  file_size: number;
  upload_date: string;
  content: string | null;
}

export function useContractAnalysis() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [availableContracts, setAvailableContracts] = useState<StoredDocument[]>([]);

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
      console.log('Fetching contracts for user:', user.id);
      
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, type, file_size, upload_date, content')
        .eq('type', 'szerződés')
        .eq('uploaded_by', user.id)  // Explicitly filter by user ID
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        toast.error('Hiba a szerződések betöltésekor');
        return;
      }

      console.log('Fetched contracts:', data);
      setAvailableContracts(data || []);
    } catch (error) {
      console.error('Error fetching available contracts:', error);
      toast.error('Hiba a szerződések betöltésekor');
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
        fetchAnalyses();
      } else {
        throw new Error(data.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Hiba a szerződés elemzésekor');
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching data for user:', user.id);
      fetchAnalyses();
      fetchAvailableContracts();
    }
  }, [user]);

  return {
    analyses,
    availableContracts,
    analyzeContract,
    fetchAnalyses
  };
}
