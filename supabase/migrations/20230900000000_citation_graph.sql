ALTER TABLE citation_edges
ADD CONSTRAINT unique_edge UNIQUE (source_document_id, target_document_id);

CREATE INDEX idx_citation_edges_source ON citation_edges (source_document_id);
CREATE INDEX idx_citation_edges_target ON citation_edges (target_document_id); 