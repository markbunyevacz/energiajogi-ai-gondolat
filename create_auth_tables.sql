-- First drop and recreate the user_role enum type
DO $$ 
BEGIN
    -- Drop the enum type if it exists (this will fail if it's in use)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role CASCADE;
    END IF;
    
    -- Create the enum type with all required values
    CREATE TYPE user_role AS ENUM ('admin', 'legal_manager', 'analyst', 'viewer');
END $$;

-- First check if our tables exist and drop them if they do
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS audit_log;

-- Create the tables (without recreating the enum)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Audit logs are viewable by admins only" ON audit_log;
DROP POLICY IF EXISTS "User roles are viewable by admins only" ON user_roles;
DROP POLICY IF EXISTS "User roles are manageable by admins only" ON user_roles;

-- Create RLS Policies for audit_log
CREATE POLICY "Audit logs are viewable by admins only"
    ON audit_log FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

-- Create RLS Policies for user_roles
CREATE POLICY "User roles are viewable by admins only"
    ON user_roles FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

CREATE POLICY "User roles are manageable by admins only"
    ON user_roles FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS has_role(UUID, user_role);

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role
        FROM user_roles
        WHERE user_roles.user_id = $1
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

-- Create updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Check if enum exists and its values
SELECT typname, enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'user_role';

-- Check what tables and policies are using the enum
SELECT 
    c.relname as table_name,
    a.attname as column_name,
    p.polname as policy_name
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_type t ON a.atttypid = t.oid
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE t.typname = 'user_role'
    OR (p.polname IS NOT NULL AND p.polcmd = 'r' AND p.polqual::text LIKE '%user_role%');

-- Check the current values in the user_role enum
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'user_role'
ORDER BY enumsortorder;

-- Add missing values to the enum if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin') THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'legal_manager') THEN
        ALTER TYPE user_role ADD VALUE 'legal_manager';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'analyst') THEN
        ALTER TYPE user_role ADD VALUE 'analyst';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'viewer') THEN
        ALTER TYPE user_role ADD VALUE 'viewer';
    END IF;
END $$; 