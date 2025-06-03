-- Create enum types for risk levels and risk types
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE risk_type AS ENUM (
  'legal',
  'financial',
  'operational',
  'compliance',
  'security',
  'privacy',
  'intellectual_property',
  'other'
);

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    document_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contract_analyses table
CREATE TABLE IF NOT EXISTS contract_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  risk_level risk_level NOT NULL,
  summary TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create risks table
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES contract_analyses(id) ON DELETE CASCADE,
  type risk_type NOT NULL,
  severity risk_level NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  section TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_analyses_contract_id ON contract_analyses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_analyses_analyzed_by ON contract_analyses(analyzed_by);
CREATE INDEX IF NOT EXISTS idx_risks_analysis_id ON risks(analysis_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contract_analyses_updated_at
  BEFORE UPDATE ON contract_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE contract_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

-- Contract analyses policies
CREATE POLICY "Users can view their own contract analyses"
  ON contract_analyses FOR SELECT
  USING (auth.uid() = analyzed_by);

CREATE POLICY "Users can create their own contract analyses"
  ON contract_analyses FOR INSERT
  WITH CHECK (auth.uid() = analyzed_by);

CREATE POLICY "Users can update their own contract analyses"
  ON contract_analyses FOR UPDATE
  USING (auth.uid() = analyzed_by);

-- Risks policies
CREATE POLICY "Users can view risks of their own analyses"
  ON risks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contract_analyses
      WHERE contract_analyses.id = risks.analysis_id
      AND contract_analyses.analyzed_by = auth.uid()
    )
  );

CREATE POLICY "Users can create risks for their own analyses"
  ON risks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contract_analyses
      WHERE contract_analyses.id = risks.analysis_id
      AND contract_analyses.analyzed_by = auth.uid()
    )
  );

CREATE POLICY "Users can update risks of their own analyses"
  ON risks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contract_analyses
      WHERE contract_analyses.id = risks.analysis_id
      AND contract_analyses.analyzed_by = auth.uid()
    )
  ); 