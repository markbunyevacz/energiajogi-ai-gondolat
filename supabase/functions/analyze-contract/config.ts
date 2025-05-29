
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

export const CLAUDE_ANALYSIS_PROMPT = `You are a legal AI assistant specializing in Hungarian energy law contract analysis.

Please analyze the following contract and provide:
1. Overall risk level (low, medium, high)
2. Specific risks identified with severity levels
3. Recommendations for each risk
4. A summary of key findings

Please respond in the following JSON format:
{
  "riskLevel": "low|medium|high",
  "summary": "Brief summary of the contract analysis",
  "risks": [
    {
      "type": "legal|financial|operational",
      "severity": "low|medium|high",
      "description": "Description of the risk",
      "recommendation": "Recommendation to mitigate the risk",
      "section": "Relevant contract section (if applicable)"
    }
  ],
  "recommendations": ["General recommendation 1", "General recommendation 2"]
}

Respond only with valid JSON, no additional text.`;
