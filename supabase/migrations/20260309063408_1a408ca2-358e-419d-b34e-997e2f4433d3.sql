
-- Fix the overly permissive policy on ticket_types
DROP POLICY IF EXISTS "System can update ticket quantities" ON public.ticket_types;
