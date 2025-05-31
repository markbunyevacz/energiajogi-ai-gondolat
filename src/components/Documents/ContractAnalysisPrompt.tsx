import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from 'lucide-react';

type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

interface StoredDocument {
  id: string;
  title: string;
  type: DocumentType;
  file_size: number;
  upload_date: string;
  file_path: string;
  content: string | null;
}

interface ContractAnalysisPromptProps {
  documents: StoredDocument[];
  onNavigateToAnalysis: () => void;
}

export function ContractAnalysisPrompt({ documents, onNavigateToAnalysis }: ContractAnalysisPromptProps) {
  const contractCount = documents.filter(doc => doc.type === 'szerződés').length;
  
  if (contractCount === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-medium text-purple-900">Szerződéselemzés Elérhető</h3>
              <p className="text-sm text-purple-700">
                {contractCount} szerződés elemzésre kész
              </p>
            </div>
          </div>
          <Button 
            onClick={onNavigateToAnalysis}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Brain className="w-4 h-4 mr-1" />
            Elemzés Indítása
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
