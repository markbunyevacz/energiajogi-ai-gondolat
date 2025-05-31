import { useState, useCallback } from 'react';
import { DocumentUploadZone } from './Upload/DocumentUploadZone';
import { UploadedFilesList } from './Upload/UploadedFilesList';
import { UploadedFile } from './Upload/types';
import { extractTextFromFile } from './Upload/utils';
import { toast } from 'sonner';

interface ContractDocumentUploadProps {
  onSaveAndAnalyze: (file: File, content: string) => void;
  isAnalyzing: boolean;
}

export function ContractDocumentUpload({ onSaveAndAnalyze, isAnalyzing }: ContractDocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

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
          content,
          file
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

  const handleFileUpload = (fileList: FileList) => {
    Array.from(fileList).forEach(processFile);
  };

  const handleSaveAndAnalyze = (uploadedFile: UploadedFile) => {
    if (uploadedFile.content && uploadedFile.file) {
      onSaveAndAnalyze(uploadedFile.file, uploadedFile.content);
      // Remove the file from the list after processing
      setFiles(prev => prev.filter(f => f.id !== uploadedFile.id));
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      <DocumentUploadZone
        isAnalyzing={isAnalyzing}
        onFileUpload={handleFileUpload}
        dragActive={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      />

      <UploadedFilesList
        files={files}
        isAnalyzing={isAnalyzing}
        onAnalyzeFile={handleSaveAndAnalyze}
        onRemoveFile={removeFile}
      />
    </div>
  );
}
