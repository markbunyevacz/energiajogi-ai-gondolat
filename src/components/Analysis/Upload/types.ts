
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  content?: string;
  file?: File;
}

export interface DocumentUploadZoneProps {
  isAnalyzing: boolean;
  onFileUpload: (files: FileList) => void;
  dragActive: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export interface UploadedFilesListProps {
  files: UploadedFile[];
  isAnalyzing: boolean;
  onAnalyzeFile: (file: UploadedFile) => void;
  onRemoveFile: (fileId: string) => void;
}

export interface UploadedFileItemProps {
  file: UploadedFile;
  isAnalyzing: boolean;
  onAnalyzeFile: (file: UploadedFile) => void;
  onRemoveFile: (fileId: string) => void;
}
