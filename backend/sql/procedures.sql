-- ============================================================================
-- PROCEDURE: create_trip
-- ============================================================================
-- Creates a new trip with validation
-- Returns: trip_id

CREATE OR REPLACE FUNCTION create_trip(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_destination_city VARCHAR(100),
    p_destination_country VARCHAR(100),
    p_destination_iata CHAR(3) DEFAULT NULL,
    p_origin_city VARCHAR(100) DEFAULT NULL,
    p_origin_iata CHAR(3) DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_travelers_count INTEGER DEFAULT 1,
    p_budget_range VARCHAR(20) DEFAULT 'mid',
    p_trip_style VARCHAR(20) DEFAULT 'mixed'
)
RETURNS UUID AS $$
DECLARE
    v_trip_id UUID;
BEGIN
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'User % does not exist', p_user_id;
    END IF;

    -- Validate date range
    IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND p_date_to < p_date_from THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    -- Insert trip
    INSERT INTO trips (
        user_id, title, destination_city, destination_country,
        destination_iata, origin_city, origin_iata,
        date_from, date_to, travelers_count,
        budget_range, trip_style, status
    ) VALUES (
        p_user_id, p_title, p_destination_city, p_destination_country,
        p_destination_iata, p_origin_city, p_origin_iata,
        p_date_from, p_date_to, p_travelers_count,
        p_budget_range, p_trip_style, 'planning'
    )
    RETURNING trip_id INTO v_trip_id;

    RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: update_trip_status
-- ============================================================================
-- Updates trip status and updated_at timestamp
-- Returns: boolean success

CREATE OR REPLACE FUNCTION update_trip_status(
    p_trip_id UUID,
    p_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    -- Validate status
    IF p_status NOT IN ('planning', 'booked', 'in_progress', 'completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Update trip
    UPDATE trips
    SET status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE trip_id = p_trip_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'Trip % not found', p_trip_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: get_user_trips
-- ============================================================================
-- Lists trips for a user with pagination
-- Returns: TABLE of trip records

CREATE OR REPLACE FUNCTION get_user_trips(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    trip_id UUID,
    user_id UUID,
    title VARCHAR(255),
    destination_city VARCHAR(100),
    destination_country VARCHAR(100),
    destination_iata CHAR(3),
    origin_city VARCHAR(100),
    origin_iata CHAR(3),
    date_from DATE,
    date_to DATE,
    travelers_count INTEGER,
    budget_range VARCHAR(20),
    trip_style VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trip_id, t.user_id, t.title, t.destination_city,
        t.destination_country, t.destination_iata, t.origin_city,
        t.origin_iata, t.date_from, t.date_to, t.travelers_count,
        t.budget_range, t.trip_style, t.status,
        t.created_at, t.updated_at
    FROM trips t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: delete_trip_cascade
-- ============================================================================
-- Deletes trip and all associated messages and itineraries
-- Returns: number of rows deleted

CREATE OR REPLACE FUNCTION delete_trip_cascade(
    p_trip_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER := 0;
    v_messages INTEGER;
    v_itineraries INTEGER;
    v_trips INTEGER;
BEGIN
    -- Delete messages (cascade handles this, but we count for reporting)
    DELETE FROM messages WHERE trip_id = p_trip_id;
    GET DIAGNOSTICS v_messages = ROW_COUNT;

    -- Delete itineraries
    DELETE FROM itineraries WHERE trip_id = p_trip_id;
    GET DIAGNOSTICS v_itineraries = ROW_COUNT;

    -- Delete trip
    DELETE FROM trips WHERE trip_id = p_trip_id;
    GET DIAGNOSTICS v_trips = ROW_COUNT;

    v_deleted := v_messages + v_itineraries + v_trips;

    IF v_trips = 0 THEN
        RAISE NOTICE 'Trip % not found', p_trip_id;
    END IF;

    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: add_message_batch
-- ============================================================================
-- Efficiently inserts multiple messages in one transaction
-- Input: JSONB array of message objects
-- Returns: number of messages inserted

CREATE OR REPLACE FUNCTION add_message_batch(
    p_messages JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_inserted INTEGER;
BEGIN
    INSERT INTO messages (trip_id, role, content, tool_name, tool_call_id, created_at)
    SELECT 
        (msg->>'trip_id')::UUID,
        msg->>'role',
        msg->>'content',
        msg->>'tool_name',
        CASE WHEN msg->>'tool_call_id' IS NOT NULL THEN (msg->>'tool_call_id')::UUID ELSE NULL END,
        COALESCE(to_timestamp((msg->>'created_at')::DOUBLE PRECISION), CURRENT_TIMESTAMP)
    FROM jsonb_array_elements(p_messages) AS msg;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: get_trip_messages
-- ============================================================================
-- Retrieves messages for a trip with pagination and filtering
-- Returns: TABLE of message records

CREATE OR REPLACE FUNCTION get_trip_messages(
    p_trip_id UUID,
    p_limit INTEGER DEFAULT 100,
    p_after_timestamp TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    message_id UUID,
    trip_id UUID,
    role VARCHAR(20),
    content TEXT,
    tool_name VARCHAR(50),
    tool_call_id UUID,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.message_id, m.trip_id, m.role, m.content,
        m.tool_name, m.tool_call_id, m.created_at
    FROM messages m
    WHERE m.trip_id = p_trip_id
      AND (p_after_timestamp IS NULL OR m.created_at > p_after_timestamp)
    ORDER BY m.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: save_itinerary
-- ============================================================================
-- Saves or updates an itinerary with auto-incrementing version
-- Returns: itinerary_id

CREATE OR REPLACE FUNCTION save_itinerary(
    p_trip_id UUID,
    p_days JSONB DEFAULT '[]'::jsonb,
    p_flights JSONB DEFAULT '[]'::jsonb,
    p_hotels JSONB DEFAULT '[]'::jsonb,
    p_estimated_total_cost DECIMAL(10,2) DEFAULT NULL,
    p_currency CHAR(3) DEFAULT 'EUR'
)
RETURNS UUID AS $$
DECLARE
    v_itinerary_id UUID;
    v_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_version
    FROM itineraries
    WHERE trip_id = p_trip_id;

    -- Insert new itinerary
    INSERT INTO itineraries (
        trip_id, version, days, flights, hotels,
        estimated_total_cost, currency
    ) VALUES (
        p_trip_id, v_version, p_days, p_flights, p_hotels,
        p_estimated_total_cost, p_currency
    )
    RETURNING itinerary_id INTO v_itinerary_id;

    RETURN v_itinerary_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROCEDURE: get_latest_itinerary
-- ============================================================================
-- Retrieves the most recent itinerary for a trip
-- Returns: TABLE with single itinerary record

CREATE OR REPLACE FUNCTION get_latest_itinerary(
    p_trip_id UUID
)
RETURNS TABLE (
    itinerary_id UUID,
    trip_id UUID,
    version INTEGER,
    days JSONB,
    flights JSONB,
    hotels JSONB,
    estimated_total_cost DECIMAL(10,2),
    currency CHAR(3),
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.itinerary_id, i.trip_id, i.version, i.days,
        i.flights, i.hotels, i.estimated_total_cost,
        i.currency, i.created_at
    FROM itineraries i
    WHERE i.trip_id = p_trip_id
    ORDER BY i.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to ensure user exists (for local dev)
CREATE OR REPLACE FUNCTION ensure_user_exists(
    p_user_id UUID,
    p_email VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
    INSERT INTO users (user_id, email)
    VALUES (p_user_id, COALESCE(p_email, p_user_id::TEXT || '@voyager.com'))
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to count entities for a trip
CREATE OR REPLACE FUNCTION get_trip_stats(
    p_trip_id UUID
)
RETURNS TABLE (
    message_count INTEGER,
    itinerary_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM messages WHERE trip_id = p_trip_id),
        (SELECT COUNT(*)::INTEGER FROM itineraries WHERE trip_id = p_trip_id);
END;
$$ LANGUAGE plpgsql;
