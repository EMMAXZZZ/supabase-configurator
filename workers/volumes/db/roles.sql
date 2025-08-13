-- Create custom roles for Supabase

-- Create roles for auth service
CREATE ROLE supabase_auth_admin;
ALTER ROLE supabase_auth_admin WITH NOINHERIT CREATEROLE LOGIN;
GRANT ALL PRIVILEGES ON SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Create role for storage service
CREATE ROLE supabase_storage_admin;
ALTER ROLE supabase_storage_admin WITH NOINHERIT CREATEROLE LOGIN;
GRANT ALL PRIVILEGES ON SCHEMA public TO supabase_storage_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_storage_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_storage_admin;

-- Create role for realtime service
CREATE ROLE supabase_realtime_admin;
ALTER ROLE supabase_realtime_admin WITH NOINHERIT CREATEROLE LOGIN REPLICATION;
GRANT ALL PRIVILEGES ON SCHEMA public TO supabase_realtime_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_realtime_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_realtime_admin;

-- Create authenticator role for PostgREST
CREATE ROLE authenticator NOINHERIT;
GRANT USAGE ON SCHEMA public TO authenticator;

-- Create anon and authenticated roles
CREATE ROLE anon;
CREATE ROLE authenticated;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Allow authenticator to switch to anon and authenticated
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;

-- Set default role for authenticator
ALTER ROLE authenticator SET search_path = public;
