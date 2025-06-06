import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

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

    // Create initial analysis record
    const { data: initialAnalysis, error: initialError } = await supabaseClient
      .from('contract_analyses')
      .insert({
        contract_id: documentId,
        analyzed_by: userId,
        status: 'processing',
        risk_level: 'unknown'
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
    performAnalysis(supabaseClient, initialAnalysis.id, content, userId, documentId)

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
  analysisId: string,
  content: string,
  userId: string,
  documentId: string
) {
  try {
    // Update status to 'analyzing'
    await supabaseClient
      .from('contract_analyses')
      .update({ status: 'analyzing' })
      .eq('id', analysisId)

    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Analyze contract using OpenAI
    const analysisPrompt = `Analyze the following contract and provide a detailed analysis. Focus on:
1. Overall risk assessment (low/medium/high)
2. Key findings and summary
3. Specific risks and their severity
4. Recommendations for improvement

Contract text:
${content}`

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a legal contract analysis expert. Analyze the provided contract and identify potential risks, issues, and areas for improvement. Provide specific recommendations and categorize risks by severity."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const analysisText = completion.data.choices[0]?.message?.content || ''

    // Parse the analysis results
    const analysisResult: ContractAnalysisResult = {
      risk_level: 'medium', // Default value, will be updated based on analysis
      summary: '',
      recommendations: [],
      risks: []
    }

    // Extract risk level
    const riskLevelMatch = analysisText.match(/risk level:?\s*(low|medium|high)/i)
    if (riskLevelMatch) {
      analysisResult.risk_level = riskLevelMatch[1].toLowerCase() as 'low' | 'medium' | 'high'
    }

    // Extract summary
    const summaryMatch = analysisText.match(/summary:?\s*([^\n]+)/i)
    if (summaryMatch) {
      analysisResult.summary = summaryMatch[1].trim()
    }

    // Extract recommendations
    const recommendationsMatch = analysisText.match(/recommendations:?\s*([\s\S]+?)(?=\n\n|$)/i)
    if (recommendationsMatch) {
      analysisResult.recommendations = recommendationsMatch[1]
        .split('\n')
        .map(rec => rec.replace(/^[-•*]\s*/, '').trim())
        .filter(rec => rec.length > 0)
    }

    // Extract risks
    const risksMatch = analysisText.match(/risks:?\s*([\s\S]+?)(?=\n\n|$)/i)
    if (risksMatch) {
      const risksText = risksMatch[1]
      const riskEntries = risksText.split('\n\n')
      
      analysisResult.risks = riskEntries.map(entry => {
        const typeMatch = entry.match(/type:?\s*([^\n]+)/i)
        const severityMatch = entry.match(/severity:?\s*(low|medium|high)/i)
        const descriptionMatch = entry.match(/description:?\s*([^\n]+)/i)
        const recommendationMatch = entry.match(/recommendation:?\s*([^\n]+)/i)
        const sectionMatch = entry.match(/section:?\s*([^\n]+)/i)

        return {
          type: typeMatch?.[1]?.trim() || 'Unknown',
          severity: (severityMatch?.[1]?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
          description: descriptionMatch?.[1]?.trim() || '',
          recommendation: recommendationMatch?.[1]?.trim() || '',
          section: sectionMatch?.[1]?.trim() || 'General'
        }
      }).filter(risk => risk.description.length > 0)
    }

    // Update analysis with results
    const { error: analysisError } = await supabaseClient
      .from('contract_analyses')
      .update({
        risk_level: analysisResult.risk_level,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
        status: 'completed'
      })
      .eq('id', analysisId)

    if (analysisError) {
      throw analysisError
    }

    // Save risks to database
    if (analysisResult.risks.length > 0) {
      const { error: risksError } = await supabaseClient
        .from('risks')
        .insert(
          analysisResult.risks.map(risk => ({
            analysis_id: analysisId,
            type: risk.type,
            severity: risk.severity,
            description: risk.description,
            recommendation: risk.recommendation,
            section: risk.section
          }))
        )

      if (risksError) {
        throw risksError
      }
    }
  } catch (error) {
    console.error('Error in performAnalysis:', error)
    await supabaseClient
      .from('contract_analyses')
      .update({ status: 'failed' })
      .eq('id', analysisId)
  }
} 