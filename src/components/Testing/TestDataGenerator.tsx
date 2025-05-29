
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';

export function TestDataGenerator() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState<any>({});

  const generateTestData = async () => {
    if (!user) {
      toast.error('Nincs bejelentkezett felhasználó');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    try {
      console.log('Starting test data generation for user:', user.id);
      toast.info('Teszt adatok generálása elkezdődött...');

      // 1. Generate test documents (20%)
      setProgress(20);
      const testDocuments = await generateTestDocuments();
      console.log('Generated documents:', testDocuments);
      
      // 2. Generate QA sessions (40%)
      setProgress(40);
      const qaSessions = await generateQASessions();
      console.log('Generated QA sessions:', qaSessions);
      
      // 3. Generate contract analyses (60%)
      setProgress(60);
      const contractAnalyses = await generateContractAnalyses();
      console.log('Generated contract analyses:', contractAnalyses);
      
      // 4. Generate performance metrics (80%)
      setProgress(80);
      const performanceData = await generatePerformanceMetrics();
      console.log('Generated performance data:', performanceData);
      
      // 5. Generate analytics events (100%)
      setProgress(100);
      const analyticsData = await generateAnalyticsEvents();
      console.log('Generated analytics data:', analyticsData);

      setGeneratedData({
        documents: testDocuments,
        qaSessions: qaSessions,
        contracts: contractAnalyses,
        performance: performanceData,
        analytics: analyticsData
      });

      toast.success('Teszt adatok sikeresen generálva!');
      
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error(`Hiba a teszt adatok generálása során: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generateTestDocuments = async () => {
    try {
      const documents = [
        {
          title: 'Munkaszerződés minta - 2024',
          type: 'szerződés',
          content: 'Ez egy teszt munkaszerződés tartalom amely tartalmazza a munkavállaló jogait és kötelezettségeit, munkaidő beosztást, fizetési feltételeket és felmondási eljárást.',
          metadata: { category: 'employment', language: 'hu', year: 2024 },
          uploaded_by: user?.id
        },
        {
          title: 'GDPR Adatvédelmi tájékoztató',
          type: 'szabályzat', 
          content: 'GDPR megfelelő adatvédelmi tájékoztató amely részletezi a személyes adatok kezelésének célját, jogalapját, tárolási időtartamát és az érintettek jogait.',
          metadata: { category: 'privacy', language: 'hu', compliance: 'GDPR' },
          uploaded_by: user?.id
        },
        {
          title: 'Bérleti szerződés - Irodahelyiség',
          type: 'szerződés',
          content: 'Kereskedelmi ingatlan bérleti szerződés amely tartalmazza a bérleti díj mértékét, fizetési feltételeket, fenntartási kötelezettségeket és szerződés módosításának feltételeit.',
          metadata: { category: 'real_estate', language: 'hu', property_type: 'commercial' },
          uploaded_by: user?.id
        }
      ];

      console.log('Inserting documents with user_id:', user?.id);
      const { data, error } = await supabase
        .from('documents')
        .insert(documents)
        .select();

      if (error) {
        console.error('Document generation error:', error);
        throw new Error(`Dokumentum generálási hiba: ${error.message}`);
      }

      console.log('Successfully inserted documents:', data);
      return data || [];
    } catch (error) {
      console.error('Error in generateTestDocuments:', error);
      throw error;
    }
  };

  const generateQASessions = async () => {
    if (!user) return [];

    try {
      const sessions = [
        {
          question: 'Mi a különbség a munkavállaló és a vállalkozó között a magyar jogban?',
          answer: 'A munkavállaló személyesen, munkáltató irányítása alatt, rendszeres munkavégzésre irányuló jogviszonyban dolgozik. A vállalkozó önállóan, saját kockázatára végez meghatározott eredmény elérésére irányuló tevékenységet.',
          agent_type: 'legal_research',
          confidence: 85,
          sources: ['2012. évi I. törvény (Mt.)', 'Ptk. 6:130-6:203. §'],
          user_id: user.id
        },
        {
          question: 'Hogyan kell GDPR-osan kezelni a munkavállalók személyes adatait?',
          answer: 'A munkavállalók személyes adatainak kezelése során be kell tartani a GDPR előírásait: jogalap meghatározása, adatminimalizálás elve, átláthatóság, célhoz kötöttség és korlátozott tárolási idő.',
          agent_type: 'compliance',
          confidence: 92,
          sources: ['GDPR 6. cikk', '2011. évi CXII. törvény (Infotv.)'],
          user_id: user.id
        },
        {
          question: 'Milyen szerződéses kockázatok lehetnek egy szoftverfejlesztési projektben?',
          answer: 'Szoftverfejlesztési projektek során gyakori kockázatok: nem megfelelő követelményspecifikáció, kártérítési korlátok hiánya, szellemi tulajdonjogok tisztázatlansága, teljesítési határidők be nem tartása.',
          agent_type: 'contract',
          confidence: 88,
          sources: ['IT szerződések bevált gyakorlata', 'Ptk. szerződési rész'],
          user_id: user.id
        }
      ];

      console.log('Inserting QA sessions with user_id:', user.id);
      const { data, error } = await supabase
        .from('qa_sessions')
        .insert(sessions)
        .select();

      if (error) {
        console.error('QA session generation error:', error);
        throw new Error(`QA session generálási hiba: ${error.message}`);
      }

      console.log('Successfully inserted QA sessions:', data);
      return data || [];
    } catch (error) {
      console.error('Error in generateQASessions:', error);
      throw error;
    }
  };

  const generateContractAnalyses = async () => {
    try {
      const analyses = [
        {
          summary: 'Munkaszerződés elemzés - alacsony kockázat, kisebb pontosítások szükségesek',
          risk_level: 'low',
          recommendations: ['Próbaidő pontosítása szükséges', 'Felmondási feltételek részletezése', 'Túlmunka díjazás szabályozása'],
          analyzed_by: user?.id
        },
        {
          summary: 'Szállítási szerződés elemzés - közepes kockázat, több területen szükséges módosítás',
          risk_level: 'medium', 
          recommendations: ['Kártérítési felső határ meghatározása', 'Vis maior kikötés beépítése', 'Teljesítési határidők pontosítása'],
          analyzed_by: user?.id
        },
        {
          summary: 'IT szolgáltatási szerződés - magas kockázat, jelentős jogi felülvizsgálat szükséges',
          risk_level: 'high',
          recommendations: ['SLA paraméterek definiálása', 'Adatvédelmi kötelezettségek tisztázása', 'Licencfeltételek pontosítása', 'Felelősségbiztosítás rendezése'],
          analyzed_by: user?.id
        }
      ];

      console.log('Inserting contract analyses with analyzed_by:', user?.id);
      const { data, error } = await supabase
        .from('contract_analyses')
        .insert(analyses)
        .select();

      if (error) {
        console.error('Contract analysis generation error:', error);
        throw new Error(`Szerződéselemzés generálási hiba: ${error.message}`);
      }

      console.log('Successfully inserted contract analyses:', data);
      return data || [];
    } catch (error) {
      console.error('Error in generateContractAnalyses:', error);
      throw error;
    }
  };

  const generatePerformanceMetrics = async () => {
    try {
      const metrics = [
        { 
          metric_type: 'api_response_time', 
          metric_value: 1250
        },
        { 
          metric_type: 'document_processing_time', 
          metric_value: 3500
        },
        { 
          metric_type: 'ai_confidence_score', 
          metric_value: 0.87
        },
        { 
          metric_type: 'user_satisfaction', 
          metric_value: 4.2
        }
      ];

      console.log('Inserting performance metrics');
      const { data, error } = await supabase
        .from('performance_metrics')
        .insert(metrics)
        .select();

      if (error) {
        console.error('Performance metrics generation error:', error);
        throw new Error(`Teljesítmény metrika generálási hiba: ${error.message}`);
      }

      console.log('Successfully inserted performance metrics:', data);
      return data || [];
    } catch (error) {
      console.error('Error in generatePerformanceMetrics:', error);
      throw error;
    }
  };

  const generateAnalyticsEvents = async () => {
    try {
      const events = [
        {
          event_type: 'document_upload',
          event_data: { file_type: 'pdf', size: 1024000, processing_time: 2.5 },
          user_id: user?.id
        },
        {
          event_type: 'qa_query',
          event_data: { agent_type: 'legal_research', response_time: 1200, confidence: 0.89 },
          user_id: user?.id
        },
        {
          event_type: 'contract_analysis',
          event_data: { risk_level: 'medium', processing_time: 3500, recommendations_count: 3 },
          user_id: user?.id
        }
      ];

      console.log('Inserting analytics events with user_id:', user?.id);
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(events)
        .select();

      if (error) {
        console.error('Analytics events generation error:', error);
        throw new Error(`Analytics esemény generálási hiba: ${error.message}`);
      }

      console.log('Successfully inserted analytics events:', data);
      return data || [];
    } catch (error) {
      console.error('Error in generateAnalyticsEvents:', error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Teszt Adatok Generálása
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium">Dokumentumok</p>
            <Badge variant="outline">{generatedData.documents?.length || 0}</Badge>
          </div>
          
          <div className="text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">QA Session-ök</p>
            <Badge variant="outline">{generatedData.qaSessions?.length || 0}</Badge>
          </div>
          
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-medium">Szerződések</p>
            <Badge variant="outline">{generatedData.contracts?.length || 0}</Badge>
          </div>
          
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-sm font-medium">Metrikák</p>
            <Badge variant="outline">{generatedData.performance?.length || 0}</Badge>
          </div>
          
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium">Analytics</p>
            <Badge variant="outline">{generatedData.analytics?.length || 0}</Badge>
          </div>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Teszt adatok generálása...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          onClick={generateTestData}
          disabled={isGenerating}
          className="w-full"
        >
          <Database className="w-4 h-4 mr-2" />
          Teszt Adatok Generálása
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Dokumentumok: jogi dokumentumok és szerződések (3 db)</p>
          <p>• QA Session-ök: minden ágens típusra kérdés-válasz párok (3 db)</p>
          <p>• Szerződéselemzések: kockázat azonosítás és javaslatok (3 db)</p>
          <p>• Performance metrikák: válaszidők és pontosság (4 db)</p>
          <p>• Analytics események: felhasználói tevékenységek (3 db)</p>
        </div>
      </CardContent>
    </Card>
  );
}
