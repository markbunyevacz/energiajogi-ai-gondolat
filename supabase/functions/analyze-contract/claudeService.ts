
import { CLAUDE_MODEL, CLAUDE_ANALYSIS_PROMPT } from './config.ts';
import { ClaudeAnalysisResult } from './types.ts';

export async function analyzeWithClaude(content: string, apiKey: string): Promise<ClaudeAnalysisResult> {
  console.log(`Sending request to Claude API with model: ${CLAUDE_MODEL}`);

  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${CLAUDE_ANALYSIS_PROMPT}

Contract content:
${content}`
        }
      ],
    }),
  });

  console.log('Claude API response status:', claudeResponse.status);

  if (!claudeResponse.ok) {
    const errorText = await claudeResponse.text();
    console.error('Claude API error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }

    if (claudeResponse.status === 401) {
      throw new Error('A Claude API kulcs érvénytelen vagy lejárt. Kérjük, ellenőrizze és frissítse a CLAUDE_API_KEY titkos kulcsot a Supabase projektben.');
    } else if (claudeResponse.status === 429) {
      throw new Error('A Claude API rate limit túllépve. Kérjük, próbálja újra néhány perc múlva.');
    } else if (claudeResponse.status === 400) {
      const errorMsg = errorData?.error?.message || 'Hibás kérés';
      throw new Error(`Claude API kérés hiba: ${errorMsg}`);
    } else {
      throw new Error(`Claude API hiba (${claudeResponse.status}): ${errorData?.error?.message || errorText}`);
    }
  }

  const claudeData = await claudeResponse.json();
  console.log('Claude API response received successfully');
  
  if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
    console.error('Invalid Claude response structure:', claudeData);
    throw new Error('Érvénytelen válasz a Claude API-tól - hiányzó tartalom');
  }

  let analysisResult: ClaudeAnalysisResult;
  try {
    const jsonContent = claudeData.content[0].text;
    console.log('Raw Claude response:', jsonContent.substring(0, 200) + '...');
    
    const cleanedContent = jsonContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('Parsing cleaned Claude response...');
    analysisResult = JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('JSON parsing error:', parseError);
    console.error('Raw content that failed to parse:', claudeData.content[0].text);
    throw new Error('Claude válasz feldolgozási hiba - érvénytelen JSON formátum');
  }

  console.log('Analysis result parsed successfully:', analysisResult);

  if (!analysisResult.riskLevel || !analysisResult.summary) {
    console.error('Invalid analysis result structure:', analysisResult);
    throw new Error('Elemzési eredmény hiányos - hiányzó kötelező mezők');
  }

  return analysisResult;
}
