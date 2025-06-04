-- Create user domain permissions table
CREATE TABLE user_domain_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Create document access control table
CREATE TABLE document_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

-- Create indexes
CREATE INDEX idx_user_domain_permissions_user ON user_domain_permissions(user_id);
CREATE INDEX idx_user_domain_permissions_domain ON user_domain_permissions(domain);
CREATE INDEX idx_document_access_control_user ON document_access_control(user_id);
CREATE INDEX idx_document_access_control_document ON document_access_control(document_id);

-- Create RLS policies
ALTER TABLE user_domain_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_control ENABLE ROW LEVEL SECURITY;

-- User domain permissions policies
CREATE POLICY "Users can view their own domain permissions"
  ON user_domain_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage domain permissions"
  ON user_domain_permissions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Document access control policies
CREATE POLICY "Users can view their own document access"
  ON document_access_control
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage document access"
  ON document_access_control
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin'); 