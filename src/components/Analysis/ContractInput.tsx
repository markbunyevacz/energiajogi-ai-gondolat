import React from 'react';
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
1.1. Szolgáltató: MVM Energetika Zrt.
     Székhely: 1031 Budapest, Váci út 81.
     Adószám: 10394002-2-44
     Cégjegyzékszám: 01-10-041755
     Képviselő: Dr. Nagy János, ügyvezető igazgató

1.2. Fogyasztó: Példa Kft.
     Székhely: 1051 Budapest, Vörösmarty tér 1.
     Adószám: 12345678-2-41
     Cégjegyzékszám: 01-09-123456
     Képviselő: Dr. Kovács Péter, ügyvezető igazgató

2. SZOLGÁLTATÁS TÁRGYA
2.1. A Szolgáltató vállalja villamos energia szállítását a Fogyasztó részére.
2.2. A szolgáltatás helye: 1051 Budapest, Vörösmarty tér 1.
2.3. A szolgáltatás típusa: Kereskedelmi fogyasztói pont

3. SZERZŐDÉS IDŐTARTAMA
3.1. A szerződés hatálybalépése: 2024.01.01.
3.2. A szerződés határozatlan időre szól.
3.3. A szerződés felmondható 30 napos előzetes írásbeli értesítéssel.

4. SZOLGÁLTATÁSI KÖTELEZETTSÉGEK
4.1. A Szolgáltató köteles:
    - Megszakításmentes energiaellátást biztosítani
    - A szolgáltatás minőségét folyamatosan monitorozni
    - A fogyasztói ponton megfelelő minőségű energiát szállítani
    - A szolgáltatással kapcsolatos problémákat 24 órán belül megoldani

4.2. A Fogyasztó köteles:
    - A fogyasztási helyen megfelelő műszaki feltételeket biztosítani
    - A szolgáltatás díját a szerződésben rögzített határidőig megfizetni
    - A fogyasztási helyen történt változásokat 15 napon belül jelenteni

5. ÁRAZÁS
5.1. Az energia ára: 45 Ft/kWh
5.2. A szolgáltatási díj: 5.000 Ft/hó
5.3. Az árak változtatására a Szolgáltató jogosult 30 napos előzetes értesítéssel.
5.4. A fogyasztás alapján történő elszámolás havonta történik.

6. FIZETÉSI FELTÉTELEK
6.1. A szolgáltatás díját a Fogyasztó köteles a következő hónap 15. napjáig megfizetni.
6.2. Késedelmes fizetés esetén a Szolgáltató jogosult késedelmi kamatot számítani.
6.3. A késedelmi kamat mértéke: a jegybanki alapkamat + 5 százalékpont.

7. SZERZŐDÉS MEGSZÜNTETÉSE
7.1. A Szolgáltató jogosult a szerződést azonnali hatállyal felmondani:
    - Ha a Fogyasztó 30 napon belül nem fizeti meg a tartozását
    - Ha a Fogyasztó jogosulatlanul használja a szolgáltatást
    - Ha a Fogyasztó a szerződéses kötelezettségeit súlyosan megsérti

7.2. A Fogyasztó jogosult a szerződést 30 napos előzetes értesítéssel felmondani.

8. VIS MAIOR
8.1. Vis maior eseménynek minősül minden olyan körülmény, amely a felek befolyásán kívül áll.
8.2. Vis maior esemény esetén a felek kötelesek azonnal értesíteni egymást.
8.3. A vis maior esemény megszűnését követően a felek kötelesek a szolgáltatást mielőbb helyreállítani.

9. ADATKEZELÉS
9.1. A felek kötelesek a GDPR rendelkezéseinek megfelelően kezelni az adatokat.
9.2. A Szolgáltató köteles a fogyasztási adatokat 8 évig megőrizni.
9.3. A Fogyasztó hozzájárul az adatok kezeléséhez a szolgáltatás nyújtása céljából.

10. VÉGLEGES RENDELKEZÉSEK
10.1. A szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezései az irányadóak.
10.2. A felek közötti jogviták rendezésére a budapesti bíróságok illetékesek.
10.3. A szerződés 2 példányban készült, mindkét fél egy-egy példányt megkapta.

Budapest, 2023.12.15.

Szolgáltató:                                Fogyasztó:
_________________                           _________________
Dr. Nagy János                              Dr. Kovács Péter
ügyvezető igazgató                          ügyvezető igazgató`;
}
