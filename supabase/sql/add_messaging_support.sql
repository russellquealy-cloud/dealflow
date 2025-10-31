-- Add listing_id support to messages table for property-specific conversations
-- This migration adds listing_id to the existing messages table

ALTER TABLE messages ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;

-- Add index for faster queries by listing
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);

-- Add index for faster queries by thread_id
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Update RLS policies to allow users to view messages related to their listings
-- (In addition to messages they sent/received)

-- Drop existing policies and recreate with listing support
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

-- Users can view messages if:
-- 1. They sent or received the message, OR
-- 2. They own the listing the message is about
CREATE POLICY "Users can view messages they sent or received or own listing" ON messages
  FOR SELECT USING (
    auth.uid() = from_id OR 
    auth.uid() = to_id OR
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = messages.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (auth.uid() = to_id);

