-- Database initialization script for production
-- This script sets up the initial database configuration

-- Create additional databases if needed
-- CREATE DATABASE tournament_test;
-- CREATE DATABASE tournament_staging;

-- Create read-only user for reporting/monitoring
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'readonly_user') THEN

      CREATE ROLE readonly_user LOGIN PASSWORD 'readonly_password_change_me';
   END IF;
END
$do$;

-- Grant read-only permissions
GRANT CONNECT ON DATABASE tournament TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Create backup user
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'backup_user') THEN

      CREATE ROLE backup_user LOGIN PASSWORD 'backup_password_change_me';
   END IF;
END
$do$;

-- Grant backup permissions
GRANT CONNECT ON DATABASE tournament TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_user;

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Security settings
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_checkpoints = 'on';
ALTER SYSTEM SET log_lock_waits = 'on';

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create indexes for common queries (these will be created by Prisma migrations)
-- But we can prepare for them

-- Notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_tournament_changes()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('tournament_changes',
        json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'id', COALESCE(NEW.id, OLD.id)
        )::text
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a maintenance user for automated tasks
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'maintenance_user') THEN

      CREATE ROLE maintenance_user LOGIN PASSWORD 'maintenance_password_change_me';
   END IF;
END
$do$;

-- Grant necessary permissions for maintenance tasks
GRANT CONNECT ON DATABASE tournament TO maintenance_user;
GRANT USAGE ON SCHEMA public TO maintenance_user;
GRANT CREATE ON SCHEMA public TO maintenance_user;

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed at %', now();
END $$;