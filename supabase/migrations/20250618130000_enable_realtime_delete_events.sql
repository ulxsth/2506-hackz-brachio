-- Set replica identity to full for room_players table
-- This allows DELETE events to include the old record data in Realtime
ALTER TABLE room_players REPLICA IDENTITY FULL;
