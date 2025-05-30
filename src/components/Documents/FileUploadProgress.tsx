import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, AlertCircle, X, Brain } from 'lucide-react';

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

interface FileUploadProgressProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
}

export function FileUploadProgress({ files, onRemoveFile }: FileUploadProgressProps) {
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

  if (files.length === 0) return null;

  return (
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
                      onClick={() => onRemoveFile(file.id)}
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
  );
}
