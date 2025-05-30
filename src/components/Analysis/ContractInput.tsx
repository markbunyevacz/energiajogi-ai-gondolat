
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Shield, FileText } from 'lucide-react';

interface ContractInputProps {
  onAnalyze: (contractText: string) => void;
  isAnalyzing: boolean;
}

export function ContractInput({ onAnalyze, isAnalyzing }: ContractInputProps) {
  const [contractText, setContractText] = useState('');

  const handleAnalyze = () => {
    if (!contractText.trim()) return;
    onAnalyze(contractText);
    setContractText('');
  };

  const handleLoadSample = () => {
    setContractText(getMockContractText());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-mav-blue" />
          <span>Szerződéselemzés</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Illessze be ide a szerződés szövegét elemzéshez, vagy használja az alábbi mintaszöveget teszteléshez..."
            className="min-h-[200px] resize-none"
            disabled={isAnalyzing}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleLoadSample}
              disabled={isAnalyzing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Minta Szerződés Betöltése
            </Button>
            <div className="text-sm text-gray-500">
              {contractText.length}/10000 karakter
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyze}
            disabled={!contractText.trim() || isAnalyzing}
            className="bg-mav-blue hover:bg-mav-blue-dark"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Elemzés...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Szerződés Elemzése
              </>
            )}
          </Button>
        </div>

        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-mav-blue border-t-transparent rounded-full animate-spin" />
              <span>AI elemzés folyamatban...</span>
            </div>
            <Progress value={66} className="h-2" />
            <div className="text-xs text-gray-500">
              Jogi kockázatok azonosítása, szerződési feltételek elemzése...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getMockContractText(): string {
  return `ENERGIASZOLGÁLTATÁSI SZERZŐDÉS

1. SZERZŐDŐ FELEK
Szolgáltató: MVM Energetika Zrt.
Fogyasztó: Példa Kft.

2. SZOLGÁLTATÁS TÁRGYA
A szolgáltató vállalja villamos energia szállítását a fogyasztó részére.

7. ÁRAZÁS
7.1 Az energia ára: 45 Ft/kWh
7.2 Az árak változtatására a szolgáltató jogosult 30 napos előzetes értesítéssel.

8. SZERZŐDÉS MEGSZÜNTETÉSE
A szolgáltató jogosult a szerződést azonnali hatállyal felmondani nem fizetés esetén.

11. KÉSEDELMI KAMATOK
11.3 Késedelmi kamat mértéke: 12% évente

12. VIS MAIOR
Vis maior eseménynek minősül minden olyan esemény, amely a szolgáltató befolyásán kívül áll.

14. ÉRTESÍTÉSEK
A fogyasztó köteles minden változásról 15 napon belül értesíteni a szolgáltatót.

15. TELJESÍTMÉNY MONITORING
A szolgáltatás minőségét a szolgáltató saját belátása szerint ellenőrzi.`;
}
