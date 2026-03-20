-- Ensure core ticketing foreign keys exist so embedded PostgREST selects work reliably.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a
			ON a.attrelid = c.conrelid
		 AND a.attnum = ANY (c.conkey)
		WHERE c.contype = 'f'
			AND c.conrelid = 'public.orders'::regclass
			AND c.confrelid = 'public.events'::regclass
			AND a.attname = 'event_id'
	) THEN
		ALTER TABLE public.orders
			ADD CONSTRAINT orders_event_id_fkey
			FOREIGN KEY (event_id)
			REFERENCES public.events(id)
			ON DELETE CASCADE
			NOT VALID;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a
			ON a.attrelid = c.conrelid
		 AND a.attnum = ANY (c.conkey)
		WHERE c.contype = 'f'
			AND c.conrelid = 'public.order_items'::regclass
			AND c.confrelid = 'public.orders'::regclass
			AND a.attname = 'order_id'
	) THEN
		ALTER TABLE public.order_items
			ADD CONSTRAINT order_items_order_id_fkey
			FOREIGN KEY (order_id)
			REFERENCES public.orders(id)
			ON DELETE CASCADE
			NOT VALID;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a
			ON a.attrelid = c.conrelid
		 AND a.attnum = ANY (c.conkey)
		WHERE c.contype = 'f'
			AND c.conrelid = 'public.order_items'::regclass
			AND c.confrelid = 'public.ticket_types'::regclass
			AND a.attname = 'ticket_type_id'
	) THEN
		ALTER TABLE public.order_items
			ADD CONSTRAINT order_items_ticket_type_id_fkey
			FOREIGN KEY (ticket_type_id)
			REFERENCES public.ticket_types(id)
			ON DELETE CASCADE
			NOT VALID;
	END IF;
END $$;

NOTIFY pgrst, 'reload schema';
