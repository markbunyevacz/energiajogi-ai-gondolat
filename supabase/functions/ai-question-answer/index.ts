
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
  searchResults?: any[];
  confidence?: number;
  agentType?: string;
  conversationContext?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const { question, userId, searchResults = [], confidence = 60, agentType = 'general', conversationContext = {} }: RequestBody = await req.json();

    if (!question || !userId) {
      throw new Error('Question and userId are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for RLS bypass
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Processing question with agent:', agentType);

    // Track analytics event
    await supabaseClient.from('analytics_events').insert({
      user_id: userId,
      event_type: 'question_asked',
      event_data: { 
        question_length: question.length,
        agent_type: agentType,
        confidence: confidence
      }
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
      throw new Error(`OpenAI embedding failed: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embeddingTime = performance.now() - embeddingStartTime;

    if (!embeddingData.data || !embeddingData.data[0] || !embeddingData.data[0].embedding) {
      console.error('Invalid embedding response structure:', embeddingData);
      throw new Error('Invalid response from OpenAI embedding API');
    }

    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for relevant document chunks if not provided
    let finalSearchResults = searchResults;
    if (!searchResults || searchResults.length === 0) {
      const searchStartTime = performance.now();
      const { data: searchData, error: searchError } = await supabaseClient.rpc(
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

      finalSearchResults = searchData || [];
      console.log('Search results:', finalSearchResults.length);
    }

    // Prepare context from relevant documents
    const context = finalSearchResults?.map((result: any) => 
      `${result.document_title}: ${result.chunk_text}`
    ).join('\n\n') || '';

    // Create agent-specific prompt based on agent type
    const getAgentPrompt = (type: string, baseQuestion: string, contextData: string) => {
      const agentPrompts = {
        contract: `You are a specialized contract analysis AI assistant for Hungarian energy law. 
        Focus on contract terms, obligations, risk assessment, and compliance requirements.
        
        Context: ${contextData}
        Question: ${baseQuestion}
        
        Provide detailed contract analysis with specific focus on:
        - Contract terms and conditions
        - Legal obligations and rights
        - Risk assessment
        - Compliance requirements
        
        Always cite specific legal sources with clickable links.`,
        
        legal_research: `You are a specialized legal research AI assistant for Hungarian energy law.
        Focus on legal precedents, regulations, and statutory interpretation.
        
        Context: ${contextData}
        Question: ${baseQuestion}
        
        Provide comprehensive legal research with focus on:
        - Relevant legal precedents
        - Regulatory framework analysis
        - Statutory interpretation
        - Current legal developments
        
        Always cite specific legal sources with clickable links.`,
        
        compliance: `You are a specialized compliance AI assistant for Hungarian energy law.
        Focus on regulatory compliance, reporting requirements, and compliance strategies.
        
        Context: ${contextData}
        Question: ${baseQuestion}
        
        Provide detailed compliance guidance with focus on:
        - Regulatory compliance requirements
        - Reporting obligations
        - Compliance strategies
        - Risk mitigation
        
        Always cite specific legal sources with clickable links.`,
        
        general: `You are a general legal AI assistant specializing in Hungarian energy law.
        
        Context: ${contextData}
        Question: ${baseQuestion}
        
        Provide comprehensive legal guidance covering all aspects of energy law.
        Always cite specific legal sources with clickable links.`
      };

      return agentPrompts[type] || agentPrompts.general;
    };

    // Generate answer using Claude AI with agent-specific prompt
    const claudeStartTime = performance.now();
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const agentPrompt = getAgentPrompt(agentType, question, context);

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
            content: agentPrompt
          }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API failed: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const claudeTime = performance.now() - claudeStartTime;

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('Invalid Claude response structure:', claudeData);
      throw new Error('Invalid response from Claude API');
    }

    const answer = claudeData.content[0].text;

    // Extract sources from search results and add official legal sources
    const documentSources = finalSearchResults?.map((result: any) => result.document_title) || [];
    const legalSources = [
      'Magyar Közlöny - https://magyarkozlony.hu/',
      'Nemzeti Jogszabálytár - https://net.jogtar.hu/',
      'MEKH - https://mekh.hu/',
      'EUR-Lex - https://eur-lex.europa.eu/'
    ];
    
    const allSources = [...documentSources, ...legalSources];
    const finalConfidence = finalSearchResults?.length > 0 ? Math.min(95, 75 + finalSearchResults.length * 5) : confidence;

    // Save Q&A session to database with agent information
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('qa_sessions')
      .insert({
        question,
        answer,
        sources: Array.from(new Set(allSources)),
        confidence: finalConfidence,
        user_id: userId,
        agent_type: agentType,
        conversation_context: conversationContext
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session save error:', sessionError);
      throw sessionError;
    }

    const totalTime = performance.now() - startTime;
    
    // Track performance metrics
    await supabaseClient.from('performance_metrics').insert([
      {
        metric_type: 'api_response_time',
        metric_value: totalTime,
        metadata: { 
          endpoint: 'ai-question-answer',
          agent_type: agentType,
          embedding_time: embeddingTime,
          claude_time: claudeTime
        }
      },
      {
        metric_type: 'embedding_time',
        metric_value: embeddingTime,
        metadata: { model: 'text-embedding-ada-002' }
      },
      {
        metric_type: 'claude_response_time',
        metric_value: claudeTime,
        metadata: { model: 'claude-3-haiku-20240307', agent_type: agentType }
      }
    ]);

    console.log('Successfully saved Q&A session with agent:', agentType);

    return new Response(
      JSON.stringify({
        success: true,
        session: sessionData,
        agentType: agentType,
        confidence: finalConfidence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const totalTime = performance.now() - startTime;
    
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
