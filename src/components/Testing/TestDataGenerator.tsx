
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState<any>({});

  const generateTestData = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      toast.info('Teszt adatok generálása elkezdődött...');

      // 1. Generate test documents (20%)
      setProgress(20);
      const testDocuments = await generateTestDocuments();
      
      // 2. Generate QA sessions (40%)
      setProgress(40);
      const qaSessions = await generateQASessions();
      
      // 3. Generate contract analyses (60%)
      setProgress(60);
      const contractAnalyses = await generateContractAnalyses();
      
      // 4. Generate performance metrics (80%)
      setProgress(80);
      const performanceData = await generatePerformanceMetrics();
      
      // 5. Generate analytics events (100%)
      setProgress(100);
      const analyticsData = await generateAnalyticsEvents();

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
      toast.error('Hiba a teszt adatok generálása során');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTestDocuments = async () => {
    const documents = [
      {
        title: 'Munkaszerződés minta',
        type: 'legal_document',
        content: 'Ez egy teszt munkaszerződés tartalom...',
        metadata: { category: 'employment', language: 'hu' }
      },
      {
        title: 'Adatvédelmi tájékoztató',
        type: 'legal_document', 
        content: 'GDPR megfelelő adatvédelmi tájékoztató...',
        metadata: { category: 'privacy', language: 'hu' }
      },
      {
        title: 'Bérleti szerződés',
        type: 'contract',
        content: 'Ingatlan bérleti szerződés feltételei...',
        metadata: { category: 'real_estate', language: 'hu' }
      }
    ];

    const { data } = await supabase
      .from('documents')
      .insert(documents)
      .select();

    return data;
  };

  const generateQASessions = async () => {
    const sessions = [
      {
        question: 'Mi a különbség a munkavállaló és a vállalkozó között?',
        answer: 'A munkavállaló személyesen, munkáltató irányítása alatt dolgozik...',
        agent_type: 'legal_research',
        confidence: 85,
        sources: ['Munka Törvénykönyve', 'Ptk.']
      },
      {
        question: 'Hogyan kell GDPR-osan kezelni a személyes adatokat?',
        answer: 'A GDPR szerint a személyes adatok kezelése...',
        agent_type: 'compliance',
        confidence: 92,
        sources: ['GDPR', 'Infotv.']
      },
      {
        question: 'Milyen szerződéses kockázatok lehetnek egy IT projektben?',
        answer: 'IT projektek során gyakori kockázatok...',
        agent_type: 'contract',
        confidence: 88,
        sources: ['IT szerződések bevált gyakorlata']
      }
    ];

    const { data } = await supabase
      .from('qa_sessions')
      .insert(sessions)
      .select();

    return data;
  };

  const generateContractAnalyses = async () => {
    const analyses = [
      {
        summary: 'Munkszerződés elemzés - alacsony kockázat',
        risk_level: 'low',
        recommendations: ['Próbaidő pontosítása', 'Felmondási feltételek']
      },
      {
        summary: 'Szállítási szerződés - közepes kockázat',
        risk_level: 'medium', 
        recommendations: ['Kártérítési felső határ', 'Vis maior kikötés']
      }
    ];

    const { data } = await supabase
      .from('contract_analyses')
      .insert(analyses)
      .select();

    return data;
  };

  const generatePerformanceMetrics = async () => {
    const metrics = [
      { metric_type: 'api_response_time', metric_value: 1250 },
      { metric_type: 'document_processing_time', metric_value: 3500 },
      { metric_type: 'ai_confidence_score', metric_value: 0.87 },
      { metric_type: 'user_satisfaction', metric_value: 4.2 }
    ];

    const { data } = await supabase
      .from('performance_metrics')
      .insert(metrics)
      .select();

    return data;
  };

  const generateAnalyticsEvents = async () => {
    const events = [
      {
        event_type: 'document_upload',
        event_data: { file_type: 'pdf', size: 1024000 }
      },
      {
        event_type: 'qa_query',
        event_data: { agent_type: 'legal_research', response_time: 1200 }
      },
      {
        event_type: 'contract_analysis',
        event_data: { risk_level: 'medium', processing_time: 3500 }
      }
    ];

    const { data } = await supabase
      .from('analytics_events')
      .insert(events)
      .select();

    return data;
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
          <p>• Dokumentumok: jogi dokumentumok és szerződések</p>
          <p>• QA Session-ök: minden ágens típusra kérdés-válasz párok</p>
          <p>• Szerződéselemzések: kockázat azonosítás és javaslatok</p>
          <p>• Performance metrikák: válaszidők és pontosság</p>
          <p>• Analytics események: felhasználói tevékenységek</p>
        </div>
      </CardContent>
    </Card>
  );
}
