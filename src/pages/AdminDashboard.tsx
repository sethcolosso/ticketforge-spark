import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, Clock, Users, Package, DollarSign, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent, DbOrder } from "@/types/database";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) { navigate("/login"); return; }
      if (!isAdmin) { navigate("/dashboard"); return; }
    }
  }, [authLoading, rolesLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    const { data: evts } = await (supabase as any)
      .from('events')
      .select('*, ticket_types(*)')
      .order('created_at', { ascending: false });
    setEvents(evts || []);

    const { data: ords } = await (supabase as any)
      .from('orders')
      .select('*, events(*), order_items(*, ticket_types(*))')
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(ords || []);

    const { count } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    setUserCount(count || 0);
  };

  const handleApprove = async (eventId: string) => {
    const { error } = await (supabase as any)
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event approved!", description: "It will now appear in public listings." });
      fetchData();
    }
  };

  const handleReject = async (eventId: string) => {
    const { error } = await (supabase as any)
      .from('events')
      .update({ status: 'rejected' })
      .eq('id', eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event rejected." });
      fetchData();
    }
  };

  const handleToggleFeatured = async (eventId: string, current: boolean) => {
    await (supabase as any).from('events').update({ is_featured: !current }).eq('id', eventId);
    fetchData();
  };

  const filteredEvents = tab === 'all' ? events : events.filter(e => e.status === tab);
  const pendingCount = events.filter(e => e.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'confirmed').reduce((s, o) => s + Number(o.total_amount), 0);

  if (authLoading || rolesLoading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage events, users, and platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: userCount, icon: Users },
            { label: "Total Events", value: events.length, icon: Package },
            { label: "Pending Approval", value: pendingCount, icon: Clock },
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>
              {t} {t === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {/* Events */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
            <p>No {tab} events.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {filteredEvents.map(evt => (
              <div key={evt.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {evt.image_url && (
                    <img src={evt.image_url} alt={evt.title} className="w-full sm:w-32 h-24 object-cover rounded-md" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-semibold">{evt.title}</h3>
                      <Badge variant="secondary" className="text-xs capitalize">{evt.status}</Badge>
                      {evt.is_featured && <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{evt.venue}, {evt.location} · {new Date(evt.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{evt.category} · {(evt.ticket_types || []).length} ticket types · Cap: {evt.capacity || '∞'}</p>
                    {evt.description && <p className="text-xs text-muted-foreground line-clamp-2">{evt.description}</p>}
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    {evt.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(evt.id)} className="gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(evt.id)} className="gap-1">
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {evt.status === 'rejected' && (
                      <Button size="sm" variant="outline" onClick={() => handleApprove(evt.id)}>Approve</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleToggleFeatured(evt.id, evt.is_featured)}
                      title={evt.is_featured ? 'Remove featured' : 'Mark as featured'}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        <h2 className="text-xl font-heading font-bold mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-border rounded-lg bg-card">
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 20).map(order => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{order.events?.title || 'Unknown Event'}</p>
                  <p className="text-xs text-muted-foreground">
                    Order {order.id.slice(0, 8)} · {(order.order_items || []).reduce((s, i) => s + i.quantity, 0)} tickets · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-primary">${Number(order.total_amount).toFixed(2)}</p>
                  <Badge variant="secondary" className="text-xs capitalize">{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
