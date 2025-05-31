import React from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentUploadZoneProps } from './types';

export function DocumentUploadZone({
  isAnalyzing,
  onFileUpload,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop
}: DocumentUploadZoneProps) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  return (
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
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
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
  );
}
