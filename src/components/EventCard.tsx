import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Clock, TrendingUp, Flame, Users, Timer, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DbEvent } from "@/types/database";
import { formatCurrency } from "@/lib/currency";

const getCountdown = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return null;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

const getDemandIndicator = (tickets: DbEvent["ticket_types"]) => {
  if (!tickets || tickets.length === 0) return null;
  const totalAvail = tickets.reduce((s, t) => s + t.quantity_available, 0);
  const totalSold = tickets.reduce((s, t) => s + t.quantity_sold, 0);
  if (totalAvail === 0) return null;
  const ratio = totalSold / totalAvail;
  if (ratio >= 0.9) return { label: "Almost Gone", color: "bg-destructive text-destructive-foreground" };
  if (ratio >= 0.7) return { label: "Selling Fast", color: "bg-orange-500 text-white" };
  if (ratio >= 0.4) return { label: "High Demand", color: "bg-yellow-500 text-black" };
  return null;
};

const EventCard = ({ event }: { event: DbEvent & { seller_verified?: boolean } }) => {
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const tickets = event.ticket_types || [];
  const minPrice = tickets.length > 0 ? Math.min(...tickets.map(t => Number(t.price))) : 0;
  const soldOut = tickets.length > 0 && tickets.every(t => t.quantity_sold >= t.quantity_available);
  const totalSold = tickets.reduce((s, t) => s + t.quantity_sold, 0);
  const countdown = getCountdown(event.date);
  const demand = getDemandIndicator(tickets);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:box-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs bg-secondary/80 backdrop-blur-sm">{event.category}</Badge>
          {soldOut && <Badge variant="destructive" className="text-xs">Sold Out</Badge>}
          {demand && !soldOut && (
            <Badge className={`text-xs ${demand.color}`}>
              <Flame className="h-3 w-3 mr-1" />{demand.label}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {event.is_featured && (
            <Badge className="text-xs bg-primary text-primary-foreground">Featured</Badge>
          )}
          {countdown && (
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm border-primary/30">
              <Timer className="h-3 w-3 mr-1" />{countdown}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <h3 className="font-heading font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {event.title}
          </h3>
          {event.seller_verified && (
            <BadgeCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span>{formattedDate}</span>
            {event.time && (
              <>
                <Clock className="h-3.5 w-3.5 text-primary ml-2" />
                <span>{event.time}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{event.venue}, {event.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {soldOut ? "Sold out" : tickets.length > 0 ? `From ${formatCurrency(minPrice)}` : "Free"}
            </span>
            {totalSold > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />{totalSold} bought
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline">
            {soldOut ? "Join Waitlist" : "Get Tickets →"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
