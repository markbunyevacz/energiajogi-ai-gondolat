import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, ArrowRight, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
  analysis_status?: 'not_analyzed' | 'analyzing' | 'completed' | 'failed';
  analysis_error?: string | null;
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Elemzett</Badge>;
      case 'analyzing':
        return <Badge className="bg-yellow-100 text-yellow-800">Elemzés...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Hiba</Badge>;
      default:
        return null;
    }
  };

  const getContractActionButton = (doc: StoredDocument) => {
    if (doc.type !== 'szerződés' || !doc.content) return null;

    switch (doc.analysis_status) {
      case 'completed':
        return (
          <Button
            size="sm"
            onClick={onNavigateToAnalysis}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-4 h-4 mr-1" />
            Eredmény
          </Button>
        );
      case 'analyzing':
        return (
          <Button size="sm" disabled className="bg-yellow-600 text-white">
            Elemzés...
          </Button>
        );
      case 'failed':
        return (
          <Button
            size="sm"
            onClick={() => onAnalyzeContract(doc)}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Újra
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => onAnalyzeContract(doc)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Brain className="w-4 h-4 mr-1" />
            Elemzés
          </Button>
        );
    }
  };

  // EXCEL EXPORT
  const handleExportExcel = () => {
    const exportData = documents.map(doc => ({
      Cím: doc.title,
      Típus: doc.type,
      Méret: formatFileSize(doc.file_size),
      Feltöltés: new Date(doc.upload_date).toLocaleDateString('hu-HU'),
      Állapot: doc.analysis_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dokumentumok");
    XLSX.writeFile(workbook, "dokumentumok.xlsx");
  };

  // PDF EXPORT
  const handleExportPDF = () => {
    const docPDF = new jsPDF();
    const exportData = documents.map(doc => [
      doc.title,
      doc.type,
      formatFileSize(doc.file_size),
      new Date(doc.upload_date).toLocaleDateString('hu-HU'),
      doc.analysis_status,
    ]);
    docPDF.autoTable({
      head: [["Cím", "Típus", "Méret", "Feltöltés", "Állapot"]],
      body: exportData,
    });
    docPDF.save("dokumentumok.pdf");
  };

  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tárolt Dokumentumok ({documents.length})</CardTitle>
          <div className="flex gap-2">
            {/* EXPORT GOMBOK */}
            <Button variant="outline" onClick={handleExportExcel}>
              Exportálás Excelbe
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              Exportálás PDF-be
            </Button>
            <Button 
              onClick={onNavigateToAnalysis}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Brain className="w-4 h-4 mr-1" />
              Szerződéselemzés oldal
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
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
                    {doc.type === 'szerződés' && getStatusBadge(doc.analysis_status)}
                    {getContractActionButton(doc)}
                    {doc.type === 'szerződés' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateToAnalysis}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Elemzés oldal
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{new Date(doc.upload_date).toLocaleDateString('hu-HU')}</span>
                </div>

                {doc.analysis_status === 'failed' && doc.analysis_error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Hiba:</span>
                    </div>
                    <p className="mt-1">{doc.analysis_error}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
