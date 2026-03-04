import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Ticket, User, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { events } from "@/data/events";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

// Mock purchased tickets for demo
const purchasedTickets = [
  { event: events[0], ticketType: "VIP Experience", quantity: 2, orderDate: "2026-02-20", orderId: "UP-2026-001" },
  { event: events[2], ticketType: "General Entry", quantity: 1, orderDate: "2026-02-15", orderId: "UP-2026-002" },
];

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="py-24 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!user) return null;

  const meta = user.user_metadata || {};
  const displayName = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "User";
  const displayEmail = user.email || "";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Upcoming Events", value: "2", icon: CalendarDays },
            { label: "Tickets Purchased", value: "3", icon: Ticket },
            { label: "Total Spent", value: "$270", icon: User },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Tickets */}
        <h2 className="text-xl font-heading font-bold mb-4">My Tickets</h2>
        <div className="space-y-4">
          {purchasedTickets.map((purchase) => (
            <div key={purchase.orderId} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
              <img
                src={purchase.event.image}
                alt={purchase.event.title}
                className="w-full sm:w-32 h-24 object-cover rounded-md"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-heading font-semibold">{purchase.event.title}</h3>
                  <Badge variant="secondary" className="text-xs">{purchase.ticketType}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(purchase.event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {purchase.event.location}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground font-mono">{purchase.orderId}</span>
                  <span className="text-xs text-muted-foreground">{purchase.quantity} ticket{purchase.quantity > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Browse More */}
        <div className="mt-10 text-center">
          <Link to="/events">
            <Button variant="outline">Browse More Events</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
