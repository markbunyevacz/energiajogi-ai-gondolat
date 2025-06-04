-- Create citation relationships table
CREATE TABLE citation_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL,
  target_document_id UUID NOT NULL,
  citation_type TEXT NOT NULL,
  citation_text TEXT,
  confidence_score FLOAT NOT NULL,
  semantic_similarity FLOAT,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create citation impact chains table
CREATE TABLE citation_impact_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_document_id UUID NOT NULL,
  affected_document_id UUID NOT NULL,
  impact_path UUID[] NOT NULL,
  impact_level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create citation cache table
CREATE TABLE citation_cache (
  document_id UUID PRIMARY KEY,
  citation_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes
CREATE INDEX idx_citation_relationships_source ON citation_relationships(source_document_id);
CREATE INDEX idx_citation_relationships_target ON citation_relationships(target_document_id);
CREATE INDEX idx_citation_impact_chains_root ON citation_impact_chains(root_document_id);
CREATE INDEX idx_citation_impact_chains_affected ON citation_impact_chains(affected_document_id);

-- Create materialized view for citation impact summary
CREATE MATERIALIZED VIEW citation_impact_summary AS
SELECT 
  root_document_id,
  COUNT(DISTINCT affected_document_id) as affected_count,
  MAX(impact_level) as max_impact,
  ARRAY_AGG(DISTINCT impact_level) as impact_levels
FROM citation_impact_chains
GROUP BY root_document_id;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_citation_impact_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY citation_impact_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_citation_impact_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON citation_impact_chains
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_citation_impact_summary(); 