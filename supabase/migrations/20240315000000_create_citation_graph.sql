-- Create citation_nodes table
CREATE TABLE IF NOT EXISTS citation_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create citation_edges table
CREATE TABLE IF NOT EXISTS citation_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES citation_nodes(id),
    target_id UUID NOT NULL REFERENCES citation_nodes(id),
    type TEXT NOT NULL CHECK (type IN ('explicit', 'implicit')),
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    context TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_citation_nodes_document_id ON citation_nodes(document_id);
CREATE INDEX IF NOT EXISTS idx_citation_nodes_type ON citation_nodes(type);
CREATE INDEX IF NOT EXISTS idx_citation_edges_source_id ON citation_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_citation_edges_target_id ON citation_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_citation_edges_type ON citation_edges(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_citation_nodes_updated_at
    BEFORE UPDATE ON citation_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citation_edges_updated_at
    BEFORE UPDATE ON citation_edges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 