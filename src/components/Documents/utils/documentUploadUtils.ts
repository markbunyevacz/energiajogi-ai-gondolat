
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

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

interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
  analysis_status: 'not_analyzed' | 'analyzing' | 'completed' | 'failed';
  analysis_error: string | null;
}

export const uploadToSupabase = async (
  file: UploadedFile,
  user: User | null,
  source: string,
  keywords: string,
  updateProgress: (fileId: string, progress: number, status: UploadedFile['status']) => void,
  onComplete: () => void
) => {
  if (!user || !file.file) return;

  try {
    // Simulate upload progress
    for (let progress = 0; progress <= 70; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(file.id, progress, 'uploading');
    }

    updateProgress(file.id, 80, 'processing');

    // Extract text content (simplified - in real implementation you'd use proper text extraction)
    const reader = new FileReader();
    const content = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file.file!);
    });

    updateProgress(file.id, 90, 'ai-processing');

    // Save to database
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        title: file.name,
        type: file.documentType,
        file_size: file.size,
        uploaded_by: user.id,
        content: content,
        metadata: {
          source: source || 'Dokumentum feltöltés',
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      updateProgress(file.id, 0, 'error');
      toast.error('Hiba a dokumentum mentésekor');
      return;
    }

    updateProgress(file.id, 100, 'completed');
    toast.success(`${file.name} sikeresen feltöltve`);
    onComplete();

  } catch (error) {
    console.error('Upload error:', error);
    updateProgress(file.id, 0, 'error');
    toast.error(`Hiba ${file.name} feltöltésekor`);
  }
};

export const analyzeContract = async (
  document: StoredDocument,
  user: User | null,
  navigate: (path: string) => void
) => {
  if (!user) {
    toast.error('Bejelentkezés szükséges');
    return;
  }

  if (!document.content) {
    toast.error('A dokumentum tartalma nem elérhető az elemzéshez');
    return;
  }

  try {
    // Update status to analyzing
    const { error: updateError } = await supabase
      .from('documents')
      .update({ analysis_status: 'analyzing' })
      .eq('id', document.id);

    if (updateError) {
      console.error('Error updating status:', updateError);
      toast.error('Hiba az állapot frissítésekor');
      return;
    }

    toast.info('Szerződés elemzése folyamatban...');

    // Call the analysis function
    const { data, error } = await supabase.functions.invoke('analyze-contract', {
      body: {
        documentId: document.id,
        content: document.content,
        userId: user.id,
      },
    });

    if (error) {
      console.error('Analysis error:', error);
      await supabase
        .from('documents')
        .update({ 
          analysis_status: 'failed',
          analysis_error: error.message || 'Kapcsolódási probléma'
        })
        .eq('id', document.id);
      
      toast.error('Hiba a szerződés elemzésekor');
      return;
    }

    if (data?.success) {
      await supabase
        .from('documents')
        .update({ analysis_status: 'completed' })
        .eq('id', document.id);
      
      toast.success('Szerződés elemzése sikeresen befejezve');
      navigate('/contract-analysis');
    } else {
      console.error('Analysis failed:', data);
      const errorMessage = data?.error || 'Ismeretlen hiba történt az elemzés során';
      
      await supabase
        .from('documents')
        .update({ 
          analysis_status: 'failed',
          analysis_error: errorMessage
        })
        .eq('id', document.id);
      
      toast.error(`Elemzési hiba: ${errorMessage}`);
    }

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
    
    await supabase
      .from('documents')
      .update({ 
        analysis_status: 'failed',
        analysis_error: errorMessage
      })
      .eq('id', document.id);
    
    toast.error(`Hiba a szerződés elemzésekor: ${errorMessage}`);
  }
};
