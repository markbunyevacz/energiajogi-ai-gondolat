import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { question, userId, searchResults, confidence, agentType, conversationContext } = await req.json()

    if (!question || !userId) {
      throw new Error('Question and userId are required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Prepare the prompt with context
    const prompt = `As a legal expert, answer the following question based on the provided context and search results:

Question: ${question}

Context:
${conversationContext ? `Previous conversation context: ${JSON.stringify(conversationContext)}` : ''}
${searchResults ? `Relevant search results: ${JSON.stringify(searchResults)}` : ''}

Please provide a comprehensive answer that:
1. Directly addresses the question
2. Cites relevant sources when available
3. Maintains a professional and clear tone
4. Includes practical implications or recommendations when applicable`

    // Get response from OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a legal expert assistant specializing in Hungarian law. Provide accurate, well-reasoned answers based on the available information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const answer = completion.data.choices[0]?.message?.content || ''

    // Save the Q&A session to the database
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('qa_sessions')
      .insert({
        question,
        answer,
        user_id: userId,
        confidence: confidence || 0.8,
        agent_type: agentType || 'general',
        sources: searchResults?.map((r: any) => r.document_id) || [],
        conversation_context: conversationContext
      })
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: sessionData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during question answering'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 