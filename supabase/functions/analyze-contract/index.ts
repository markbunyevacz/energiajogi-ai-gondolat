
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { RequestBody } from './types.ts';
import { validateRequest, validateClaudeApiKey } from './validation.ts';
import { analyzeWithClaude } from './claudeService.ts';
import { saveAnalysisToDatabase } from './databaseService.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting contract analysis...');
    
    const requestBody: RequestBody = await req.json();
    validateRequest(requestBody);

    console.log('Request validated, creating Supabase client...');

    const claudeApiKey = validateClaudeApiKey();
    const analysisResult = await analyzeWithClaude(requestBody.content, claudeApiKey);
    const savedAnalysis = await saveAnalysisToDatabase(
      requestBody.documentId,
      analysisResult,
      requestBody.userId,
      req.headers.get('Authorization')!
    );

    console.log('Contract analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
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
