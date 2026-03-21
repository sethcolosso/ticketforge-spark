-- Cleanup: remove temporary troubleshooting table created during auth debugging.
-- Uses default RESTRICT behavior (no CASCADE) to avoid accidental dependent drops.

DROP TABLE IF EXISTS public.users;
