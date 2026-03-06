import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  onSuccess: () => void;
}

const AdminEventForm = ({ userId, onSuccess }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
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
  const [isFeatured, setIsFeatured] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([{ name: "General Admission", price: "0", quantity: "100", description: "" }]);

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: evt, error } = await (supabase as any)
      .from('events')
      .insert({
        seller_id: userId,
        title,
        slug: generateSlug(title),
        description,
        date,
        time,
        venue,
        location,
        city,
        category,
        capacity: capacity ? parseInt(capacity) : null,
        image_url: imageUrl || null,
        status: 'approved',
        is_featured: isFeatured,
      })
      .select()
      .single();

    if (error || !evt) {
      toast({ title: "Error creating event", description: error?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const tickets = ticketTypes.filter(t => t.name).map(t => ({
      event_id: evt.id,
      name: t.name,
      description: t.description || null,
      price: parseFloat(t.price) || 0,
      quantity_available: parseInt(t.quantity) || 100,
    }));

    if (tickets.length > 0) {
      await (supabase as any).from('ticket_types').insert(tickets);
    }

    toast({ title: "Event posted!", description: "It's now live in event listings." });
    setSubmitting(false);
    onSuccess();
  };

  const addTicketType = () => setTicketTypes([...ticketTypes, { name: "", price: "0", quantity: "100", description: "" }]);
  const updateTicketType = (i: number, field: string, value: string) => {
    const updated = [...ticketTypes];
    (updated[i] as any)[field] = value;
    setTicketTypes(updated);
  };
  const removeTicketType = (i: number) => { if (ticketTypes.length > 1) setTicketTypes(ticketTypes.filter((_, idx) => idx !== i)); };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4 mb-8">
      <h2 className="font-heading font-semibold text-lg">Post New Event (Auto-Approved)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>Event Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Event name" /></div>
        <div>
          <Label>Category *</Label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {["Music", "Festival", "Art", "Sports", "Comedy", "Theater", "Food", "Tech", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>Date *</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <div><Label>Time</Label><Input value={time} onChange={e => setTime(e.target.value)} placeholder="8:00 PM" /></div>
        <div><Label>Venue *</Label><Input value={venue} onChange={e => setVenue(e.target.value)} required placeholder="The Grand Arena" /></div>
        <div><Label>Location *</Label><Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="New York, NY" /></div>
        <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="New York" /></div>
        <div><Label>Capacity</Label><Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="500" /></div>
      </div>
      <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the event..." rows={3} /></div>
      <div><Label>Image URL</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} id="featured" className="rounded" />
        <Label htmlFor="featured">Featured Event</Label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Ticket Types</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTicketType} className="gap-1"><Plus className="h-3 w-3" /> Add Tier</Button>
        </div>
        {ticketTypes.map((tt, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border border-border bg-background">
            <div className="col-span-4"><Label className="text-xs">Name</Label><Input value={tt.name} onChange={e => updateTicketType(i, 'name', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs">Price ($)</Label><Input type="number" step="0.01" value={tt.price} onChange={e => updateTicketType(i, 'price', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" value={tt.quantity} onChange={e => updateTicketType(i, 'quantity', e.target.value)} /></div>
            <div className="col-span-3"><Label className="text-xs">Description</Label><Input value={tt.description} onChange={e => updateTicketType(i, 'description', e.target.value)} /></div>
            <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => removeTicketType(i)} disabled={ticketTypes.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Posting..." : "Post Event (Live Immediately)"}</Button>
    </form>
  );
};

export default AdminEventForm;
