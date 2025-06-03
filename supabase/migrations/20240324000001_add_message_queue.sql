-- Create message queue table
CREATE TABLE IF NOT EXISTS queue_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_queue_messages_status ON queue_messages(status);
CREATE INDEX IF NOT EXISTS idx_queue_messages_created_at ON queue_messages(created_at);

-- Enable Row Level Security
ALTER TABLE queue_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for queue_messages
CREATE POLICY "Users can view queue messages"
  ON queue_messages FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify queue messages"
  ON queue_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_queue_messages_updated_at
    BEFORE UPDATE ON queue_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 