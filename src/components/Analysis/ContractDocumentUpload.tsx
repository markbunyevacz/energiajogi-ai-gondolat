
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContractDocumentUploadProps {
  onAnalyze: (contractText: string) => void;
  isAnalyzing: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  content?: string;
}

export function ContractDocumentUpload({ onAnalyze, isAnalyzing }: ContractDocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    // For demo purposes, return placeholder text for other file types
    return `[Szerződés tartalma: ${file.name}]\n\nEz egy demo szöveg a szerződés tartalmának helyettesítésére. Valós implementációban PDF/DOC fájlok szövegét kellene kinyerni.\n\nSZERZŐDÉS ENERGIASZOLGÁLTATÁSRÓL\n\n1. SZERZŐDŐ FELEK\nSzolgáltató: MVM Energetika Zrt.\nFogyasztó: Példa Kft.\n\n2. SZOLGÁLTATÁS TÁRGYA\nA szolgáltató vállalja villamos energia szállítását a fogyasztó részére.\n\n7. ÁRAZÁS\n7.1 Az energia ára: 45 Ft/kWh\n7.2 Az árak változtatására a szolgáltató jogosult 30 napos előzetes értesítéssel.\n\n12. VIS MAIOR\nVis maior eseménynek minősül minden olyan esemény, amely a szolgáltató befolyásán kívül áll.`;
  };

  const processFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };

    setFiles(prev => [...prev, newFile]);

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 70; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 80 } : f
      ));

      // Extract text content
      const content = await extractTextFromFile(file);

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100, 
          content 
        } : f
      ));

      toast.success(`${file.name} sikeresen feldolgozva`);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
      ));
      toast.error(`Hiba ${file.name} feldolgozásakor`);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleAnalyzeFile = (file: UploadedFile) => {
    if (file.content) {
      onAnalyze(file.content);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-mav-blue" />
            <span>Szerződés Dokumentum Feltöltése</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-mav-blue bg-blue-50' 
                : 'border-gray-300 hover:border-mav-blue hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Szerződés feltöltése elemzéshez
            </h3>
            <p className="text-gray-600 mb-4">
              Húzza ide a szerződést vagy kattintson a tallózáshoz
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Támogatott formátumok: PDF, DOC, DOCX, TXT (max. 10MB)
            </p>
            <div>
              <Button 
                asChild 
                className="bg-mav-blue hover:bg-mav-blue-dark"
                disabled={isAnalyzing}
              >
                <label htmlFor="contract-upload" className="cursor-pointer">
                  Fájl tallózása
                </label>
              </Button>
              <input
                id="contract-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileInput}
                disabled={isAnalyzing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feltöltött Dokumentumok ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {file.status === 'completed' && file.content && (
                          <Button
                            size="sm"
                            onClick={() => handleAnalyzeFile(file)}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Elemzés Indítása
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          Eltávolítás
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{Math.round(file.progress)}%</span>
                    </div>
                    
                    {file.status !== 'completed' && file.status !== 'error' && (
                      <Progress value={file.progress} className="mt-2 h-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
