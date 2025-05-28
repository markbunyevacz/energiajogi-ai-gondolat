
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  question: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId }: RequestBody = await req.json();

    if (!question || !userId) {
      throw new Error('Question and userId are required');
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

    // Generate embedding for the question
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: question,
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for relevant document chunks
    const { data: searchResults, error: searchError } = await supabaseClient.rpc(
      'search_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
    }

    // Prepare context from relevant documents
    const context = searchResults?.map((result: any) => 
      `${result.document_title}: ${result.chunk_text}`
    ).join('\n\n') || '';

    // Generate answer using Claude AI
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CLAUDE_API_KEY')}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a legal AI assistant specializing in Hungarian energy law. 
            
Context from uploaded documents:
${context}

Question: ${question}

Please provide a comprehensive answer based on the context provided. If the context doesn't contain relevant information, provide general guidance about Hungarian energy law. Always cite specific sources when available.

Answer in Hungarian.`
          }
        ],
      }),
    });

    const claudeData = await claudeResponse.json();
    const answer = claudeData.content[0].text;

    // Extract sources from search results
    const sources = searchResults?.map((result: any) => result.document_title) || [];
    const confidence = searchResults?.length > 0 ? Math.min(95, 75 + searchResults.length * 5) : 60;

    // Save Q&A session to database
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('qa_sessions')
      .insert({
        question,
        answer,
        sources: Array.from(new Set(sources)),
        confidence,
        user_id: userId,
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: sessionData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-question-answer function:', error);
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
