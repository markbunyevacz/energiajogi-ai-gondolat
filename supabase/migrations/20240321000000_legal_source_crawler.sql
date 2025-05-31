-- Create enum for source types
CREATE TYPE legal_source_type AS ENUM (
  'magyar_kozlony',
  'official_journal',
  'court_decision',
  'legislation',
  'other'
);

-- Create enum for crawler status
CREATE TYPE crawler_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'rate_limited'
);

-- Create legal_sources table
CREATE TABLE IF NOT EXISTS legal_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type legal_source_type NOT NULL,
  base_url TEXT NOT NULL,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  crawl_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create crawler_jobs table
CREATE TABLE IF NOT EXISTS crawler_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES legal_sources(id) ON DELETE CASCADE,
  status crawler_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  documents_found INTEGER DEFAULT 0,
  documents_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create crawler_proxies table
CREATE TABLE IF NOT EXISTS crawler_proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_legal_sources_type ON legal_sources(type);
CREATE INDEX IF NOT EXISTS idx_crawler_jobs_source_id ON crawler_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_crawler_jobs_status ON crawler_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawler_proxies_is_active ON crawler_proxies(is_active);

-- Add RLS policies
ALTER TABLE legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_proxies ENABLE ROW LEVEL SECURITY;

-- Legal sources policies
CREATE POLICY "Users can view legal sources"
  ON legal_sources FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify legal sources"
  ON legal_sources FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Crawler jobs policies
CREATE POLICY "Users can view crawler jobs"
  ON crawler_jobs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify crawler jobs"
  ON crawler_jobs FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Crawler proxies policies
CREATE POLICY "Only admins can view and modify crawler proxies"
  ON crawler_proxies FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_legal_sources_updated_at
  BEFORE UPDATE ON legal_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crawler_jobs_updated_at
  BEFORE UPDATE ON crawler_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crawler_proxies_updated_at
  BEFORE UPDATE ON crawler_proxies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 