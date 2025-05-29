
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, ArrowRight } from 'lucide-react';

type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
}

interface StoredDocumentsListProps {
  documents: StoredDocument[];
  onAnalyzeContract: (document: StoredDocument) => void;
  onNavigateToAnalysis: () => void;
}

export function StoredDocumentsList({
  documents,
  onAnalyzeContract,
  onNavigateToAnalysis
}: StoredDocumentsListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tárolt Dokumentumok ({documents.length})</CardTitle>
          <Button 
            onClick={onNavigateToAnalysis}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Brain className="w-4 h-4 mr-1" />
            Szerződéselemzés oldal
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map(doc => (
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
                    <Badge variant="outline">
                      {doc.type}
                    </Badge>
                    {doc.type === 'szerződés' && doc.content && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onAnalyzeContract(doc)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          Elemzés
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onNavigateToAnalysis}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Elemzés oldal
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{new Date(doc.upload_date).toLocaleDateString('hu-HU')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
