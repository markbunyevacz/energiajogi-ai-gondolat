-- Create enum types
CREATE TYPE legal_document_type AS ENUM (
    'law',
    'regulation',
    'policy',
    'decision',
    'other'
);

CREATE TYPE change_type AS ENUM (
    'amendment',
    'repeal',
    'new',
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
    'employment',
    'service',
    'sales',
    'lease',
    'nda',
    'other'
);

CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Create legal_documents table
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type legal_document_type NOT NULL,
    source_url TEXT,
    publication_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legal_changes table
CREATE TABLE legal_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    change_type change_type NOT NULL,
    description TEXT NOT NULL,
    impact_level impact_level NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    content TEXT NOT NULL,
    contract_type contract_type NOT NULL,
    risk_level impact_level NOT NULL,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_impacts table
CREATE TABLE contract_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    change_id UUID REFERENCES legal_changes(id) ON DELETE CASCADE,
    impact_description TEXT NOT NULL,
    action_required TEXT NOT NULL,
    priority_level priority_level NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_legal_documents_publication_date ON legal_documents(publication_date);
CREATE INDEX idx_legal_changes_document_id ON legal_changes(document_id);
CREATE INDEX idx_legal_changes_impact_level ON legal_changes(impact_level);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_risk_level ON contracts(risk_level);
CREATE INDEX idx_contract_impacts_contract_id ON contract_impacts(contract_id);
CREATE INDEX idx_contract_impacts_change_id ON contract_impacts(change_id);
CREATE INDEX idx_contract_impacts_priority ON contract_impacts(priority_level);

-- Enable Row Level Security
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_impacts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Legal Documents Policies
CREATE POLICY "Legal documents are viewable by authenticated users"
    ON legal_documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Legal documents are insertable by admins"
    ON legal_documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Legal documents are updatable by admins"
    ON legal_documents FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Legal Changes Policies
CREATE POLICY "Legal changes are viewable by authenticated users"
    ON legal_changes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Legal changes are insertable by admins"
    ON legal_changes FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Legal changes are updatable by admins"
    ON legal_changes FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Contracts Policies
CREATE POLICY "Contracts are viewable by authenticated users"
    ON contracts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Contracts are insertable by admins and lawyers"
    ON contracts FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'jogász'));

CREATE POLICY "Contracts are updatable by admins and lawyers"
    ON contracts FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'jogász'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'jogász'));

-- Contract Impacts Policies
CREATE POLICY "Contract impacts are viewable by authenticated users"
    ON contract_impacts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Contract impacts are insertable by admins and lawyers"
    ON contract_impacts FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'jogász'));

CREATE POLICY "Contract impacts are updatable by admins and lawyers"
    ON contract_impacts FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'jogász'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'jogász'));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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