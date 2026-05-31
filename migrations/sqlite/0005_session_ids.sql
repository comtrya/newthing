-- Add a stable, opaque session ID column to the sessions table.
-- The token itself is the bearer credential and must never be exposed
-- to the admin UI or logs. The session_id is a safe, opaque handle
-- the admin API uses for listing and revoking individual sessions.
-- Backfill: existing sessions get an id derived from rowid to keep
-- the migration simple; these sessions have short TTLs anyway.
--
-- Migration 0005 — session IDs for admin revocation (#226).

ALTER TABLE sessions ADD COLUMN session_id TEXT;

UPDATE sessions
SET session_id = 'session_legacy_' || CAST(rowid AS TEXT)
WHERE session_id IS NULL;

CREATE UNIQUE INDEX sessions_session_id_idx ON sessions(session_id)
WHERE session_id IS NOT NULL;
