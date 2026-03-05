export interface DbEvent {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  description: string | null;
  date: string;
  time: string | null;
  venue: string;
  location: string;
  city: string | null;
  image_url: string | null;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  capacity: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  ticket_types?: DbTicketType[];
}

export interface DbTicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  created_at: string;
}

export interface DbOrder {
  id: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  status: 'confirmed' | 'cancelled' | 'refunded';
  created_at: string;
  events?: DbEvent;
  order_items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price: number;
  ticket_types?: DbTicketType;
}

export interface DbProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWaitlist {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  events?: DbEvent;
}
