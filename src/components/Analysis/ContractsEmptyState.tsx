
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from 'lucide-react';

interface ContractsEmptyStateProps {
  onSwitchToAnalyze: () => void;
}

export function ContractsEmptyState({ onSwitchToAnalyze }: ContractsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nincsenek feltöltött szerződések
        </h3>
        <p className="text-gray-600 mb-4">
          Töltsön fel szerződéseket az elemzés megkezdéséhez
        </p>
        <Button 
          onClick={onSwitchToAnalyze}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Új szerződés feltöltése
        </Button>
      </CardContent>
    </Card>
  );
}
