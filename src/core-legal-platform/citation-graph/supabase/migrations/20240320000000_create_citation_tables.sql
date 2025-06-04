-- Create citation relationships table
CREATE TABLE IF NOT EXISTS citation_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES documents(id),
  target_document_id UUID NOT NULL REFERENCES documents(id),
  citation_type TEXT NOT NULL CHECK (citation_type IN ('explicit', 'implicit')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  semantic_similarity FLOAT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_citation_relationships_source ON citation_relationships(source_document_id);
CREATE INDEX IF NOT EXISTS idx_citation_relationships_target ON citation_relationships(target_document_id);
CREATE INDEX IF NOT EXISTS idx_citation_relationships_type ON citation_relationships(citation_type);
CREATE INDEX IF NOT EXISTS idx_citation_relationships_confidence ON citation_relationships(confidence_score);
CREATE INDEX IF NOT EXISTS idx_citation_relationships_semantic ON citation_relationships(semantic_similarity);

-- Create function to create citation indexes
CREATE OR REPLACE FUNCTION create_citation_indexes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create GIN index for metadata JSONB
  CREATE INDEX IF NOT EXISTS idx_citation_relationships_metadata ON citation_relationships USING GIN (metadata);
  
  -- Create composite indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_citation_relationships_source_type ON citation_relationships(source_document_id, citation_type);
  CREATE INDEX IF NOT EXISTS idx_citation_relationships_target_type ON citation_relationships(target_document_id, citation_type);
  
  -- Create index for impact chain queries
  CREATE INDEX IF NOT EXISTS idx_citation_relationships_chain ON citation_relationships(source_document_id, target_document_id, confidence_score);
END;
$$; 