import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'
import { DocumentProcessor } from '../core-legal-platform/processing/DocumentProcessor.ts';
import { LegalTranslationManager } from '../core-legal-platform/i18n/LegalTranslationManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContractAnalysisResult {
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  risks: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
    section: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { documentId, content, userId } = await req.json()

    if (!documentId || !content || !userId) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize OpenAI
    const configuration = new Configuration({ apiKey: Deno.env.get('OPENAI_API_KEY') })
    const openai = new OpenAIApi(configuration)

    // Initialize the new core platform components
    const translationManager = new LegalTranslationManager(configuration);
    const documentProcessor = new DocumentProcessor(translationManager);

    // Process the document to detect its language
    const { detectedLanguage } = await documentProcessor.process(content);

    // Create initial analysis record
    const { data: initialAnalysis, error: initialError } = await supabaseClient
      .from('contract_analyses')
      .insert({
        contract_id: documentId,
        analyzed_by: userId,
        status: 'processing',
        risk_level: 'unknown',
        language: detectedLanguage, // Save the detected language
      })
      .select()
      .single()

    if (initialError) {
      throw initialError
    }

    // Return initial response to the client
    const initialResponse = new Response(
      JSON.stringify({
        success: true,
        data: initialAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202, // Accepted
      }
    )

    // Perform analysis asynchronously
    performAnalysis(supabaseClient, openai, initialAnalysis.id, content, userId, documentId, req.body.analysisType, req.body.notes, detectedLanguage)

    return initialResponse;

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during contract analysis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function performAnalysis(
  supabaseClient: any,
  openai: OpenAIApi,
  analysisId: string,
  content: string,
  userId: string,
  documentId: string,
  analysisType: string,
  notes: string,
  language: string
) {
  try {
    // Security Check: Verify user role server-side
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData || roleData.role !== 'legal_manager') {
      throw new Error('Permission denied: User does not have the required role for analysis.');
    }

    await supabaseClient
      .from('contract_analyses')
      .update({ status: 'analyzing' })
      .eq('id', analysisId);

    const userPrompt = `Analyze the following document (language: ${language}) based on the user's request.\n\nAnalysis Type: ${analysisType}\n\n${notes ? `User Notes: ${notes}\n\n` : ''}Document Text:\n${content}`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview", // A model that supports JSON mode
      messages: [
        { 
          role: "system", 
          content: `You are a legal analysis expert. Your task is to analyze the provided document and return a structured JSON object. The JSON object must conform to this schema: { "risk_level": "low" | "medium" | "high", "summary": string, "recommendations": string[], "risks": { "type": string, "severity": "low" | "medium" | "high", "description": string, "recommendation": string, "section": string }[] }. Based on the Analysis Type requested by the user (${analysisType}), tailor your response. For 'summary' or 'legal', the 'risks' array can be empty, but the summary should be very detailed.`
        },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const analysisJson = JSON.parse(completion.data.choices[0]?.message?.content || '{}');

    await supabaseClient
      .from('contract_analyses')
      .update({
        risk_level: analysisJson.risk_level || 'unknown',
        summary: analysisJson.summary || 'No summary provided.',
        recommendations: analysisJson.recommendations || [],
        status: 'completed'
      })
      .eq('id', analysisId);

    if (analysisJson.risks && analysisJson.risks.length > 0) {
      await supabaseClient
        .from('risks')
        .insert(
          analysisJson.risks.map((risk: any) => ({
            analysis_id: analysisId,
            ...risk
          }))
        );
    }

  } catch (error) {
    console.error('Error in performAnalysis:', error);
    await supabaseClient
      .from('contract_analyses')
      .update({ status: 'failed', summary: error.message }) // Also log error message to DB
      .eq('id', analysisId);
  }
} 