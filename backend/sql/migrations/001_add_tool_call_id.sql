-- Migration: Add tool_call_id column to messages table
-- Date: 2026-06-17
-- Description: Links tool_result messages to their corresponding tool_call messages

-- Add the tool_call_id column (nullable for existing data)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS tool_call_id UUID REFERENCES messages(message_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_messages_tool_call_id ON messages(tool_call_id);

-- Optional: Add comment for documentation
COMMENT ON COLUMN messages.tool_call_id IS 'Foreign key linking tool_result messages to their corresponding tool_call message';
