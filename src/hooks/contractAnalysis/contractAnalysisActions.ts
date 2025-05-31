import { toast } from 'sonner';
import { StoredDocument } from './types';
import { 
  updateDocumentAnalysisStatus, 
  saveDocumentToDatabase, 
  invokeContractAnalysis 
} from './analysisApi';

export const analyzeContract = async (
  document: StoredDocument,
  userId: string,
  onStatusUpdate: (docId: string, status: StoredDocument['analysis_status'], error?: string) => void,
  onAnalysisComplete: () => void
) => {
  if (!document.content || !userId) {
    toast.error('A dokumentum tartalma nem elérhető az elemzéshez');
    return;
  }

  try {
    // Set status to analyzing
    await updateDocumentAnalysisStatus(document.id, 'analyzing');
    onStatusUpdate(document.id, 'analyzing');
    toast.info('Szerződés elemzése folyamatban...');

    const data = await invokeContractAnalysis(document.id, document.content, userId);

    if (data?.success) {
      await updateDocumentAnalysisStatus(document.id, 'completed');
      onStatusUpdate(document.id, 'completed');
      toast.success('Szerződés elemzése sikeresen befejezve');
      // Immediately refresh the analyses list
      await onAnalysisComplete();
    } else {
      console.error('Analysis failed:', data);
      const errorMessage = data?.error || 'Ismeretlen hiba történt az elemzés során';
      await updateDocumentAnalysisStatus(document.id, 'failed', errorMessage);
      onStatusUpdate(document.id, 'failed', errorMessage);
      toast.error(`Elemzési hiba: ${errorMessage}`);
      
      // Log additional details for debugging
      if (data?.details) {
        console.error('Error details:', data.details);
      }
    }
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Kapcsolódási probléma';
    await updateDocumentAnalysisStatus(document.id, 'failed', errorMessage);
    onStatusUpdate(document.id, 'failed', errorMessage);
    toast.error(`Hiba a szerződés elemzésekor: ${errorMessage}`);
  }
};

export const saveDocumentAndAnalyze = async (
  file: File,
  content: string,
  userId: string,
  onContractsRefresh: () => void,
  analyzeFunction: (document: StoredDocument) => void
) => {
  if (!userId) {
    toast.error('Bejelentkezés szükséges');
    return;
  }

  try {
    toast.info('Dokumentum mentése...');

    const documentData = await saveDocumentToDatabase(file, content, userId);

    // Now analyze the saved document
    await analyzeFunction({
      id: documentData.id,
      title: documentData.title,
      type: documentData.type,
      file_size: documentData.file_size || 0,
      upload_date: documentData.upload_date ?? documentData.created_at ?? "",
      content: documentData.content,
      analysis_status: 'not_analyzed',
      analysis_error: null
    });

    // Refresh the contracts list to show the new document
    await onContractsRefresh();

  } catch (error) {
    console.error('Error saving document:', error);
    toast.error('Hiba a dokumentum mentésekor');
  }
};
