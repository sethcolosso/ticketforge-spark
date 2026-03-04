import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import type { Event } from "@/data/events";

const EventCard = ({ event }: { event: Event }) => {
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const minPrice = Math.min(...event.tickets.map((t) => t.price));
  const minOriginal = event.tickets.find((t) => t.originalPrice)?.originalPrice;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:box-glow"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="text-xs bg-secondary/80 backdrop-blur-sm">
            {event.category}
          </Badge>
          <StatusBadge status={event.status} />
        </div>
        {event.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="text-xs bg-primary text-primary-foreground">Featured</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-heading font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span>{formattedDate}</span>
            <Clock className="h-3.5 w-3.5 text-primary ml-2" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{event.venue}, {event.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {event.soldOut ? (
              <span className="text-sm text-muted-foreground">Sold out</span>
            ) : (
              <>
                <span className="text-sm font-heading font-bold text-primary">From ${minPrice}</span>
                {minOriginal && (
                  <span className="text-xs text-muted-foreground line-through">${minOriginal}</span>
                )}
              </>
            )}
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline">
            {event.soldOut ? "Join Waitlist" : "Get Tickets →"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
