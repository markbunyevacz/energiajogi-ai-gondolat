
import { RequestBody } from './types.ts';

export function validateRequest(body: RequestBody): void {
  if (!body.documentId || !body.content || !body.userId) {
    console.error('Missing required fields:', { 
      documentId: !!body.documentId, 
      content: !!body.content, 
      userId: !!body.userId 
    });
    throw new Error('Document ID, content, and userId are required');
  }
}

export function validateClaudeApiKey(): string {
  const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
  console.log('Claude API key check:', claudeApiKey ? `Key found (length: ${claudeApiKey.length})` : 'Key not found');
  
  if (!claudeApiKey) {
    console.error('Claude API key not found in environment variables');
    throw new Error('A Claude API kulcs nincs beállítva. Kérjük, állítsa be a CLAUDE_API_KEY titkos kulcsot a Supabase projektben.');
  }

  if (!claudeApiKey.startsWith('sk-ant-')) {
    console.error('Invalid Claude API key format. Expected format: sk-ant-...');
    throw new Error('Érvénytelen Claude API kulcs formátum. A kulcs sk-ant- előtaggal kell kezdődnie.');
  }

  return claudeApiKey;
}
