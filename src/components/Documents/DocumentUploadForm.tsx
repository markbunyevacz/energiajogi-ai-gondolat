
import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from 'lucide-react';

type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

interface DocumentUploadFormProps {
  selectedType: DocumentType;
  keywords: string;
  source: string;
  onTypeChange: (type: DocumentType) => void;
  onKeywordsChange: (keywords: string) => void;
  onSourceChange: (source: string) => void;
  onFilesSelected: (files: File[]) => void;
}

export function DocumentUploadForm({
  selectedType,
  keywords,
  source,
  onTypeChange,
  onKeywordsChange,
  onSourceChange,
  onFilesSelected
}: DocumentUploadFormProps) {
  const [dragActive, setDragActive] = useState(false);

  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'szerződés', label: 'Szerződés' },
    { value: 'rendelet', label: 'Rendelet' },
    { value: 'szabályzat', label: 'Szabályzat' },
    { value: 'törvény', label: 'Törvény' },
    { value: 'határozat', label: 'Határozat' },
    { value: 'egyéb', label: 'Egyéb' }
  ];

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
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
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
              <Select value={selectedType} onValueChange={(value) => onTypeChange(value as DocumentType)}>
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
                onChange={(e) => onSourceChange(e.target.value)}
                placeholder="pl. MVM, E.ON, MEKH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Kulcsszavak</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => onKeywordsChange(e.target.value)}
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
    </div>
  );
}
