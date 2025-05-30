
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadedFileItemProps } from './types';
import { formatFileSize } from './utils';

export function UploadedFileItem({
  file,
  isAnalyzing,
  onAnalyzeFile,
  onRemoveFile
}: UploadedFileItemProps) {
  const getStatusIcon = (status: typeof file.status) => {
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
    <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
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
                onClick={() => onAnalyzeFile(file)}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Elemzés Indítása
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(file.id)}
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
  );
}
