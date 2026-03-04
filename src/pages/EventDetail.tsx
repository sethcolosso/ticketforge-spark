import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, ArrowLeft, Minus, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import WaitlistModal from "@/components/WaitlistModal";
import { getEventBySlug } from "@/data/events";

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const event = getEventBySlug(slug || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [depositMode, setDepositMode] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Event Not Found</h1>
        <Link to="/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const updateQty = (ticketId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = event.tickets.reduce(
    (sum, t) => sum + t.price * (quantities[t.id] || 0),
    0
  );
  const depositAmount = totalPrice * 0.5;
  const hasDepositTickets = event.tickets.some((t) => t.depositEnabled);

  const handleCheckout = () => {
    const selected = event.tickets
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({ ...t, quantity: quantities[t.id] }));
    sessionStorage.setItem("checkout", JSON.stringify({
      event,
      tickets: selected,
      total: depositMode ? depositAmount : totalPrice,
      isDeposit: depositMode,
    }));
    navigate("/checkout");
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
            <div className="rounded-lg overflow-hidden aspect-[16/9]">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{event.category}</Badge>
                <StatusBadge status={event.status} />
                {event.featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{event.title}</h1>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{event.venue}, {event.location}</span>
                </div>
              </div>

              {event.waitlistCount && (
                <div className="flex items-center gap-2 text-sm text-accent">
                  <Users className="h-4 w-4" />
                  <span>{event.waitlistCount} people on the waitlist</span>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <h2 className="font-heading font-semibold text-lg mb-2">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">{event.longDescription}</p>
              </div>
            </div>
          </div>

          {/* Right: Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold text-lg">
                {event.soldOut ? "Sold Out" : "Select Tickets"}
              </h2>

              {event.soldOut ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">This event is sold out. Join the waitlist to be notified if spots open up.</p>
                  <Button className="w-full" onClick={() => setWaitlistOpen(true)}>
                    Join Waitlist
                  </Button>
                </div>
              ) : (
                <>
                  {event.tickets.map((ticket) => {
                    const qty = quantities[ticket.id] || 0;
                    const unavailable = ticket.available === 0;

                    return (
                      <div key={ticket.id} className="p-4 rounded-md border border-border bg-background space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{ticket.name}</p>
                            <p className="text-xs text-muted-foreground">{ticket.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-heading font-bold text-primary">${ticket.price}</span>
                            {ticket.originalPrice && (
                              <span className="block text-xs text-muted-foreground line-through">${ticket.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        {ticket.originalPrice && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            50% OFF
                          </span>
                        )}
                        {unavailable ? (
                          <p className="text-xs text-destructive">Sold out</p>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQty(ticket.id, -1)}
                              className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:border-primary/50 transition-colors disabled:opacity-30"
                              disabled={qty === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm">{qty}</span>
                            <button
                              onClick={() => updateQty(ticket.id, 1)}
                              className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:border-primary/50 transition-colors disabled:opacity-30"
                              disabled={qty >= 10}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <span className="text-xs text-muted-foreground ml-auto">{ticket.available} left</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {totalItems > 0 && (
                    <div className="pt-4 border-t border-border space-y-3">
                      {hasDepositTickets && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={depositMode}
                            onChange={(e) => setDepositMode(e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-muted-foreground">Pay 50% deposit now (${depositAmount.toFixed(2)})</span>
                        </label>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{totalItems} ticket{totalItems > 1 ? "s" : ""}</span>
                        <div className="text-right">
                          <span className="font-heading font-bold text-lg">
                            ${depositMode ? depositAmount.toFixed(2) : totalPrice.toFixed(2)}
                          </span>
                          {depositMode && (
                            <span className="block text-xs text-muted-foreground">
                              ${depositAmount.toFixed(2)} due after event
                            </span>
                          )}
                        </div>
                      </div>
                      <Button className="w-full" size="lg" onClick={handleCheckout}>
                        {depositMode ? "Pay Deposit" : "Checkout"}
                      </Button>
                    </div>
                  )}

                  {totalItems === 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">Select tickets above to continue</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        eventTitle={event.title}
      />
    </div>
  );
};

export default EventDetail;
