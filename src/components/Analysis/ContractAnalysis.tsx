
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, FileText, TrendingUp, DollarSign, Clock, Upload } from 'lucide-react';
import { ContractAnalysis, Risk } from '@/types';

export function ContractAnalysisComponent() {
  const [contractText, setContractText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ContractAnalysis[]>([
    {
      id: '1',
      contractId: 'MVM-2024-001',
      riskLevel: 'medium',
      risks: [
        {
          type: 'legal',
          severity: 'high',
          description: 'Force majeure klauzula hiányos - nem tartalmazza az energiapiaci specifikus eseményeket',
          recommendation: 'Egészítse ki a force majeure klauzulát energiapiaci eseményekkel (pl. hálózati kapacitáshiány, szabályozási változások)',
          section: '12. szakasz'
        },
        {
          type: 'financial',
          severity: 'medium',
          description: 'Árazási formula nem tartalmaz inflációs indexet',
          recommendation: 'Vezessen be inflációs indexet az árazási formulába a vásárlóerő megőrzése érdekében',
          section: '7.2 pont'
        },
        {
          type: 'operational',
          severity: 'low',
          description: 'Teljesítmény monitoring feltételek nem egyértelműek',
          recommendation: 'Pontosítsa a teljesítmény mérési módszereket és gyakoriságot',
          section: '15. szakasz'
        }
      ],
      recommendations: [
        'Force majeure klauzula bővítése energiapiaci eseményekkel',
        'Inflációs index beépítése az árazási formulába',
        'Teljesítmény monitoring feltételek pontosítása',
        'Felmondási feltételek felülvizsgálata'
      ],
      summary: 'A szerződés általánosságban megfelelő, de három területen javasolt javítások végrehajtása. A legnagyobb kockázat a hiányos force majeure klauzula.',
      timestamp: '2024-01-15T11:30:00Z'
    }
  ]);

  const handleAnalyze = async () => {
    if (!contractText.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const newAnalysis: ContractAnalysis = {
        id: Math.random().toString(36).substr(2, 9),
        contractId: `DEMO-${Date.now()}`,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        risks: generateMockRisks(),
        recommendations: generateMockRecommendations(),
        summary: 'Az AI elemzés befejeződött. A szerződés részletes áttekintése alapján azonosított kockázatok és javaslatok.',
        timestamp: new Date().toISOString()
      };
      
      setAnalysisResults(prev => [newAnalysis, ...prev]);
      setContractText('');
      setIsAnalyzing(false);
    }, 3000);
  };

  const generateMockRisks = (): Risk[] => {
    const allRisks = [
      {
        type: 'legal' as const,
        severity: 'high' as const,
        description: 'Felmondási feltételek egyoldalúan a szolgáltató javára szólnak',
        recommendation: 'Kölcsönös felmondási jogok biztosítása megfelelő határidőkkel',
        section: '8. szakasz'
      },
      {
        type: 'financial' as const,
        severity: 'medium' as const,
        description: 'Késedelmi kamat mértéke magasabb a jogszabályi maximumnál',
        recommendation: 'Késedelmi kamat csökkentése a Ptk. szerinti mértékre',
        section: '11.3 pont'
      },
      {
        type: 'operational' as const,
        severity: 'low' as const,
        description: 'Értesítési kötelezettségek nem szimmetrikusak',
        recommendation: 'Kölcsönös értesítési kötelezettségek meghatározása',
        section: '14. szakasz'
      }
    ];
    
    return allRisks.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateMockRecommendations = (): string[] => {
    const allRecommendations = [
      'Adatvédelmi záradék GDPR-kompatibilis frissítése',
      'Vis maior események kibővítése járványhelyzetre',
      'Elektronikus kommunikáció feltételeinek pontosítása',
      'Szellemi tulajdon védelmének megerősítése',
      'Minőségbiztosítási követelmények bevezetése'
    ];
    
    return allRecommendations.slice(0, Math.floor(Math.random() * 3) + 2);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Magas';
      case 'medium': return 'Közepes';
      case 'low': return 'Alacsony';
      default: return level;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
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
                onClick={() => setContractText(getMockContractText())}
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

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Elemzési Eredmények</h2>
          
          {analysisResults.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-mav-blue" />
                    <span>Szerződés: {analysis.contractId}</span>
                  </CardTitle>
                  <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                    {getRiskLevelLabel(analysis.riskLevel)} kockázat
                  </Badge>
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {analysis.summary}
                  </AlertDescription>
                </Alert>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="risks" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="risks">Kockázatok ({analysis.risks.length})</TabsTrigger>
                    <TabsTrigger value="recommendations">Javaslatok</TabsTrigger>
                    <TabsTrigger value="summary">Összefoglaló</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="risks" className="space-y-4">
                    {analysis.risks.map((risk, index) => (
                      <Card key={index} className="border-l-4 border-l-mav-blue">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                {getSeverityIcon(risk.severity)}
                                <Badge variant="outline" className="text-xs">
                                  {risk.type === 'legal' && 'Jogi'}
                                  {risk.type === 'financial' && 'Pénzügyi'}
                                  {risk.type === 'operational' && 'Működési'}
                                </Badge>
                                {risk.section && (
                                  <Badge variant="secondary" className="text-xs">
                                    {risk.section}
                                  </Badge>
                                )}
                              </div>
                              <Badge className={getRiskLevelColor(risk.severity)}>
                                {getRiskLevelLabel(risk.severity)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm text-gray-900 font-medium">
                                {risk.description}
                              </p>
                              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                                <strong>Javaslat:</strong> {risk.recommendation}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="space-y-3">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-900">{rec}</p>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">85%</div>
                          <div className="text-sm text-gray-600">Megfelelőség</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">250k</div>
                          <div className="text-sm text-gray-600">Becsült megtakarítás (Ft)</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">2h</div>
                          <div className="text-sm text-gray-600">Becsült javítási idő</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">Részletes Összefoglaló</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {analysis.summary} Az azonosított kockázatok kezelése javíthatja a szerződés biztonságát és csökkentheti a jogi kockázatokat. A javasolt módosítások implementálása után a szerződés megfelelőségi szintje várhatóan 95% fölé emelkedik.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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
