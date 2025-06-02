import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Function starting up...')

serve(async (req) => {
  console.log('Request received:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    console.log('Checking environment variables...')
    
    // Check if environment variables are accessible
    const envVars = {
      OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? 'present' : 'missing',
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'present' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'present' : 'missing'
    }
    
    console.log('Environment variables status:', envVars)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Function executed successfully',
        envVars
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500
      }
    )
  }
}) 