import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Ticket, User, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  cancelTicketOrder,
  fetchTicketOrdersForUser,
  isOrderCancelable,
  type TicketOrder,
} from "@/lib/ticketOrders";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const userOrders = await fetchTicketOrdersForUser(user.id);
        setOrders(userOrders);
      } catch (error) {
        toast({
          title: "Unable to Load Orders",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [user, toast]);

  const meta = user?.user_metadata || {};
  const displayName = user ? ([meta.first_name, meta.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "User") : "";

  if (loading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totals = useMemo(() => {
    const upcoming = orders.filter(o => o.status === "confirmed" && o.events && new Date(o.events.date) >= new Date()).length;
    const ticketsPurchased = orders
      .filter(o => o.status === "confirmed")
      .reduce((sum, o) => sum + (o.order_items || []).reduce((s, i) => s + i.quantity, 0), 0);
    const totalSpent = orders
      .filter(o => o.status === "confirmed")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    return { upcoming, ticketsPurchased, totalSpent };
  }, [orders]);

  const handleCancelOrder = async (order: TicketOrder) => {
    if (!user) return;
    setCancellingOrderId(order.id);
    try {
      const updated = await cancelTicketOrder(order, user.id);
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      toast({ title: "Order Cancelled", description: `Order has been cancelled.` });
    } catch (error) {
      toast({ title: "Cancellation Failed", description: error instanceof Error ? error.message : "Unable to cancel.", variant: "destructive" });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Upcoming Events", value: String(totals.upcoming), icon: CalendarDays },
            { label: "Tickets Purchased", value: String(totals.ticketsPurchased), icon: Ticket },
            { label: "Total Spent", value: formatCurrency(totals.totalSpent), icon: User },
          ].map(stat => (
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

        <h2 className="text-xl font-heading font-bold mb-4">My Tickets</h2>
        {ordersLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading your ticket orders...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">You have not purchased any tickets yet.</p>
            <Link to="/events"><Button variant="outline">Find Events</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const items = order.order_items || [];
              const ticketCount = items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={order.id} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
                  {order.events?.image_url && (
                    <img src={order.events.image_url} alt={order.events.title} className="w-full sm:w-32 h-24 object-cover rounded-md" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading font-semibold">{order.events?.title || "Unknown Event"}</h3>
                      <Badge variant={order.status === "cancelled" ? "outline" : "secondary"} className="text-xs capitalize">{order.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {order.events?.date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(order.events.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {order.events?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.events.location}
                        </span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {items.map(i => `${i.quantity}x ${i.ticket_types?.name || "Ticket"}`).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {ticketCount} ticket{ticketCount > 1 ? "s" : ""} · {formatCurrency(Number(order.total_amount))}
                        </span>
                        {isOrderCancelable(order) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={cancellingOrderId === order.id}>
                                {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the order as cancelled. Cancelled tickets cannot be used for event entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelOrder(order)}>Confirm Cancellation</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/events"><Button variant="outline">Browse More Events</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
