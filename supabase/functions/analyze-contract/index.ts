
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  documentId: string;
  content: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, content, userId }: RequestBody = await req.json();

    if (!documentId || !content || !userId) {
      throw new Error('Document ID, content, and userId are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Analyze contract using Claude AI
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CLAUDE_API_KEY')}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a legal AI assistant specializing in Hungarian energy law contract analysis.

Please analyze the following contract and provide:
1. Overall risk level (low, medium, high)
2. Specific risks identified with severity levels
3. Recommendations for each risk
4. A summary of key findings

Contract content:
${content}

Please respond in the following JSON format:
{
  "riskLevel": "low|medium|high",
  "summary": "Brief summary of the contract analysis",
  "risks": [
    {
      "type": "legal|financial|operational",
      "severity": "low|medium|high",
      "description": "Description of the risk",
      "recommendation": "Recommendation to mitigate the risk",
      "section": "Relevant contract section (if applicable)"
    }
  ],
  "recommendations": ["General recommendation 1", "General recommendation 2"]
}

Respond only with valid JSON, no additional text.`
          }
        ],
      }),
    });

    const claudeData = await claudeResponse.json();
    const analysisResult = JSON.parse(claudeData.content[0].text);

    // Save contract analysis to database
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('contract_analyses')
      .insert({
        contract_id: documentId,
        risk_level: analysisResult.riskLevel,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
        analyzed_by: userId,
      })
      .select()
      .single();

    if (analysisError) {
      throw analysisError;
    }

    // Save individual risks
    if (analysisResult.risks && analysisResult.risks.length > 0) {
      const risksData = analysisResult.risks.map((risk: any) => ({
        analysis_id: analysisData.id,
        type: risk.type,
        severity: risk.severity,
        description: risk.description,
        recommendation: risk.recommendation,
        section: risk.section,
      }));

      const { error: risksError } = await supabaseClient
        .from('risks')
        .insert(risksData);

      if (risksError) {
        console.error('Error saving risks:', risksError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysisData,
          risks: analysisResult.risks,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-contract function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
