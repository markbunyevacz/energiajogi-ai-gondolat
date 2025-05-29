
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ai-processing' | 'completed' | 'error';
  progress: number;
  documentType?: DocumentType;
  file?: File;
  documentId?: string;
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  // Simple text extraction - in production, you'd use a proper library
  if (file.type === 'text/plain') {
    return await file.text();
  }
  // For demo purposes, return placeholder text for other file types
  return `[Dokumentum tartalma: ${file.name}]\n\nEz egy demo szöveg a dokumentum tartalmának helyettesítésére. Valós implementációban PDF/DOC fájlok szövegét kellene kinyerni.`;
};

export const uploadToSupabase = async (
  uploadFile: UploadedFile,
  user: any,
  source: string,
  keywords: string,
  updateFileProgress: (fileId: string, progress: number, status: UploadedFile['status']) => void,
  fetchStoredDocuments: () => void
) => {
  if (!user || !uploadFile.file) return;

  try {
    // Update progress to show upload starting
    updateFileProgress(uploadFile.id, 10, 'uploading');

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${Date.now()}_${uploadFile.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, uploadFile.file);

    if (uploadError) throw uploadError;

    updateFileProgress(uploadFile.id, 40, 'processing');

    // Extract text content from file
    const content = await extractTextFromFile(uploadFile.file);

    // Save document metadata to database
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        title: uploadFile.name,
        type: uploadFile.documentType || 'egyéb',
        file_path: filePath,
        file_size: uploadFile.size,
        uploaded_by: user.id,
        content: content,
        metadata: {
          source: source,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
        }
      })
      .select()
      .single();

    if (dbError) throw dbError;

    updateFileProgress(uploadFile.id, 70, 'ai-processing');

    // Process document with AI for embeddings
    const { data: aiData, error: aiError } = await supabase.functions.invoke('process-document', {
      body: {
        documentId: documentData.id,
        content: content,
      },
    });

    if (aiError) {
      console.error('AI processing error:', aiError);
      // Continue without AI processing
    }

    updateFileProgress(uploadFile.id, 100, 'completed');
    toast.success(`${uploadFile.name} sikeresen feltöltve és feldolgozva`);
    
    // Refresh the stored documents list
    fetchStoredDocuments();

    return documentData;

  } catch (error) {
    console.error('Upload error:', error);
    updateFileProgress(uploadFile.id, 0, 'error');
    toast.error(`Hiba ${uploadFile.name} feltöltésekor`);
    throw error;
  }
};

export const analyzeContract = async (document: any, user: any, navigate: any) => {
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
      // Navigate to contract analysis page to view results
      navigate('/contract-analysis');
    } else {
      throw new Error(data.error || 'Ismeretlen hiba');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    toast.error('Hiba a szerződés elemzésekor');
  }
};
