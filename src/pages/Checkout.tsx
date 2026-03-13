import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createTicketOrder } from "@/lib/ticketOrders";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import SplitPayment from "@/components/SplitPayment";

interface CheckoutData {
  event: { id: string; slug: string; title: string; date: string; venue: string; location: string; image?: string };
  tickets: { ticket_type_id: string; name: string; price: number; quantity: number }[];
  total: number;
}

const Checkout = () => {
  const [data, setData] = useState<CheckoutData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout");
    if (raw) setData(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: "Login Required", description: "Please sign in to complete your purchase." });
      navigate("/login");
    }
  }, [authLoading, user, navigate, toast]);

  if (authLoading) return <div className="py-24 text-center text-muted-foreground">Loading checkout...</div>;

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">No Items in Cart</h1>
        <Link to="/events"><Button variant="outline">Browse Events</Button></Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-heading font-bold mb-3">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-2">Your tickets for <span className="text-foreground font-medium">{data.event.title}</span> have been reserved.</p>
        {orderCode && <p className="text-sm text-muted-foreground mb-4">Order ID: <span className="font-mono text-foreground">{orderCode}</span></p>}
        
        {orderId && (
          <div className="mb-6">
            <SplitPayment orderId={orderId} totalAmount={data.total + data.total * 0.03} eventTitle={data.event.title} />
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link to="/dashboard"><Button>View My Tickets</Button></Link>
          <Link to="/events"><Button variant="outline">Browse More Events</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!phone) {
      toast({ title: "Phone required", description: "Enter your M-Pesa phone number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Initiate M-Pesa STK push
      const formattedPhone = phone.startsWith("0") ? `254${phone.slice(1)}` : phone.startsWith("+") ? phone.slice(1) : phone;
      
      const { data: mpesaRes, error: mpesaErr } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone: formattedPhone,
          amount: Math.ceil(grandTotal),
          reference: `UP-${Date.now().toString(36).toUpperCase()}`,
        },
      });

      if (mpesaErr) throw mpesaErr;

      // Create order
      const order = await createTicketOrder(user.id, data);
      setOrderCode(order.order_code);
      setOrderId(order.id);
      setSubmitted(true);
      sessionStorage.removeItem("checkout");
      toast({ title: "Payment Initiated!", description: mpesaRes?.simulated ? "M-Pesa payment simulated. Tickets confirmed." : "Check your phone for the M-Pesa prompt." });
    } catch (error) {
      toast({ title: "Checkout Failed", description: error instanceof Error ? error.message : "Unable to complete.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fees = data.total * 0.03;
  const grandTotal = data.total + fees;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>
        <h1 className="text-3xl font-heading font-bold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" required placeholder="Jane" /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" required placeholder="Doe" /></div>
              </div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required placeholder="jane@example.com" /></div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" /> M-Pesa Payment
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your M-Pesa registered phone number. You'll receive an STK push to confirm payment.
              </p>
              <div>
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: 07XXXXXXXX or 254XXXXXXXXX</p>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={loading}>
              {loading ? "Processing..." : `Pay ${formatCurrency(grandTotal)} via M-Pesa`}
            </Button>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Secure checkout — powered by M-Pesa
            </p>
          </form>
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold">Order Summary</h2>
              <div>
                <p className="font-medium text-sm">{data.event.title}</p>
                <p className="text-xs text-muted-foreground">{data.event.venue}, {data.event.location}</p>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                {data.tickets.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.quantity}x {t.name}</span>
                    <span>{formatCurrency(t.price * t.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(data.total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service Fee (3%)</span><span>{formatCurrency(fees)}</span></div>
                <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
