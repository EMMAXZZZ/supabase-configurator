-- Realtime setup for Supabase
-- Creates the realtime schema and required functions

CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant usage on realtime schemas
GRANT USAGE ON SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA _realtime TO postgres;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime;

-- Realtime configuration table
CREATE TABLE IF NOT EXISTS _realtime.subscription (
    id bigserial PRIMARY KEY,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}',
    claims jsonb NOT NULL,
    claims_role regrole NOT NULL GENERATED ALWAYS AS (realtime.to_regrole(claims ->> 'role')) STORED,
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS ix_realtime_subscription_entity ON _realtime.subscription(entity);
CREATE INDEX IF NOT EXISTS ix_realtime_subscription_subscription_id ON _realtime.subscription(subscription_id);

-- Realtime helper functions
CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)
RETURNS regrole AS $$
SELECT role_name::regrole
$$ LANGUAGE sql;

-- Function to check if user can access table
CREATE OR REPLACE FUNCTION realtime.can_insert_object(
    fid bigint,
    fname text,
    ftable regclass,
    fop realtime.operation,
    fclaims jsonb
) RETURNS boolean AS $$
DECLARE
    bind_permissions int;
    user_permissions int;
    final_result boolean;
BEGIN
    -- Check basic permissions
    SELECT COUNT(*)
    INTO bind_permissions
    FROM _realtime.subscription
    WHERE entity = ftable
    AND claims_role = to_regrole(fclaims ->> 'role');

    IF bind_permissions > 0 THEN
        RETURN true;
    END IF;

    RETURN false;
END
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO supabase_realtime_admin;
