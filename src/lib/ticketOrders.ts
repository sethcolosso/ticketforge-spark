import { supabase } from "@/integrations/supabase/client";

export interface CheckoutTicketItem {
  ticket_type_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutOrderPayload {
  event: {
    id: string;
    slug: string;
    title: string;
    date: string;
    venue: string;
    location: string;
    image?: string;
  };
  tickets: CheckoutTicketItem[];
  total: number;
}

export interface TicketOrder {
  id: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  events?: {
    title: string;
    slug: string;
    date: string;
    venue: string;
    location: string;
    image_url: string | null;
  };
  order_items?: {
    id: string;
    quantity: number;
    unit_price: number;
    ticket_types?: {
      name: string;
    };
  }[];
}

type OrderRow = {
  id: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

const hydrateOrders = async (orders: OrderRow[]): Promise<TicketOrder[]> => {
  if (orders.length === 0) return [];

  const eventIds = Array.from(new Set(orders.map((order) => order.event_id).filter(Boolean)));
  const orderIds = orders.map((order) => order.id);

  const [{ data: eventsData, error: eventsError }, { data: orderItemsData, error: orderItemsError }] = await Promise.all([
    (supabase as any)
      .from("events")
      .select("id, title, slug, date, venue, location, image_url")
      .in("id", eventIds),
    (supabase as any)
      .from("order_items")
      .select("id, order_id, quantity, unit_price, ticket_types(name)")
      .in("order_id", orderIds),
  ]);

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  if (orderItemsError) {
    throw new Error(orderItemsError.message);
  }

  const eventsById = new Map<string, TicketOrder["events"]>();
  (eventsData || []).forEach((event: any) => {
    eventsById.set(event.id, {
      title: event.title,
      slug: event.slug,
      date: event.date,
      venue: event.venue,
      location: event.location,
      image_url: event.image_url,
    });
  });

  const itemsByOrderId = new Map<string, TicketOrder["order_items"]>();
  (orderItemsData || []).forEach((item: any) => {
    const current = itemsByOrderId.get(item.order_id) || [];
    current.push({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      ticket_types: item.ticket_types ? { name: item.ticket_types.name } : undefined,
    });
    itemsByOrderId.set(item.order_id, current);
  });

  return orders.map((order) => ({
    ...order,
    events: eventsById.get(order.event_id),
    order_items: itemsByOrderId.get(order.id) || [],
  }));
};

export const createTicketOrder = async (userId: string | null, payload: CheckoutOrderPayload, guestEmail?: string) => {
  const ticketCount = payload.tickets.reduce((sum, item) => sum + item.quantity, 0);
  if (ticketCount === 0) {
    throw new Error("Select at least one ticket to place an order.");
  }

  const total = Number(payload.total.toFixed(2));

  // Create order
  const { data: order, error: orderError } = await (supabase as any)
    .from('orders')
    .insert({
      user_id: userId,
      event_id: payload.event.id,
      total_amount: total,
      status: 'confirmed',
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Failed to create order");
  }

  // Create order items
  const items = payload.tickets
    .filter(t => t.quantity > 0)
    .map(t => ({
      order_id: order.id,
      ticket_type_id: t.ticket_type_id,
      quantity: t.quantity,
      unit_price: t.price,
    }));

  if (items.length > 0) {
    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .insert(items);
    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  return { ...order, order_code: order.id.slice(0, 8).toUpperCase() };
};

export const fetchTicketOrdersForUser = async (userId: string): Promise<TicketOrder[]> => {
  const { data, error } = await (supabase as any)
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateOrders((data || []) as OrderRow[]);
};

export const isOrderCancelable = (order: TicketOrder) => {
  if (order.status !== 'confirmed') return false;
  const eventDate = order.events?.date;
  if (!eventDate) return false;
  return new Date(eventDate) > new Date();
};

export const cancelTicketOrder = async (order: TicketOrder, userId: string) => {
  if (!isOrderCancelable(order)) {
    throw new Error("This order is no longer eligible for cancellation.");
  }

  const { data, error } = await (supabase as any)
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order.id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const [hydrated] = await hydrateOrders([data as OrderRow]);
  return hydrated;
};
