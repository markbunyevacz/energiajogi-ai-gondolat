-- Create legal_domains table
CREATE TABLE IF NOT EXISTS legal_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  document_types TEXT[] NOT NULL,
  processing_rules JSONB NOT NULL,
  compliance_requirements JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_domains_code ON legal_domains(code);
CREATE INDEX IF NOT EXISTS idx_legal_domains_active ON legal_domains(active);

-- Add RLS policies
ALTER TABLE legal_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON legal_domains
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admins" ON legal_domains
  FOR INSERT
  TO authenticated
  USING (auth.role() = 'admin');

CREATE POLICY "Enable update for admins" ON legal_domains
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'admin'); 