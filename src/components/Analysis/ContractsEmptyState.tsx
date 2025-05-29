
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ContractsEmptyState() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="pt-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nincsenek feltöltött szerződések
        </h3>
        <p className="text-gray-600 mb-4">
          Töltsön fel szerződéseket a főoldalon az elemzés megkezdéséhez
        </p>
        <Button onClick={() => navigate('/')}>
          Dokumentumok feltöltése
        </Button>
      </CardContent>
    </Card>
  );
}
