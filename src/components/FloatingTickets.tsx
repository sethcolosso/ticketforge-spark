import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFeaturedEvents } from "@/data/events";

const FloatingTickets = () => {
  const featured = getFeaturedEvents().slice(0, 3);

  return (
    <div className="flex flex-wrap justify-center gap-6 mt-12">
      {featured.map((event, i) => {
        const minPrice = Math.min(...event.tickets.map((t) => t.price));
        const minOriginal = event.tickets[0]?.originalPrice;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
              rotateX: 0,
            }}
            transition={{
              delay: 0.4 + i * 0.15,
              duration: 3,
              y: { repeat: Infinity, duration: 3 + i * 0.5, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.05, y: -12 }}
            className="w-64 rounded-lg border border-border bg-card/90 backdrop-blur-md p-4 cursor-pointer hover:border-primary/50 transition-colors"
            style={{ perspective: 800 }}
          >
            <Link to={`/events/${event.slug}`} className="space-y-3">
              <div className="rounded-md overflow-hidden aspect-[16/10]">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-heading font-semibold text-sm leading-tight line-clamp-1">
                {event.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 text-primary" />
                {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                <MapPin className="h-3 w-3 text-primary ml-1" />
                {event.location}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-primary text-sm">${minPrice}</span>
                  {minOriginal && (
                    <span className="text-xs text-muted-foreground line-through">${minOriginal}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                  50% OFF
                </span>
              </div>
              <Button size="sm" className="w-full text-xs">
                Buy Tickets
              </Button>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingTickets;
