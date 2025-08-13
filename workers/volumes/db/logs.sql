-- Analytics/Logs setup for Supabase
-- Creates the analytics schema for log storage

CREATE SCHEMA IF NOT EXISTS _analytics;

-- Grant usage to analytics service
GRANT USAGE ON SCHEMA _analytics TO supabase_admin;
GRANT ALL ON SCHEMA _analytics TO supabase_admin;

-- Log events table
CREATE TABLE IF NOT EXISTS _analytics.log_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now(),
    level text,
    message text,
    metadata jsonb DEFAULT '{}',
    source text,
    created_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp ON _analytics.log_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_entries_level ON _analytics.log_entries(level);
CREATE INDEX IF NOT EXISTS idx_log_entries_source ON _analytics.log_entries(source);

-- Function to insert log entries
CREATE OR REPLACE FUNCTION _analytics.insert_log_entry(
    p_level text DEFAULT 'info',
    p_message text DEFAULT '',
    p_metadata jsonb DEFAULT '{}',
    p_source text DEFAULT 'unknown'
) RETURNS uuid AS $$
DECLARE
    entry_id uuid;
BEGIN
    INSERT INTO _analytics.log_entries (level, message, metadata, source)
    VALUES (p_level, p_message, p_metadata, p_source)
    RETURNING id INTO entry_id;
    
    RETURN entry_id;
END
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA _analytics TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _analytics TO supabase_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA _analytics TO supabase_admin;
