
-- Event chat messages table
CREATE TABLE public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Anyone with a confirmed order for the event can read messages
CREATE POLICY "Ticket holders can view event messages"
  ON public.event_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.event_id = event_messages.event_id
        AND orders.user_id = auth.uid()
        AND orders.status = 'confirmed'
    )
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_messages.event_id AND events.seller_id = auth.uid()
    )
  );

-- Ticket holders can post messages
CREATE POLICY "Ticket holders can post event messages"
  ON public.event_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.event_id = event_messages.event_id
        AND orders.user_id = auth.uid()
        AND orders.status = 'confirmed'
    )
  );

-- Users can delete own messages
CREATE POLICY "Users can delete own messages"
  ON public.event_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Enable realtime for event messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;

-- Split payments table
CREATE TABLE public.split_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  share_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  total_amount numeric NOT NULL,
  num_splits integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.split_payment_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id uuid NOT NULL REFERENCES public.split_payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  phone_number text,
  mpesa_receipt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payment_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own splits" ON public.split_payments FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.split_payment_contributions WHERE split_id = split_payments.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create splits" ON public.split_payments FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update own splits" ON public.split_payments FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Users can view own contributions" ON public.split_payment_contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.split_payments WHERE id = split_payment_contributions.split_id AND inviter_id = auth.uid()
  ));

CREATE POLICY "Users can insert contributions" ON public.split_payment_contributions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contributions" ON public.split_payment_contributions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Add QR code field to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code text;
-- Add scanned status
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scanned_at timestamptz;
