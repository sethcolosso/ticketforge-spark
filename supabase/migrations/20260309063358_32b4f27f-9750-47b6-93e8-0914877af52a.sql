
-- =============================================
-- FIX: Convert ALL RESTRICTIVE policies to PERMISSIVE
-- =============================================

-- EVENTS table: drop and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;
DROP POLICY IF EXISTS "Sellers can insert events" ON public.events;
DROP POLICY IF EXISTS "Sellers can update own events" ON public.events;
DROP POLICY IF EXISTS "Sellers can view own events" ON public.events;

CREATE POLICY "Anyone can view approved events" ON public.events FOR SELECT USING (status = 'approved'::event_status);
CREATE POLICY "Sellers can view own events" ON public.events FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can update own events" ON public.events FOR UPDATE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can update all events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDERS table
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their events" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can view orders for their events" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = orders.event_id AND events.seller_id = auth.uid()));
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDER_ITEMS table
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view order items for their events" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can view order items for their events" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders o JOIN events e ON e.id = o.event_id WHERE o.id = order_items.order_id AND e.seller_id = auth.uid()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- PROFILES table
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- TICKET_TYPES table
DROP POLICY IF EXISTS "Admins can manage all ticket types" ON public.ticket_types;
DROP POLICY IF EXISTS "Anyone can view ticket types for approved events" ON public.ticket_types;
DROP POLICY IF EXISTS "Sellers can manage own ticket types" ON public.ticket_types;
DROP POLICY IF EXISTS "Sellers can update own ticket types" ON public.ticket_types;
DROP POLICY IF EXISTS "Sellers can view own event ticket types" ON public.ticket_types;

CREATE POLICY "Anyone can view ticket types for approved events" ON public.ticket_types FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.status = 'approved'::event_status));
CREATE POLICY "Sellers can view own event ticket types" ON public.ticket_types FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.seller_id = auth.uid()));
CREATE POLICY "Admins can view all ticket types" ON public.ticket_types FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can insert own ticket types" ON public.ticket_types FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.seller_id = auth.uid()));
CREATE POLICY "Admins can insert ticket types" ON public.ticket_types FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can update own ticket types" ON public.ticket_types FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.seller_id = auth.uid()));
CREATE POLICY "Admins can update ticket types" ON public.ticket_types FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ticket types" ON public.ticket_types FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Allow ticket quantity updates during purchase (via trigger)
CREATE POLICY "System can update ticket quantities" ON public.ticket_types FOR UPDATE USING (true);

-- USER_ROLES table
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own roles" ON public.user_roles FOR DELETE TO authenticated USING (user_id = auth.uid());

-- WAITLIST table
DROP POLICY IF EXISTS "Admins can view all waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can leave waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;

CREATE POLICY "Users can view own waitlist" ON public.waitlist FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can join waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave waitlist" ON public.waitlist FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can delete waitlist" ON public.waitlist FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- STORAGE: Create bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users can upload event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');
CREATE POLICY "Users can update own event images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own event images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
