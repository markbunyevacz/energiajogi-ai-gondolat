import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadedFileItem } from './UploadedFileItem';
import { UploadedFilesListProps } from './types';

export function UploadedFilesList({
  files,
  isAnalyzing,
  onAnalyzeFile,
  onRemoveFile
}: UploadedFilesListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feltöltött Dokumentumok ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.map(file => (
            <UploadedFileItem
              key={file.id}
              file={file}
              isAnalyzing={isAnalyzing}
              onAnalyzeFile={onAnalyzeFile}
              onRemoveFile={onRemoveFile}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
