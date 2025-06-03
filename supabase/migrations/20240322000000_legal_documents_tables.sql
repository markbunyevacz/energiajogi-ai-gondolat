-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create enum types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'jogász',
            'tulajdonos'
        );
    END IF;
END$$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'jogász',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create document_type enum
CREATE TYPE document_type AS ENUM (
  'law',
  'regulation',
  'policy',
  'decision',
  'other'
);

CREATE TYPE change_type AS ENUM (
  'amendment',
  'repeal',
  'new_legislation',
  'interpretation',
  'other'
);

CREATE TYPE impact_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE contract_type AS ENUM (
  'service',
  'employment',
  'nda',
  'partnership',
  'other'
);

CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create legal_documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type document_type NOT NULL,
  source_url TEXT,
  publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create legal_changes table
CREATE TABLE IF NOT EXISTS legal_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  description TEXT NOT NULL,
  impact_level impact_level NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  content TEXT NOT NULL,
  contract_type contract_type NOT NULL,
  risk_level impact_level NOT NULL,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contract_impacts table
CREATE TABLE IF NOT EXISTS contract_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  change_id UUID REFERENCES legal_changes(id) ON DELETE CASCADE,
  impact_description TEXT NOT NULL,
  action_required TEXT NOT NULL,
  priority_level priority_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_legal_documents_document_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_publication_date ON legal_documents(publication_date);
CREATE INDEX IF NOT EXISTS idx_legal_changes_document_id ON legal_changes(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_changes_impact_level ON legal_changes(impact_level);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_risk_level ON contracts(risk_level);
CREATE INDEX IF NOT EXISTS idx_contract_impacts_contract_id ON contract_impacts(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_impacts_change_id ON contract_impacts(change_id);
CREATE INDEX IF NOT EXISTS idx_contract_impacts_priority_level ON contract_impacts(priority_level);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_impacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policies for legal_documents
CREATE POLICY "Users can view legal documents"
  ON legal_documents FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify legal documents"
  ON legal_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create RLS policies for legal_changes
CREATE POLICY "Users can view legal changes"
  ON legal_changes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify legal changes"
  ON legal_changes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create RLS policies for contracts
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'jogász')));

CREATE POLICY "Users can create their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'jogász')));

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'jogász')));

-- Create RLS policies for contract_impacts
CREATE POLICY "Users can view contract impacts"
  ON contract_impacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'jogász')));

CREATE POLICY "Only admins can modify contract impacts"
  ON contract_impacts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_changes_updated_at
  BEFORE UPDATE ON legal_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_impacts_updated_at
  BEFORE UPDATE ON contract_impacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 