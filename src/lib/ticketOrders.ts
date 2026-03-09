import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";

export interface CheckoutTicketItem {
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

export type TicketOrder = Tables<"ticket_orders">;

const SERVICE_FEE_RATE = 0.03;

const toMoney = (value: number) => Number(value.toFixed(2));

const buildOrderCode = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TF-${date}-${random}`;
};

export const createTicketOrder = async (userId: string, payload: CheckoutOrderPayload) => {
  const ticketCount = payload.tickets.reduce((sum, item) => sum + item.quantity, 0);
  if (ticketCount === 0) {
    throw new Error("Select at least one ticket to place an order.");
  }

  const subtotal = toMoney(payload.total);
  const serviceFee = toMoney(subtotal * SERVICE_FEE_RATE);
  const total = toMoney(subtotal + serviceFee);

  const insertPayload: TablesInsert<"ticket_orders"> = {
    user_id: userId,
    order_code: buildOrderCode(),
    event_id: payload.event.id,
    event_slug: payload.event.slug,
    event_title: payload.event.title,
    event_date: payload.event.date,
    event_venue: payload.event.venue,
    event_location: payload.event.location,
    event_image: payload.event.image ?? null,
    ticket_items: payload.tickets as unknown as Json,
    ticket_count: ticketCount,
    subtotal,
    service_fee: serviceFee,
    total,
    status: "confirmed",
  };

  const { data, error } = await supabase
    .from("ticket_orders")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const fetchTicketOrdersForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const isOrderCancelable = (order: Pick<TicketOrder, "status" | "event_date">) => {
  if (order.status !== "confirmed") return false;

  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const eventDate = new Date(order.event_date);
  const eventDateUTC = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());

  return eventDateUTC > todayUTC;
};

export const cancelTicketOrder = async (order: TicketOrder, userId: string, reason?: string) => {
  if (!isOrderCancelable(order)) {
    throw new Error("This order is no longer eligible for cancellation.");
  }

  const { data, error } = await supabase
    .from("ticket_orders")
    .update({
      status: "cancelled",
      cancellation_reason: reason ?? "Cancelled by customer",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
