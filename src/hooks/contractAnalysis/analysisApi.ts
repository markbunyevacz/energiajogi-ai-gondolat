import { supabase } from '@/integrations/supabase/client';
import { ContractAnalysis } from '@/types';
import { StoredDocument } from './types';

export const fetchContractAnalyses = async (userId: string) => {
  console.log('Fetching analyses for user:', userId);
  
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
    .eq('analyzed_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analyses:', error);
    return [];
  }

  console.log('Fetched analyses data:', data);

  const transformedAnalyses: ContractAnalysis[] = data.map(item => ({
    id: item.id,
    contractId: item.contract_id,
    riskLevel: item.risk_level as 'low' | 'medium' | 'high',
    summary: item.summary || '',
    recommendations: item.recommendations || [],
    timestamp: item.created_at,
    risks: item.risks || [],
    title: item.title || 'Contract Analysis',
    description: item.summary,
    status: 'completed',
    created_at: item.created_at || new Date().toISOString()
  }));

  console.log('Transformed analyses:', transformedAnalyses);
  return transformedAnalyses;
};

export const fetchAvailableContracts = async (userId: string) => {
  console.log('Fetching contracts for user:', userId);
  
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, type, file_size, upload_date, content, analysis_status, analysis_error')
    .eq('type', 'szerződés')
    .eq('uploaded_by', userId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching contracts:', error);
    throw new Error('Hiba a szerződések betöltésekor');
  }

  console.log('Fetched contracts:', data);
  // Type cast the analysis_status to ensure it matches our union type
  const typedContracts = (data || []).map(doc => ({
    ...doc,
    analysis_status: (doc.analysis_status || 'not_analyzed') as 'not_analyzed' | 'analyzing' | 'completed' | 'failed'
  }));
  
  return typedContracts;
};

export const updateDocumentAnalysisStatus = async (
  documentId: string, 
  status: StoredDocument['analysis_status'], 
  error?: string
) => {
  const { error: updateError } = await supabase
    .from('documents')
    .update({ 
      analysis_status: status,
      analysis_error: error || null
    })
    .eq('id', documentId);

  if (updateError) {
    console.error('Error updating document status:', updateError);
    throw updateError;
  }
};

export const saveDocumentToDatabase = async (
  file: File,
  content: string,
  userId: string
) => {
  console.log('Saving document to database...');

  const { data: documentData, error: dbError } = await supabase
    .from('documents')
    .insert({
      title: file.name,
      type: 'szerződés',
      file_size: file.size,
      uploaded_by: userId,
      content: content,
      analysis_status: 'not_analyzed',
      metadata: {
        source: 'Szerződéselemzés oldal feltöltés',
        keywords: ['szerződés', 'elemzés']
      }
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error saving document:', dbError);
    throw new Error('Hiba a dokumentum mentésekor');
  }

  console.log('Document saved successfully:', documentData.id);
  return documentData;
};

export const invokeContractAnalysis = async (
  documentId: string,
  content: string,
  userId: string
) => {
  console.log('Starting contract analysis for document:', documentId);
  
  const { data, error } = await supabase.functions.invoke('analyze-contract', {
    body: {
      documentId: documentId,
      content: content,
      userId: userId,
    },
  });

  if (error) {
    console.error('Function invoke error:', error);
    throw new Error('Kapcsolódási probléma');
  }

  console.log('Analysis response:', data);
  return data;
};
