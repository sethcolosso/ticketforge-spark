DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a
			ON a.attrelid = c.conrelid
		 AND a.attnum = ANY (c.conkey)
		WHERE c.contype = 'f'
			AND c.conrelid = 'public.ticket_types'::regclass
			AND c.confrelid = 'public.events'::regclass
			AND a.attname = 'event_id'
	) THEN
		ALTER TABLE public.ticket_types
			ADD CONSTRAINT ticket_types_event_id_fkey
			FOREIGN KEY (event_id)
			REFERENCES public.events(id)
			ON DELETE CASCADE
			NOT VALID;
	END IF;
END $$;

NOTIFY pgrst, 'reload schema';
