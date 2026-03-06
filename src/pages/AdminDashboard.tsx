import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, Clock, Users, Package, DollarSign, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent, DbOrder } from "@/types/database";
import AdminEventForm from "@/components/admin/AdminEventForm";
import AdminEventList from "@/components/admin/AdminEventList";
import AdminOrderList from "@/components/admin/AdminOrderList";
import AdminUserManager from "@/components/admin/AdminUserManager";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [userCount, setUserCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

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
      .from('events').update({ status: 'approved' }).eq('id', eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event approved!" });
      fetchData();
    }
  };

  const handleReject = async (eventId: string) => {
    const { error } = await (supabase as any)
      .from('events').update({ status: 'rejected' }).eq('id', eventId);
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage events, users, and platform</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowUsers(!showUsers); setShowForm(false); }} className="gap-2">
              <Users className="h-4 w-4" /> {showUsers ? "Hide Users" : "Manage Users"}
            </Button>
            <Button size="sm" onClick={() => { setShowForm(!showForm); setShowUsers(false); }} className="gap-2">
              <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Post Event"}
            </Button>
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

        {/* Admin Post Event Form */}
        {showForm && <AdminEventForm userId={user!.id} onSuccess={() => { setShowForm(false); fetchData(); }} />}

        {/* User Management */}
        {showUsers && <AdminUserManager />}

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

        <AdminEventList
          events={filteredEvents}
          tab={tab}
          onApprove={handleApprove}
          onReject={handleReject}
          onToggleFeatured={handleToggleFeatured}
        />

        <AdminOrderList orders={orders} />
      </div>
    </div>
  );
};

export default AdminDashboard;
