import { beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Clean up test data before running tests
beforeAll(async () => {
  await supabase.from('queue_messages').delete().neq('id', '');
  await supabase.from('legal_hierarchy').delete().neq('id', '');
  await supabase.from('legal_documents').delete().neq('id', '');
  await supabase.from('legal_domains').delete().neq('code', 'energy');

  // Create test energy domain if it doesn't exist
  const { data: energyDomain } = await supabase
    .from('legal_domains')
    .select('id')
    .eq('code', 'energy')
    .single();

  if (!energyDomain) {
    await supabase.from('legal_domains').insert({
      code: 'energy',
      name: 'Energy Law',
      description: 'Hungarian energy law and regulations',
    });
  }
});

// Clean up test data after running tests
afterAll(async () => {
  await supabase.from('queue_messages').delete().neq('id', '');
  await supabase.from('legal_hierarchy').delete().neq('id', '');
  await supabase.from('legal_documents').delete().neq('id', '');
  await supabase.from('legal_domains').delete().neq('code', 'energy');
}); 