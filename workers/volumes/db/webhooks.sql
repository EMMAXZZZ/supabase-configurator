-- Webhook utilities for Supabase
-- This creates webhook functionality for database triggers

CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Create webhook function
CREATE OR REPLACE FUNCTION supabase_functions.http_request()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_id bigint;
  payload json;
  url text := TG_ARGV[0];
  method text := TG_ARGV[1];
  headers json := TG_ARGV[2];
  params json := TG_ARGV[3];
  timeout int := TG_ARGV[4];
BEGIN
  IF url IS NULL OR url = 'null' THEN
    RAISE EXCEPTION 'url is required';
  END IF;

  IF method IS NULL OR method = 'null' THEN
    method := 'POST';
  END IF;

  IF headers IS NULL OR headers = 'null' THEN
    headers := '{}';
  END IF;

  IF timeout IS NULL OR timeout = 0 THEN
    timeout := 5000;
  END IF;

  CASE
    WHEN TG_OP = 'INSERT' THEN
      payload = json_build_object(
        'type', 'INSERT',
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', NULL
      );
    WHEN TG_OP = 'UPDATE' THEN
      payload = json_build_object(
        'type', 'UPDATE', 
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      );
    WHEN TG_OP = 'DELETE' THEN
      payload = json_build_object(
        'type', 'DELETE',
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', NULL,
        'old_record', row_to_json(OLD)
      );
    ELSE
      RAISE EXCEPTION 'Unknown TG_OP: "%". Should not occur', TG_OP;
  END CASE;

  -- This would normally make an HTTP request
  -- For now, just log the webhook call
  RAISE NOTICE 'Webhook called: % % %', method, url, payload;

  RETURN COALESCE(NEW, OLD);
END
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION supabase_functions.http_request() TO postgres, anon, authenticated, service_role;
