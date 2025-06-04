CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citing_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  cited_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('explicit', 'implicit')),
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_citing ON citations(citing_document_id);
CREATE INDEX idx_citations_cited ON citations(cited_document_id); 