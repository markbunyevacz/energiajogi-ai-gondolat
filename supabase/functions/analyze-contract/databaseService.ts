
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ClaudeAnalysisResult } from './types.ts';

export async function saveAnalysisToDatabase(
  documentId: string,
  analysisResult: ClaudeAnalysisResult,
  userId: string,
  authHeader: string
) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  console.log('Saving analysis to database...');

  const { data: analysisData, error: analysisError } = await supabaseClient
    .from('contract_analyses')
    .insert({
      contract_id: documentId,
      risk_level: analysisResult.riskLevel,
      summary: analysisResult.summary,
      recommendations: analysisResult.recommendations || [],
      analyzed_by: userId,
    })
    .select()
    .single();

  if (analysisError) {
    console.error('Database error saving analysis:', analysisError);
    throw new Error(`Adatbázis hiba az elemzés mentésekor: ${analysisError.message}`);
  }

  console.log('Analysis saved with ID:', analysisData.id);

  if (analysisResult.risks && analysisResult.risks.length > 0) {
    console.log('Saving risks to database...');
    
    const risksData = analysisResult.risks.map((risk: any) => ({
      analysis_id: analysisData.id,
      type: risk.type,
      severity: risk.severity,
      description: risk.description,
      recommendation: risk.recommendation,
      section: risk.section || null,
    }));

    const { error: risksError } = await supabaseClient
      .from('risks')
      .insert(risksData);

    if (risksError) {
      console.error('Database error saving risks:', risksError);
      console.warn('Risks could not be saved, but analysis was successful');
    } else {
      console.log('Risks saved successfully');
    }
  }

  return {
    ...analysisData,
    risks: analysisResult.risks,
  };
}
