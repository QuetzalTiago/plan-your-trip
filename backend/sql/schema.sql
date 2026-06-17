-- Voyager Travel Planning App - PostgreSQL Schema
-- Migration from DynamoDB single-table to normalized relational schema
-- No ORM - Raw SQL only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Minimal user table for foreign key relationships
-- In production, this would integrate with Cognito user pool

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================
-- Core trip planning sessions with all metadata

CREATE TABLE IF NOT EXISTS trips (
    trip_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    destination_iata CHAR(3),
    origin_city VARCHAR(100),
    origin_iata CHAR(3),
    date_from DATE,
    date_to DATE,
    travelers_count INTEGER DEFAULT 1 CHECK (travelers_count > 0),
    budget_range VARCHAR(20) DEFAULT 'mid' CHECK (budget_range IN ('low', 'mid', 'high')),
    trip_style VARCHAR(20) DEFAULT 'mixed' CHECK (trip_style IN ('adventure', 'relaxation', 'cultural', 'mixed')),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'booked', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_user_created ON trips(user_id, created_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Chat conversation history with AI agent

CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool_call', 'tool_result')),
    content TEXT NOT NULL,
    tool_name VARCHAR(50),
    tool_call_id UUID REFERENCES messages(message_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pagination and filtering
CREATE INDEX idx_messages_trip_id ON messages(trip_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_trip_created ON messages(trip_id, created_at);
CREATE INDEX idx_messages_tool_call_id ON messages(tool_call_id);

-- ============================================================================
-- ITINERARIES TABLE
-- ============================================================================
-- Generated trip itineraries with structured data

CREATE TABLE IF NOT EXISTS itineraries (
    itinerary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    days JSONB DEFAULT '[]'::jsonb,
    flights JSONB DEFAULT '[]'::jsonb,
    hotels JSONB DEFAULT '[]'::jsonb,
    estimated_total_cost DECIMAL(10,2),
    currency CHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, version)
);

-- Indexes for version queries
CREATE INDEX idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX idx_itineraries_version ON itineraries(trip_id, version DESC);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (for development)
-- ============================================================================

-- Create a default user for local development
INSERT INTO users (user_id, email, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'local-dev@voyager.com', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- GRANTS (adjust based on your user setup)
-- ============================================================================

-- Example grants for application user (uncomment and adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voyager_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO voyager_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO voyager_user;
