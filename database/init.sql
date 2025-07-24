-- Alliance Team Building Platform Database Initialization

-- Create database if it doesn't exist
-- (This is handled by the Docker environment variables)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- Note: TypeORM will create the main tables and relationships

-- Performance indexes that will be created after TypeORM entities are set up
-- These are useful for common queries

-- User indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_last_login ON users (is_active, last_login_at);

-- Team indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_name_trgm ON teams USING gin (name gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_status_created ON teams (status, created_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_leader_status ON teams (leader_id, status);

-- Game session indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_team_status ON game_sessions (team_id, status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_game_type_created ON game_sessions (game_type, created_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_scheduled_at ON game_sessions (scheduled_at) WHERE status = 'scheduled';

-- Team membership indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_memberships_user_status ON team_memberships (user_id, status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_memberships_team_role ON team_memberships (team_id, role, status);

-- Player stats indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_stats_user_game_type ON player_stats (user_id, game_session_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_stats_mvp_score ON player_stats (mvp_score DESC) WHERE was_mvp = true;

-- Create a function to generate session codes
CREATE OR REPLACE FUNCTION generate_session_code() RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, (random() * length(chars))::integer + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate user levels
CREATE OR REPLACE FUNCTION calculate_user_level(exp integer) RETURNS integer AS $$
BEGIN
    RETURN GREATEST(1, (exp / 1000) + 1);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate team levels  
CREATE OR REPLACE FUNCTION calculate_team_level(exp integer) RETURNS integer AS $$
BEGIN
    RETURN GREATEST(1, (exp / 2000) + 1);
END;
$$ LANGUAGE plpgsql;

-- Create some initial data (achievement templates, etc.)
-- This will be populated by the application after TypeORM creates the tables

COMMIT;