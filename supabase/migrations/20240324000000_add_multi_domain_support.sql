-- Create legal_domains table
CREATE TABLE IF NOT EXISTS legal_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_domain_id UUID REFERENCES legal_domains(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create legal_hierarchy_level enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'legal_hierarchy_level') THEN
        CREATE TYPE legal_hierarchy_level AS ENUM (
            'constitutional',
            'statutory',
            'regulatory',
            'administrative',
            'judicial',
            'other'
        );
    END IF;
END$$;

-- Add new columns to legal_documents table
ALTER TABLE legal_documents
ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES legal_domains(id),
ADD COLUMN IF NOT EXISTS hierarchy_level legal_hierarchy_level,
ADD COLUMN IF NOT EXISTS cross_references JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create legal_hierarchy table for tracking document relationships
CREATE TABLE IF NOT EXISTS legal_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  child_document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_document_relationship UNIQUE (parent_document_id, child_document_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_legal_domains_code ON legal_domains(code);
CREATE INDEX IF NOT EXISTS idx_legal_domains_parent ON legal_domains(parent_domain_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_domain ON legal_documents(domain_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_hierarchy ON legal_documents(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_legal_hierarchy_parent ON legal_hierarchy(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_legal_hierarchy_child ON legal_hierarchy(child_document_id);

-- Enable Row Level Security
ALTER TABLE legal_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for legal_domains
CREATE POLICY "Users can view legal domains"
  ON legal_domains FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify legal domains"
  ON legal_domains FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create RLS policies for legal_hierarchy
CREATE POLICY "Users can view legal hierarchy"
  ON legal_hierarchy FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify legal hierarchy"
  ON legal_hierarchy FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_legal_domains_updated_at
    BEFORE UPDATE ON legal_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_hierarchy_updated_at
    BEFORE UPDATE ON legal_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default energy law domain
INSERT INTO legal_domains (code, name, description)
VALUES ('energy', 'Energy Law', 'Hungarian energy law and regulations')
ON CONFLICT (code) DO NOTHING;

-- Update existing legal documents to belong to energy domain
UPDATE legal_documents
SET domain_id = (SELECT id FROM legal_domains WHERE code = 'energy')
WHERE domain_id IS NULL;

-- Create function to validate document hierarchy
CREATE OR REPLACE FUNCTION validate_document_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent circular references
    IF EXISTS (
        WITH RECURSIVE hierarchy AS (
            SELECT parent_document_id, child_document_id
            FROM legal_hierarchy
            WHERE parent_document_id = NEW.parent_document_id
            UNION
            SELECT h.parent_document_id, h.child_document_id
            FROM legal_hierarchy h
            JOIN hierarchy p ON h.parent_document_id = p.child_document_id
        )
        SELECT 1 FROM hierarchy WHERE child_document_id = NEW.parent_document_id
    ) THEN
        RAISE EXCEPTION 'Circular reference detected in document hierarchy';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hierarchy validation
CREATE TRIGGER validate_hierarchy_before_insert
    BEFORE INSERT ON legal_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_hierarchy(); 