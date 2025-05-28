
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, X, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
}

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('egyéb');
  const [keywords, setKeywords] = useState('');
  const [source, setSource] = useState('');
  const { user } = useAuth();

  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'szerződés', label: 'Szerződés' },
    { value: 'rendelet', label: 'Rendelet' },
    { value: 'szabályzat', label: 'Szabályzat' },
    { value: 'törvény', label: 'Törvény' },
    { value: 'határozat', label: 'Határozat' },
    { value: 'egyéb', label: 'Egyéb' }
  ];

  useEffect(() => {
    if (user) {
      fetchStoredDocuments();
    }
  }, [user]);

  const fetchStoredDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, type, file_size, upload_date, file_path, content')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setStoredDocuments(data || []);
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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (fileList: File[]) => {
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
      uploadToSupabase(file);
    });
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // Simple text extraction - in production, you'd use a proper library
    if (file.type === 'text/plain') {
      return await file.text();
    }
    // For demo purposes, return placeholder text for other file types
    return `[Dokumentum tartalma: ${file.name}]\n\nEz egy demo szöveg a dokumentum tartalmának helyettesítésére. Valós implementációban PDF/DOC fájlok szövegét kellene kinyerni.`;
  };

  const uploadToSupabase = async (uploadFile: UploadedFile) => {
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

      // Update file with document ID
      setFiles(prev => prev.map(file => 
        file.id === uploadFile.id ? { ...file, documentId: documentData.id } : file
      ));

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

    } catch (error) {
      console.error('Upload error:', error);
      updateFileProgress(uploadFile.id, 0, 'error');
      toast.error(`Hiba ${uploadFile.name} feltöltésekor`);
    }
  };

  const analyzeContract = async (document: StoredDocument) => {
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
        // You could navigate to analysis view or show results
      } else {
        throw new Error(data.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Hiba a szerződés elemzésekor');
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
      case 'ai-processing':
        return <Brain className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'ai-processing':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Feltöltés';
      case 'processing':
        return 'Feldolgozás';
      case 'ai-processing':
        return 'AI Feldolgozás';
      case 'completed':
        return 'Befejezve';
      case 'error':
        return 'Hiba';
      default:
        return 'Ismeretlen';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-mav-blue" />
            <span>Dokumentum Feltöltés Beállítások</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Dokumentum Típus</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon típust" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Forrás</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="pl. MVM, E.ON, MEKH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Kulcsszavak</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="vesszővel elválasztva"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
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
              Dokumentumok feltöltése AI feldolgozással
            </h3>
            <p className="text-gray-600 mb-4">
              Húzza ide a fájlokat vagy kattintson a tallózáshoz
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Támogatott formátumok: PDF, DOC, DOCX, TXT (max. 10MB)
            </p>
            <div>
              <Button asChild className="bg-mav-blue hover:bg-mav-blue-dark">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Fájlok tallózása
                </label>
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feltöltés folyamatban ({files.length})</CardTitle>
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
                        <Badge className={getStatusColor(file.status)}>
                          {getStatusText(file.status)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatFileSize(file.size)} • {file.documentType}</span>
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

      {/* Stored Documents */}
      {storedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tárolt Dokumentumok ({storedDocuments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storedDocuments.map(doc => (
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
                          <Button
                            size="sm"
                            onClick={() => analyzeContract(doc)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Brain className="w-4 h-4 mr-1" />
                            Elemzés
                          </Button>
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
      )}
    </div>
  );
}
