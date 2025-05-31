import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ContractAnalysisHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Szerződéselemzés</h1>
        <p className="text-gray-600 mt-2">
          AI-alapú szerződéselemzés, kockázatértékelés és megfelelőségi ellenőrzés
        </p>
      </div>
      <Button 
        variant="outline" 
        onClick={() => navigate('/')}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Vissza a főoldalra</span>
      </Button>
    </div>
  );
}
