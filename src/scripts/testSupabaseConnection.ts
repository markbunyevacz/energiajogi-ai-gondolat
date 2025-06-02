import { supabase } from '../integrations/supabase/client.js';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('legal_documents').select('count');
    
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Connection successful! Response:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection(); 