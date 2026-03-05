import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, ArrowLeft, Minus, Plus, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent, DbTicketType } from "@/types/database";

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('events')
        .select('*, ticket_types(*)')
        .eq('slug', slug)
        .single();
      setEvent(data);
      setLoading(false);

      // Check waitlist status
      if (data && user) {
        const { data: wl } = await (supabase as any)
          .from('waitlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', data.id)
          .maybeSingle();
        setOnWaitlist(!!wl);
      }
    };
    fetch();
  }, [slug, user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Event Not Found</h1>
        <Link to="/events"><Button variant="outline">Back to Events</Button></Link>
      </div>
    );
  }

  const tickets = event.ticket_types || [];
  const soldOut = tickets.length > 0 && tickets.every(t => t.quantity_sold >= t.quantity_available);

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const updateQty = (ticketId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = tickets.reduce(
    (sum, t) => sum + Number(t.price) * (quantities[t.id] || 0), 0
  );

  const handleCheckout = () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to purchase tickets.", variant: "destructive" });
      navigate("/login");
      return;
    }
    const selected = tickets
      .filter(t => (quantities[t.id] || 0) > 0)
      .map(t => ({ id: t.id, name: t.name, price: Number(t.price), quantity: quantities[t.id], description: t.description }));

    sessionStorage.setItem("checkout", JSON.stringify({
      event: { id: event.id, title: event.title, date: event.date, venue: event.venue, location: event.location, image_url: event.image_url },
      tickets: selected,
      total: totalPrice,
    }));
    navigate("/checkout");
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to join the waitlist.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setJoiningWaitlist(true);
    const { error } = await (supabase as any)
      .from('waitlist')
      .insert({ user_id: user.id, event_id: event.id });
    setJoiningWaitlist(false);
    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already on waitlist" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      setOnWaitlist(true);
      toast({ title: "Added to waitlist!", description: "We'll notify you when tickets become available." });
    }
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg overflow-hidden aspect-[16/9] bg-secondary">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{event.category}</Badge>
                {soldOut && <Badge variant="destructive">Sold Out</Badge>}
                {event.is_featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{event.title}</h1>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{formattedDate}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{event.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{event.venue}, {event.location}</span>
                </div>
              </div>
              {event.description && (
                <div className="pt-4 border-t border-border">
                  <h2 className="font-heading font-semibold text-lg mb-2">About This Event</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold text-lg">
                {soldOut ? "Sold Out" : "Select Tickets"}
              </h2>

              {!soldOut && tickets.map(ticket => {
                const qty = quantities[ticket.id] || 0;
                const available = ticket.quantity_available - ticket.quantity_sold;
                const unavailable = available <= 0;

                return (
                  <div key={ticket.id} className="p-4 rounded-md border border-border bg-background space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{ticket.name}</p>
                        {ticket.description && <p className="text-xs text-muted-foreground">{ticket.description}</p>}
                      </div>
                      <span className="font-heading font-bold text-primary">${Number(ticket.price).toFixed(2)}</span>
                    </div>
                    {unavailable ? (
                      <p className="text-xs text-destructive">Sold out</p>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQty(ticket.id, -1)}
                          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:border-primary/50 transition-colors disabled:opacity-30"
                          disabled={qty === 0}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm">{qty}</span>
                        <button onClick={() => updateQty(ticket.id, 1)}
                          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:border-primary/50 transition-colors disabled:opacity-30"
                          disabled={qty >= Math.min(10, available)}>
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-muted-foreground ml-auto">{available} left</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {totalItems > 0 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{totalItems} ticket{totalItems > 1 ? "s" : ""}</span>
                    <span className="font-heading font-bold text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckout}>Checkout</Button>
                </div>
              )}

              {soldOut && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">This event is sold out. Join the waitlist to be notified if tickets become available.</p>
                  <Button variant="outline" className="w-full gap-2" onClick={handleJoinWaitlist}
                    disabled={onWaitlist || joiningWaitlist}>
                    <Bell className="h-4 w-4" />
                    {onWaitlist ? "On Waitlist" : joiningWaitlist ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
              )}

              {totalItems === 0 && !soldOut && tickets.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">Select tickets above to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
