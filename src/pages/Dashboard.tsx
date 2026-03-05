import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Ticket, User, LogOut, MapPin, Settings, Store, Shield, XCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { DbOrder, DbWaitlist, DbProfile } from "@/types/database";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { isSeller, isAdmin } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [waitlist, setWaitlist] = useState<DbWaitlist[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    // Fetch profile
    const { data: prof } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();
    setProfile(prof);

    // Fetch orders with event and item details
    const { data: ords } = await (supabase as any)
      .from('orders')
      .select('*, events(*), order_items(*, ticket_types(*))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setOrders(ords || []);

    // Fetch waitlist
    const { data: wl } = await (supabase as any)
      .from('waitlist')
      .select('*, events(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setWaitlist(wl || []);

    setLoadingData(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await (supabase as any)
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', user!.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ticket cancelled", description: "Your order has been cancelled." });
      fetchData();
    }
  };

  const handleLeaveWaitlist = async (waitlistId: string) => {
    const { error } = await (supabase as any)
      .from('waitlist')
      .delete()
      .eq('id', waitlistId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed from waitlist" });
      fetchData();
    }
  };

  if (loading || !user) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0]
    : user.email?.split("@")[0] || "User";

  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const totalSpent = confirmedOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalTickets = confirmedOrders.flatMap(o => o.order_items || []).reduce((s, i) => s + i.quantity, 0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/profile-settings">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                <Settings className="h-4 w-4" /> Settings
              </Button>
            </Link>
            {isSeller && (
              <Link to="/seller">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <Store className="h-4 w-4" /> Seller
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <Shield className="h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Active Tickets", value: totalTickets, icon: Ticket },
            { label: "Orders", value: confirmedOrders.length, icon: CalendarDays },
            { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: User },
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

        {/* My Tickets */}
        <h2 className="text-xl font-heading font-bold mb-4">My Tickets</h2>
        {loadingData ? (
          <div className="text-center py-8 text-muted-foreground">Loading your tickets...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No tickets yet. Browse events to get started!</p>
            <Link to="/events"><Button variant="outline">Browse Events</Button></Link>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {orders.map(order => (
              <div key={order.id} className={`rounded-lg border bg-card p-4 flex flex-col sm:flex-row gap-4 ${
                order.status === 'cancelled' ? 'border-destructive/30 opacity-60' : 'border-border'
              }`}>
                {order.events?.image_url && (
                  <img src={order.events.image_url} alt={order.events.title} className="w-full sm:w-32 h-24 object-cover rounded-md" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading font-semibold">{order.events?.title || 'Event'}</h3>
                    <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs capitalize">{order.status}</Badge>
                  </div>
                  {order.events && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(order.events.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.events.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      {(order.order_items || []).map(item => (
                        <span key={item.id} className="mr-3">{item.quantity}x {item.ticket_types?.name || 'Ticket'}</span>
                      ))}
                    </div>
                    <span className="font-heading font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  {order.status === 'confirmed' && (
                    <div className="pt-2">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1 h-7 text-xs"
                        onClick={() => handleCancelOrder(order.id)}>
                        <XCircle className="h-3 w-3" /> Cancel Ticket
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <>
            <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> My Waitlist
            </h2>
            <div className="space-y-3 mb-10">
              {waitlist.map(w => (
                <div key={w.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{w.events?.title || 'Event'}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(w.created_at).toLocaleDateString()} · {w.events?.location}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleLeaveWaitlist(w.id)}>
                    Leave
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center">
          <Link to="/events"><Button variant="outline">Browse More Events</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
