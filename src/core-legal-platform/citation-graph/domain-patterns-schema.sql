-- Create domain patterns table
CREATE TABLE domain_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  pattern TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(domain, pattern)
);

-- Create indexes
CREATE INDEX idx_domain_patterns_domain ON domain_patterns(domain);
CREATE INDEX idx_domain_patterns_active ON domain_patterns(is_active);

-- Create RLS policies
ALTER TABLE domain_patterns ENABLE ROW LEVEL SECURITY;

-- Domain patterns policies
CREATE POLICY "Users can view active domain patterns"
  ON domain_patterns
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage domain patterns"
  ON domain_patterns
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial patterns for energy law domain
INSERT INTO domain_patterns (domain, pattern, description)
VALUES 
  ('energy', '(\d+\.)\s+törvény\s+(\d{4})\.\s+évben', 'Basic law citation pattern'),
  ('energy', '(\d+\.)\s+törvény\s+(\d{4})\.\s+évben\s+(\d+)\.\s+paragrafus', 'Law citation with paragraph pattern'); 