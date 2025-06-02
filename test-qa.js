import { createClient } from '@supabase/supabase-js'

console.log('Starting test-qa.js...')

const supabaseUrl = 'https://abjuvmwpjapknuxqrefg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFianV2bXdwamFwa251eHFyZWZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ2ODEzNiwiZXhwIjoyMDY0MDQ0MTM2fQ.B9Zd6arLI-SLjqxCkdu6QOQDAUNFpG_uJCtLBLsUoXI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQA() {
  try {
    // Sign in with the provided test user credentials
    const testEmail = 'bunyevacz@hotmail.com'
    const testPassword = 'Test1=2test'
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    if (signInError) {
      console.error('Error signing in:', signInError)
      return
    }
    console.log('Signed in successfully:', signInData)

    // Make the function call with the access token
    const { data, error } = await supabase.functions.invoke('ai-question-answer', {
      body: {
        question: 'What are the key requirements for a valid contract under Hungarian law?',
        userId: signInData.user.id,
        agentType: 'legal',
        confidence: 0.9
      },
      headers: {
        Authorization: `Bearer ${signInData.session.access_token}`
      }
    })

    if (error) {
      console.error('Function error:', error)
      if (error.response) {
        console.error('Error response data:', error.response.data)
      }
      return
    }

    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Caught error:', error)
    if (error.response) {
      console.error('Caught error response data:', error.response.data)
    }
  }
}

testQA() 