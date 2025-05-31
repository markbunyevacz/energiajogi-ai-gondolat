import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ContractAnalysisPrompt } from './ContractAnalysisPrompt';
import { uploadToSupabase, analyzeContract } from './utils/documentUploadUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';
export type AnalysisStatus = 'not_analyzed' | 'analyzing' | 'completed' | 'failed';

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

export interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
  analysis_status: AnalysisStatus;
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
  const [isUploading, setIsUploading] = useState(false);

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
        id: doc.id,
        title: doc.title,
        type: doc.type as DocumentType,
        file_size: doc.file_size || 0,
        upload_date: doc.upload_date || new Date().toISOString(),
        file_path: doc.file_path || '',
        content: doc.content || null,
        analysis_status: (doc.analysis_status || 'not_analyzed') as AnalysisStatus,
        analysis_error: doc.analysis_error || null
      })) as StoredDocument[];
      setStoredDocuments(typedDocuments);
    }
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
    analyzeContract(document, user as unknown as SupabaseUser, navigate);
  };

  const navigateToAnalysis = () => {
    navigate('/contract-analysis');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newDocuments: StoredDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const document: StoredDocument = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name,
        type: selectedType,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        file_path: '',
        content: null,
        analysis_status: 'not_analyzed',
        analysis_error: null
      };
      newDocuments.push(document);
    }

    setStoredDocuments(prev => [...prev, ...newDocuments]);
    setIsUploading(false);
    toast.success('Dokumentumok sikeresen feltöltve');
  };

  const handleDocumentTypeChange = (documentId: string, newType: DocumentType) => {
    setStoredDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, type: newType } : doc
    ));
  };

  const handleDocumentDelete = (documentId: string) => {
    setStoredDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Dokumentum sikeresen törölve');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <span>Dokumentum Feltöltés</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="files">Válasszon dokumentumokat</Label>
          <Input
            id="files"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="cursor-pointer"
          />
        </div>

        {storedDocuments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Feltöltött dokumentumok</h3>
            <div className="space-y-2">
              {storedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.upload_date).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={doc.type}
                      onValueChange={(value: DocumentType) => handleDocumentTypeChange(doc.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="szerződés">Szerződés</SelectItem>
                        <SelectItem value="rendelet">Rendelet</SelectItem>
                        <SelectItem value="szabályzat">Szabályzat</SelectItem>
                        <SelectItem value="törvény">Törvény</SelectItem>
                        <SelectItem value="határozat">Határozat</SelectItem>
                        <SelectItem value="egyéb">Egyéb</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDocumentDelete(doc.id)}
                    >
                      Törlés
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
