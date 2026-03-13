import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Package, TrendingUp, Eye, Clock, CheckCircle2, XCircle, Trash2, Upload, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import type { DbEvent, DbOrder } from "@/types/database";

const SellerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSeller, isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Music");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ticketTypes, setTicketTypes] = useState([{ name: "General Admission", price: "0", quantity: "100", description: "" }]);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) { navigate("/login"); return; }
      if (!isSeller && !isAdmin) { navigate("/dashboard"); return; }
    }
  }, [authLoading, rolesLoading, user, isSeller, isAdmin, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: evts } = await (supabase as any)
      .from('events')
      .select('*, ticket_types(*)')
      .eq('seller_id', user!.id)
      .order('created_at', { ascending: false });
    setEvents(evts || []);

    const { data: ords } = await (supabase as any)
      .from('orders')
      .select('*, events!inner(*), order_items(*, ticket_types(*))')
      .eq('events.seller_id', user!.id)
      .order('created_at', { ascending: false });
    setOrders(ords || []);
  };

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const slug = generateSlug(title) + '-' + Date.now().toString(36);
    const { data: evt, error } = await (supabase as any)
      .from('events')
      .insert({
        seller_id: user.id, title, slug, description, date, time, venue, location, city, category,
        capacity: capacity ? parseInt(capacity) : null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error || !evt) {
      toast({ title: "Error creating event", description: error?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const tickets = ticketTypes.filter(t => t.name).map(t => ({
      event_id: evt.id, name: t.name, description: t.description || null,
      price: parseFloat(t.price) || 0, quantity_available: parseInt(t.quantity) || 100,
    }));

    if (tickets.length > 0) {
      await (supabase as any).from('ticket_types').insert(tickets);
    }

    toast({ title: "Event submitted!", description: "It will appear in listings once approved by admin." });
    setShowForm(false);
    resetForm();
    setSubmitting(false);
    fetchData();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setDate(""); setTime(""); setVenue("");
    setLocation(""); setCity(""); setCategory("Music"); setCapacity(""); setImageUrl("");
    setTicketTypes([{ name: "General Admission", price: "0", quantity: "100", description: "" }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('event-images').upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path);
      setImageUrl(publicUrl);
      toast({ title: "Image uploaded!" });
    }
    setUploadingImage(false);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: "0", quantity: "100", description: "" }]);
  };

  const updateTicketType = (index: number, field: string, value: string) => {
    const updated = [...ticketTypes];
    (updated[index] as any)[field] = value;
    setTicketTypes(updated);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (s === 'rejected') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const totalRevenue = orders.filter(o => o.status === 'confirmed').reduce((s, o) => s + Number(o.total_amount), 0);
  const totalTicketsSold = orders.filter(o => o.status === 'confirmed')
    .flatMap(o => o.order_items || []).reduce((s, i) => s + i.quantity, 0);

  if (authLoading || rolesLoading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your events and track sales</p>
          </div>
          <div className="flex gap-2">
            <Link to="/scanner">
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" /> QR Scanner
              </Button>
            </Link>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Post New Event"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Events", value: String(events.length), icon: Package },
            { label: "Tickets Sold", value: String(totalTicketsSold), icon: TrendingUp },
            { label: "Revenue", value: formatCurrency(totalRevenue), icon: Package },
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

        {/* New Event Form */}
        {showForm && (
          <form onSubmit={handleSubmitEvent} className="rounded-lg border border-border bg-card p-6 space-y-4 mb-8">
            <h2 className="font-heading font-semibold text-lg">Create New Event</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Event Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Neon Nights Festival" /></div>
              <div>
                <Label>Category *</Label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Music", "Festival", "Art", "Sports", "Comedy", "Theater", "Food", "Tech", "Other"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
              <div><Label>Time</Label><Input value={time} onChange={e => setTime(e.target.value)} placeholder="8:00 PM" /></div>
              <div><Label>Venue *</Label><Input value={venue} onChange={e => setVenue(e.target.value)} required placeholder="The Grand Arena" /></div>
              <div><Label>Location *</Label><Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="Nairobi, Kenya" /></div>
              <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Nairobi" /></div>
              <div><Label>Capacity</Label><Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="500" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your event..." rows={3} /></div>
            <div>
              <Label>Event Image</Label>
              <div className="flex gap-2 items-center">
                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} disabled={uploadingImage} />
                {uploadingImage && <span className="text-xs text-muted-foreground">Uploading...</span>}
              </div>
              {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-20 w-32 object-cover rounded-md border border-border" />}
              <p className="text-xs text-muted-foreground mt-1">Or paste a URL:</p>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ticket Types</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTicketType} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Tier
                </Button>
              </div>
              {ticketTypes.map((tt, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border border-border bg-background">
                  <div className="col-span-4"><Label className="text-xs">Name</Label><Input value={tt.name} onChange={e => updateTicketType(i, 'name', e.target.value)} placeholder="VIP" /></div>
                  <div className="col-span-2"><Label className="text-xs">Price (KSh)</Label><Input type="number" step="1" value={tt.price} onChange={e => updateTicketType(i, 'price', e.target.value)} /></div>
                  <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" value={tt.quantity} onChange={e => updateTicketType(i, 'quantity', e.target.value)} /></div>
                  <div className="col-span-3"><Label className="text-xs">Description</Label><Input value={tt.description} onChange={e => updateTicketType(i, 'description', e.target.value)} placeholder="Optional" /></div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTicketType(i)} disabled={ticketTypes.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Event for Approval"}
            </Button>
          </form>
        )}

        {/* My Events */}
        <h2 className="text-xl font-heading font-bold mb-4">My Events</h2>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No events yet. Post your first event!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {events.map(evt => (
              <div key={evt.id} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
                {evt.image_url && <img src={evt.image_url} alt={evt.title} className="w-full sm:w-28 h-20 object-cover rounded-md" />}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(evt.status)}
                    <h3 className="font-heading font-semibold">{evt.title}</h3>
                    <Badge variant="secondary" className="text-xs capitalize">{evt.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{evt.venue}, {evt.location} · {new Date(evt.date).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {(evt.ticket_types || []).length} ticket type{(evt.ticket_types || []).length !== 1 ? 's' : ''}
                    {' · '}{(evt.ticket_types || []).reduce((s, t) => s + t.quantity_sold, 0)} sold
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        <h2 className="text-xl font-heading font-bold mb-4">Recent Sales</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No sales yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 20).map(order => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{order.events?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(order.order_items || []).reduce((s, i) => s + i.quantity, 0)} tickets · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-primary">{formatCurrency(Number(order.total_amount))}</p>
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

export default SellerDashboard;
