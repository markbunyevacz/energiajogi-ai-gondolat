import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type DocumentType = Database['public']['Enums']['document_type'];
type AnalysisStatus = 'not_analyzed' | 'analyzing' | 'completed' | 'failed';

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
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [selectedType] = useState<DocumentType>('egyéb');
  const { user } = useAuth();
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

  const handleDocumentTypeChange = (documentId: string, newType: DocumentType) => {
    setStoredDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, type: newType } : doc
    ));
  };

  const handleDocumentDelete = (documentId: string) => {
    setStoredDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Dokumentum sikeresen törölve');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <Button
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Fájl kiválasztása
        </Button>
      </div>

      {storedDocuments.length > 0 && (
        <div className="space-y-4">
          {storedDocuments.map(doc => (
            <div key={doc.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{doc.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(doc.upload_date).toLocaleDateString()}
                </p>
              </div>
              <Select
                value={doc.type}
                onValueChange={(value) => handleDocumentTypeChange(doc.id, value as DocumentType)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Dokumentum típusa" />
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
                variant="destructive"
                size="sm"
                onClick={() => handleDocumentDelete(doc.id)}
              >
                Törlés
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
