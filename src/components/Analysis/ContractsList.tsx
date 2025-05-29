import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface StoredDocument {
  id: string;
  title: string;
  type: string;
  file_size: number;
  upload_date: string;
  content: string | null;
}

interface ContractsListProps {
  contracts: StoredDocument[];
  onAnalyzeContract: (document: StoredDocument) => void;
}

export function ContractsList({ contracts, onAnalyzeContract }: ContractsListProps) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnalyze = async (doc: StoredDocument) => {
    if (!doc.content) {
      console.error('Document has no content:', doc.id);
      toast.error('A dokumentum tartalma nem elérhető az elemzéshez');
      return;
    }

    console.log('Starting analysis for document:', doc.title);
    setAnalyzingId(doc.id);
    
    try {
      await onAnalyzeContract(doc);
    } catch (error) {
      console.error('Error analyzing contract:', error);
      toast.error('Hiba történt az elemzés során');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Elérhető Szerződések Elemzéshez</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nincsenek elérhető szerződések az elemzéshez. Töltse fel a szerződéseket a Dokumentumok oldalon.
            </p>
          ) : (
            contracts.map(doc => (
              <div
                key={doc.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Szerződés</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(doc)}
                        disabled={analyzingId === doc.id || !doc.content}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        {analyzingId === doc.id ? 'Elemzés...' : 'Elemzés Indítása'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{new Date(doc.upload_date).toLocaleDateString('hu-HU')}</span>
                  </div>

                  {!doc.content && (
                    <p className="text-xs text-red-500 mt-1">
                      Dokumentum tartalom nem elérhető - töltse fel újra a dokumentumot
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
