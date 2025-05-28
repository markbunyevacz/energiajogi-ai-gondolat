
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

  const startTime = performance.now();

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

    console.log('Processing question:', question);

    // Track analytics event
    await supabaseClient.from('analytics_events').insert({
      user_id: userId,
      event_type: 'question_asked',
      event_data: { question_length: question.length }
    });

    // Generate embedding for the question
    const embeddingStartTime = performance.now();
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

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorText);
      
      // Track error
      await supabaseClient.from('performance_metrics').insert({
        metric_type: 'embedding_error',
        metric_value: performance.now() - embeddingStartTime,
        metadata: { error: errorText }
      });
      
      throw new Error(`OpenAI embedding failed: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embeddingTime = performance.now() - embeddingStartTime;
    
    // Track embedding performance
    await supabaseClient.from('performance_metrics').insert({
      metric_type: 'embedding_time',
      metric_value: embeddingTime,
      metadata: { model: 'text-embedding-ada-002' }
    });

    console.log('Embedding data structure:', JSON.stringify(embeddingData, null, 2));

    if (!embeddingData.data || !embeddingData.data[0] || !embeddingData.data[0].embedding) {
      console.error('Invalid embedding response structure:', embeddingData);
      throw new Error('Invalid response from OpenAI embedding API');
    }

    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for relevant document chunks
    const searchStartTime = performance.now();
    const { data: searchResults, error: searchError } = await supabaseClient.rpc(
      'search_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
      }
    );

    const searchTime = performance.now() - searchStartTime;
    
    // Track search performance
    await supabaseClient.from('performance_metrics').insert({
      metric_type: 'document_search_time',
      metric_value: searchTime,
      metadata: { results_count: searchResults?.length || 0 }
    });

    if (searchError) {
      console.error('Search error:', searchError);
    }

    console.log('Search results:', searchResults);

    // Prepare context from relevant documents
    const context = searchResults?.map((result: any) => 
      `${result.document_title}: ${result.chunk_text}`
    ).join('\n\n') || '';

    console.log('Context for Claude:', context.substring(0, 200) + '...');

    // Generate answer using Claude AI
    const claudeStartTime = performance.now();
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
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

Please provide a comprehensive answer based on the context provided. If the context doesn't contain relevant information, provide general guidance about Hungarian energy law. 

IMPORTANT: When citing laws or regulations, ALWAYS include clickable links to official sources:
- For Hungarian laws and regulations: https://net.jogtar.hu/ (search for the specific law number)
- For EU directives and regulations: https://eur-lex.europa.eu/ (search for the specific directive/regulation)
- For MEKH decisions and regulations: https://mekh.hu/
- For official publications: https://magyarkozlony.hu/

Format your citations like this:
- "2007. évi LXXXVI. törvény a villamos energiáról (VET) [https://net.jogtar.hu/jogszabaly?docid=A0700086.TV]"
- "EU Directive 2019/944 [https://eur-lex.europa.eu/legal-content/HU/TXT/?uri=CELEX:32019L0944]"

Always cite specific sources when available and provide direct links to the referenced legal documents.

Answer in Hungarian.`
          }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      
      // Track Claude error
      await supabaseClient.from('performance_metrics').insert({
        metric_type: 'claude_error',
        metric_value: performance.now() - claudeStartTime,
        metadata: { error: errorText }
      });
      
      throw new Error(`Claude API failed: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const claudeTime = performance.now() - claudeStartTime;
    
    // Track Claude performance
    await supabaseClient.from('performance_metrics').insert({
      metric_type: 'claude_response_time',
      metric_value: claudeTime,
      metadata: { model: 'claude-3-haiku-20240307' }
    });

    console.log('Claude response structure:', JSON.stringify(claudeData, null, 2));

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Invalid response from Claude API');
    }

    const answer = claudeData.content[0].text;

    // Extract sources from search results and add official legal sources
    const documentSources = searchResults?.map((result: any) => result.document_title) || [];
    const legalSources = [
      'Magyar Közlöny - https://magyarkozlony.hu/',
      'Nemzeti Jogszabálytár - https://net.jogtar.hu/',
      'MEKH - https://mekh.hu/',
      'EUR-Lex - https://eur-lex.europa.eu/'
    ];
    
    const allSources = [...documentSources, ...legalSources];
    const confidence = searchResults?.length > 0 ? Math.min(95, 75 + searchResults.length * 5) : 60;

    // Save Q&A session to database
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('qa_sessions')
      .insert({
        question,
        answer,
        sources: Array.from(new Set(allSources)),
        confidence,
        user_id: userId,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session save error:', sessionError);
      throw sessionError;
    }

    const totalTime = performance.now() - startTime;
    
    // Track overall API performance
    await supabaseClient.from('performance_metrics').insert({
      metric_type: 'api_response_time',
      metric_value: totalTime,
      metadata: { 
        endpoint: 'ai-question-answer',
        embedding_time: embeddingTime,
        search_time: searchTime,
        claude_time: claudeTime
      }
    });

    // Track cost (estimated)
    const estimatedCost = (embeddingData.usage?.total_tokens || 100) * 0.0001 + 
                         (claudeData.usage?.output_tokens || 200) * 0.002;
    
    await supabaseClient.from('cost_tracking').insert({
      service_type: 'ai_apis',
      cost_amount: estimatedCost,
      usage_units: (embeddingData.usage?.total_tokens || 0) + (claudeData.usage?.output_tokens || 0),
      cost_per_unit: 0.001,
      user_id: userId
    });

    console.log('Successfully saved Q&A session');

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
    const totalTime = performance.now() - startTime;
    
    // Track error performance
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    await supabaseClient.from('performance_metrics').insert({
      metric_type: 'api_error',
      metric_value: totalTime,
      metadata: { error: error.message }
    });

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
