
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentUploadForm } from './DocumentUploadForm';
import { FileUploadProgress } from './FileUploadProgress';
import { StoredDocumentsList } from './StoredDocumentsList';
import { ContractAnalysisPrompt } from './ContractAnalysisPrompt';
import { uploadToSupabase, analyzeContract } from './utils/documentUploadUtils';

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

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType>('egyéb');
  const [keywords, setKeywords] = useState('');
  const [source, setSource] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchStoredDocuments();
    }
  }, [user]);

  const fetchStoredDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, type, file_size, upload_date, file_path, content, analysis_status, analysis_error')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      // Type cast the analysis_status to ensure it matches our union type
      const typedDocuments = (data || []).map(doc => ({
        ...doc,
        analysis_status: (doc.analysis_status || 'not_analyzed') as 'not_analyzed' | 'analyzing' | 'completed' | 'failed'
      }));
      setStoredDocuments(typedDocuments);
    }
  };

  const handleFilesSelected = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      documentType: selectedType,
      file: file
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Start upload process for each file
    newFiles.forEach(file => {
      uploadToSupabase(file, user, source, keywords, updateFileProgress, fetchStoredDocuments);
    });
  };

  const updateFileProgress = (fileId: string, progress: number, status: UploadedFile['status']) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, progress, status } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleAnalyzeContract = (document: StoredDocument) => {
    analyzeContract(document, user, navigate);
  };

  const navigateToAnalysis = () => {
    navigate('/contract-analysis');
  };

  return (
    <div className="space-y-6">
      <DocumentUploadForm
        selectedType={selectedType}
        keywords={keywords}
        source={source}
        onTypeChange={setSelectedType}
        onKeywordsChange={setKeywords}
        onSourceChange={setSource}
        onFilesSelected={handleFilesSelected}
      />

      <FileUploadProgress
        files={files}
        onRemoveFile={removeFile}
      />

      <StoredDocumentsList
        documents={storedDocuments}
        onAnalyzeContract={handleAnalyzeContract}
        onNavigateToAnalysis={navigateToAnalysis}
      />

      <ContractAnalysisPrompt
        documents={storedDocuments}
        onNavigateToAnalysis={navigateToAnalysis}
      />
    </div>
  );
}
