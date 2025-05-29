
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

    // Check if Claude API key is available
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      console.error('Claude API key not found in environment variables');
      throw new Error('A Claude API kulcs nincs beállítva. Kérjük, állítsa be a CLAUDE_API_KEY titkos kulcsot a Supabase projektben.');
    }

    console.log('Sending request to Claude API with claude-3-5-sonnet model...');

    // Analyze contract using Claude AI with correct model
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${claudeApiKey}`,
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
      
      // Parse error response to provide specific messages
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }

      if (claudeResponse.status === 401) {
        throw new Error('A Claude API kulcs érvénytelen vagy lejárt. Kérjük, ellenőrizze és frissítse a CLAUDE_API_KEY titkos kulcsot a Supabase projektben.');
      } else if (claudeResponse.status === 429) {
        throw new Error('A Claude API rate limit túllépve. Kérjük, próbálja újra néhány perc múlva.');
      } else if (claudeResponse.status === 400) {
        const errorMsg = errorData?.error?.message || 'Hibás kérés';
        throw new Error(`Claude API kérés hiba: ${errorMsg}`);
      } else {
        throw new Error(`Claude API hiba (${claudeResponse.status}): ${errorData?.error?.message || errorText}`);
      }
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude API response received successfully');
    
    // Safely access the content array
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Érvénytelen válasz a Claude API-tól - hiányzó tartalom');
    }

    let analysisResult;
    try {
      const jsonContent = claudeData.content[0].text;
      console.log('Raw Claude response:', jsonContent.substring(0, 200) + '...');
      
      // Clean the JSON content - remove any markdown formatting
      const cleanedContent = jsonContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Parsing cleaned Claude response...');
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw content that failed to parse:', claudeData.content[0].text);
      throw new Error('Claude válasz feldolgozási hiba - érvénytelen JSON formátum');
    }

    console.log('Analysis result parsed successfully:', analysisResult);

    // Validate the parsed result
    if (!analysisResult.riskLevel || !analysisResult.summary) {
      console.error('Invalid analysis result structure:', analysisResult);
      throw new Error('Elemzési eredmény hiányos - hiányzó kötelező mezők');
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
      throw new Error(`Adatbázis hiba az elemzés mentésekor: ${analysisError.message}`);
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
        console.warn('Risks could not be saved, but analysis was successful');
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
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
