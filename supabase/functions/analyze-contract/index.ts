
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
    console.log('Starting contract analysis...');
    
    const { documentId, content, userId }: RequestBody = await req.json();

    if (!documentId || !content || !userId) {
      console.error('Missing required fields:', { documentId: !!documentId, content: !!content, userId: !!userId });
      throw new Error('Document ID, content, and userId are required');
    }

    console.log('Request validated, creating Supabase client...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Sending request to Claude API...');

    // Analyze contract using Claude AI with updated model
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CLAUDE_API_KEY')}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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

    console.log('Claude API response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude API response received');
    
    // Safely access the content array
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Invalid response from Claude API - no content array');
    }

    let analysisResult;
    try {
      const jsonContent = claudeData.content[0].text;
      console.log('Parsing Claude response JSON...');
      analysisResult = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content:', claudeData.content[0].text);
      throw new Error('Failed to parse Claude API response as JSON');
    }

    console.log('Analysis result parsed successfully');

    // Validate the parsed result
    if (!analysisResult.riskLevel || !analysisResult.summary) {
      console.error('Invalid analysis result structure:', analysisResult);
      throw new Error('Analysis result missing required fields');
    }

    console.log('Saving analysis to database...');

    // Save contract analysis to database
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
      throw new Error(`Database error: ${analysisError.message}`);
    }

    console.log('Analysis saved with ID:', analysisData.id);

    // Save individual risks
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
        // Don't throw here, analysis is saved, risks are optional
      } else {
        console.log('Risks saved successfully');
      }
    }

    console.log('Contract analysis completed successfully');

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
    
    // Determine error type for better user feedback
    let errorMessage = 'Ismeretlen hiba történt az elemzés során';
    
    if (error.message.includes('Claude API error: 401')) {
      errorMessage = 'Hiba a Claude API kulccsal - ellenőrizze a beállításokat';
    } else if (error.message.includes('Claude API error')) {
      errorMessage = 'Hiba a Claude API kommunikációban';
    } else if (error.message.includes('Database error')) {
      errorMessage = 'Adatbázis hiba történt';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Hiba az AI válasz feldolgozásában';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
