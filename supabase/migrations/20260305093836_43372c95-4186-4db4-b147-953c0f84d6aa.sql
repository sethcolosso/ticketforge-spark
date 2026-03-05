
-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'buyer');
CREATE TYPE public.event_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.order_status AS ENUM ('confirmed', 'cancelled', 'refunded');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Events table (seller-posted, admin-approved)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status event_status NOT NULL DEFAULT 'pending',
  capacity INT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Ticket types for each event
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_available INT NOT NULL DEFAULT 100,
  quantity_sold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

-- 8. Waitlist
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- 9. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 10. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 11. RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS policies for events
CREATE POLICY "Anyone can view approved events" ON public.events FOR SELECT USING (status = 'approved');
CREATE POLICY "Sellers can view own events" ON public.events FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Sellers can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own events" ON public.events FOR UPDATE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS policies for ticket_types
CREATE POLICY "Anyone can view ticket types for approved events" ON public.ticket_types FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status = 'approved')
);
CREATE POLICY "Sellers can view own event ticket types" ON public.ticket_types FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND seller_id = auth.uid())
);
CREATE POLICY "Sellers can manage own ticket types" ON public.ticket_types FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND seller_id = auth.uid())
);
CREATE POLICY "Sellers can update own ticket types" ON public.ticket_types FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND seller_id = auth.uid())
);
CREATE POLICY "Admins can manage all ticket types" ON public.ticket_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can view orders for their events" ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND seller_id = auth.uid())
);

-- 16. RLS policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can view order items for their events" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.events e ON e.id = o.event_id
    WHERE o.id = order_id AND e.seller_id = auth.uid()
  )
);

-- 17. RLS policies for waitlist
CREATE POLICY "Users can view own waitlist" ON public.waitlist FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can join waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave waitlist" ON public.waitlist FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all waitlist" ON public.waitlist FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 18. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  -- Assign default buyer role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 19. Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 20. Function to decrement ticket availability on order
CREATE OR REPLACE FUNCTION public.process_ticket_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_types
  SET quantity_sold = quantity_sold + NEW.quantity
  WHERE id = NEW.ticket_type_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.process_ticket_sale();

-- 21. Insert admin role for sethcolosso1@gmail.com (will be applied when the user signs up via the trigger, but we also add a trigger to auto-assign admin)
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'sethcolosso1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();
