# Contract Analysis Edge Function

This Edge Function provides contract analysis capabilities using OpenAI's GPT-4 model. It analyzes contract documents and provides detailed risk assessments, recommendations, and specific risk identification.

## Features

- Contract risk assessment (low/medium/high)
- Detailed summary of findings
- Specific risk identification with severity levels
- Actionable recommendations
- Structured output for database storage

## Setup

1. Deploy the Edge Function to your Supabase project:
   ```bash
   supabase functions deploy analyze-contract
   ```

2. Set up the required environment variables in your Supabase dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Usage

The function accepts POST requests with the following JSON body:

```json
{
  "documentId": "string",
  "content": "string",
  "userId": "string"
}
```

### Response Format

Successful response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "contract_id": "string",
    "analyzed_by": "string",
    "risk_level": "low|medium|high",
    "summary": "string",
    "recommendations": ["string"],
    "created_at": "string"
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "string"
}
```

## Database Schema

The function uses two tables:

1. `contract_analyses`:
   - `id`: UUID (primary key)
   - `contract_id`: UUID (foreign key to documents)
   - `analyzed_by`: UUID (foreign key to profiles)
   - `risk_level`: enum ('low', 'medium', 'high')
   - `summary`: text
   - `recommendations`: text[]
   - `created_at`: timestamp

2. `risks`:
   - `id`: UUID (primary key)
   - `analysis_id`: UUID (foreign key to contract_analyses)
   - `type`: text
   - `severity`: enum ('low', 'medium', 'high')
   - `description`: text
   - `recommendation`: text
   - `section`: text
   - `created_at`: timestamp

## Error Handling

The function includes comprehensive error handling for:
- Missing required parameters
- OpenAI API errors
- Database operation errors
- Invalid input data

## Security

- JWT verification is enabled by default
- CORS headers are properly configured
- Environment variables are used for sensitive data
- Input validation is performed 