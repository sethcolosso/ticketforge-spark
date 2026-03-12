import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, ArrowLeft, Minus, Plus, Bell, TrendingUp, TrendingDown, Minus as TrendStable, BadgeCheck, Flame, Users, Timer, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent, DbTicketType } from "@/types/database";

interface PricePrediction {
  trend: "rising" | "stable" | "falling";
  confidence: "high" | "medium" | "low";
  explanation: string;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [event, setEvent] = useState<(DbEvent & { seller_verified?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await (supabase as any)
        .from('events')
        .select('*, ticket_types(*)')
        .eq('slug', slug)
        .single();
      
      if (data) {
        // Check if seller is verified
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('is_verified')
          .eq('id', data.seller_id)
          .maybeSingle();
        data.seller_verified = profile?.is_verified || false;
      }
      
      setEvent(data);
      setLoading(false);

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
    fetchEvent();
  }, [slug, user]);

  const fetchPrediction = async () => {
    if (!event) return;
    setPredictLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-price-predict', {
        body: { event },
      });
      if (error) throw error;
      if (data?.prediction) setPrediction(data.prediction);
    } catch (e) {
      toast({ title: "Prediction unavailable", description: "Could not fetch AI prediction.", variant: "destructive" });
    }
    setPredictLoading(false);
  };

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
  const totalSold = tickets.reduce((s, t) => s + t.quantity_sold, 0);
  const totalAvail = tickets.reduce((s, t) => s + t.quantity_available, 0);
  const sellRatio = totalAvail > 0 ? totalSold / totalAvail : 0;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // Countdown
  const diff = new Date(event.date).getTime() - Date.now();
  const daysLeft = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
  const hoursLeft = diff > 0 ? Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0;

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
      .map(t => ({ ticket_type_id: t.id, name: t.name, price: Number(t.price), quantity: quantities[t.id], description: t.description }));

    sessionStorage.setItem("checkout", JSON.stringify({
      event: { id: event.id, slug: event.slug, title: event.title, date: event.date, venue: event.venue, location: event.location, image: event.image_url },
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

  const trendIcon = prediction?.trend === "rising"
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : prediction?.trend === "falling"
    ? <TrendingDown className="h-4 w-4 text-destructive" />
    : <TrendStable className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg overflow-hidden aspect-[16/9] bg-secondary relative">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
              {/* Countdown overlay */}
              {diff > 0 && daysLeft <= 30 && (
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Timer className="h-4 w-4 text-primary" />
                    <span>{daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`} until event</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{event.category}</Badge>
                {soldOut && <Badge variant="destructive">Sold Out</Badge>}
                {event.is_featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
                {sellRatio >= 0.7 && !soldOut && (
                  <Badge className="bg-orange-500 text-white"><Flame className="h-3 w-3 mr-1" />Selling Fast</Badge>
                )}
                {event.seller_verified && (
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    <BadgeCheck className="h-3 w-3 mr-1" />Verified Seller
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{event.title}</h1>
              
              {/* Social proof */}
              {totalSold > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  {totalSold} {totalSold === 1 ? "person has" : "people have"} bought tickets for this event
                </p>
              )}

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

              {/* AI Price Prediction */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" /> AI Price Insight
                  </h2>
                  {!prediction && (
                    <Button variant="outline" size="sm" onClick={fetchPrediction} disabled={predictLoading}>
                      {predictLoading ? "Analyzing..." : "Get Prediction"}
                    </Button>
                  )}
                </div>
                {prediction ? (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      {trendIcon}
                      <span className="font-medium capitalize">
                        Prices likely {prediction.trend}
                      </span>
                      <Badge variant="secondary" className="text-xs capitalize">{prediction.confidence} confidence</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{prediction.explanation}</p>
                  </div>
                ) : !predictLoading ? (
                  <p className="text-sm text-muted-foreground">Click "Get Prediction" to see AI-powered price insights for this event.</p>
                ) : null}
              </div>
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
                  <p className="text-xs text-muted-foreground">+ 3% service fee at checkout</p>
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
