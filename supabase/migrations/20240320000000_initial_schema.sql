-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('PDF', 'HTML')),
    content_hash TEXT NOT NULL,
    content_text TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_versions table for change tracking
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    content_text TEXT,
    metadata JSONB,
    similarity_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_links table for storing relationships between documents
CREATE TABLE document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    target_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_document_id, target_document_id, link_type)
);

-- Create indexes
CREATE INDEX idx_documents_external_id ON documents(external_id);
CREATE INDEX idx_documents_content_hash ON documents(content_hash);
CREATE INDEX idx_documents_published_date ON documents(published_date);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_links_source_id ON document_links(source_document_id);
CREATE INDEX idx_document_links_target_id ON document_links(target_document_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for documents table
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 