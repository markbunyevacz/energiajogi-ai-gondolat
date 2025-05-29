
import { supabase } from "@/integrations/supabase/client";

export const generateTestDocuments = async (userId: string) => {
  try {
    const documents = [
      {
        title: 'Munkaszerződés minta - 2024',
        type: 'szerződés' as const,
        content: 'Ez egy teszt munkaszerződés tartalom amely tartalmazza a munkavállaló jogait és kötelezettségeit, munkaidő beosztást, fizetési feltételeket és felmondási eljárást.',
        metadata: { category: 'employment', language: 'hu', year: 2024 },
        uploaded_by: userId
      },
      {
        title: 'GDPR Adatvédelmi tájékoztató',
        type: 'szabályzat' as const, 
        content: 'GDPR megfelelő adatvédelmi tájékoztató amely részletezi a személyes adatok kezelésének célját, jogalapját, tárolási időtartamát és az érintettek jogait.',
        metadata: { category: 'privacy', language: 'hu', compliance: 'GDPR' },
        uploaded_by: userId
      },
      {
        title: 'Bérleti szerződés - Irodahelyiség',
        type: 'szerződés' as const,
        content: 'Kereskedelmi ingatlan bérleti szerződés amely tartalmazza a bérleti díj mértékét, fizetési feltételeket, fenntartási kötelezettségeket és szerződés módosításának feltételeit.',
        metadata: { category: 'real_estate', language: 'hu', property_type: 'commercial' },
        uploaded_by: userId
      }
    ];

    console.log('Inserting documents with user_id:', userId);
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

export const generateQASessions = async (userId: string) => {
  try {
    const sessions = [
      {
        question: 'Mi a különbség a munkavállaló és a vállalkozó között a magyar jogban?',
        answer: 'A munkavállaló személyesen, munkáltató irányítása alatt, rendszeres munkavégzésre irányuló jogviszonyban dolgozik. A vállalkozó önállóan, saját kockázatára végez meghatározott eredmény elérésére irányuló tevékenységet.',
        agent_type: 'legal_research',
        confidence: 85,
        sources: ['2012. évi I. törvény (Mt.)', 'Ptk. 6:130-6:203. §'],
        user_id: userId
      },
      {
        question: 'Hogyan kell GDPR-osan kezelni a munkavállalók személyes adatait?',
        answer: 'A munkavállalók személyes adatainak kezelése során be kell tartani a GDPR előírásait: jogalap meghatározása, adatminimalizálás elve, átláthatóság, célhoz kötöttség és korlátozott tárolási idő.',
        agent_type: 'compliance',
        confidence: 92,
        sources: ['GDPR 6. cikk', '2011. évi CXII. törvény (Infotv.)'],
        user_id: userId
      },
      {
        question: 'Milyen szerződéses kockázatok lehetnek egy szoftverfejlesztési projektben?',
        answer: 'Szoftverfejlesztési projektek során gyakori kockázatok: nem megfelelő követelményspecifikáció, kártérítési korlátok hiánya, szellemi tulajdonjogok tisztázatlansága, teljesítési határidők be nem tartása.',
        agent_type: 'contract',
        confidence: 88,
        sources: ['IT szerződések bevált gyakorlata', 'Ptk. szerződési rész'],
        user_id: userId
      }
    ];

    console.log('Inserting QA sessions with user_id:', userId);
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

export const generateContractAnalyses = async (userId: string) => {
  try {
    const analyses = [
      {
        summary: 'Munkaszerződés elemzés - alacsony kockázat, kisebb pontosítások szükségesek',
        risk_level: 'low' as const,
        recommendations: ['Próbaidő pontosítása szükséges', 'Felmondási feltételek részletezése', 'Túlmunka díjazás szabályozása'],
        analyzed_by: userId
      },
      {
        summary: 'Szállítási szerződés elemzés - közepes kockázat, több területen szükséges módosítás',
        risk_level: 'medium' as const, 
        recommendations: ['Kártérítési felső határ meghatározása', 'Vis maior kikötés beépítése', 'Teljesítési határidők pontosítása'],
        analyzed_by: userId
      },
      {
        summary: 'IT szolgáltatási szerződés - magas kockázat, jelentős jogi felülvizsgálat szükséges',
        risk_level: 'high' as const,
        recommendations: ['SLA paraméterek definiálása', 'Adatvédelmi kötelezettségek tisztázása', 'Licencfeltételek pontosítása', 'Felelősségbiztosítás rendezése'],
        analyzed_by: userId
      }
    ];

    console.log('Inserting contract analyses with analyzed_by:', userId);
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

export const generatePerformanceMetrics = async () => {
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

export const generateAnalyticsEvents = async (userId: string) => {
  try {
    const events = [
      {
        event_type: 'document_upload',
        event_data: { file_type: 'pdf', size: 1024000, processing_time: 2.5 },
        user_id: userId
      },
      {
        event_type: 'qa_query',
        event_data: { agent_type: 'legal_research', response_time: 1200, confidence: 0.89 },
        user_id: userId
      },
      {
        event_type: 'contract_analysis',
        event_data: { risk_level: 'medium', processing_time: 3500, recommendations_count: 3 },
        user_id: userId
      }
    ];

    console.log('Inserting analytics events with user_id:', userId);
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
