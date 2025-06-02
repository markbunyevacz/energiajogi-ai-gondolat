import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    // Check if environment variables are accessible
    const envVars = {
      hasOpenAIKey: !!Deno.env.get('OPENAI_API_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        environment: envVars,
        message: 'Environment variables check completed'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        },
        status: 500,
      }
    )
  }
}) 