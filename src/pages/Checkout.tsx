import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createTicketOrder } from "@/lib/ticketOrders";
import { formatCurrency } from "@/lib/currency";
import SplitPayment from "@/components/SplitPayment";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout");
    if (raw) setData(JSON.parse(raw));
  }, []);

  // Pre-fill email if logged in
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

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
        <p className="text-muted-foreground mb-2">
          Your tickets for <span className="text-foreground font-medium">{data.event.title}</span> have been reserved.
        </p>
        {orderCode && <p className="text-sm text-muted-foreground mb-4">Order ID: <span className="font-mono text-foreground">{orderCode}</span></p>}

        {!user && (
          <p className="text-sm text-muted-foreground mb-4">
            Sign up with <span className="font-medium text-foreground">{email}</span> to view your tickets anytime in your dashboard.
          </p>
        )}

        {orderId && (
          <div className="mb-6">
            <SplitPayment orderId={orderId} totalAmount={data.total + data.total * 0.03} eventTitle={data.event.title} />
          </div>
        )}

        <div className="flex gap-4 justify-center">
          {user ? (
            <Link to="/dashboard"><Button>View My Tickets</Button></Link>
          ) : (
            <Link to="/register"><Button>Sign Up to Track Orders</Button></Link>
          )}
          <Link to="/events"><Button variant="outline">Browse More Events</Button></Link>
        </div>
      </div>
    );
  }

  const fees = data.total * 0.03;
  const grandTotal = data.total + fees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({ title: "Phone required", description: "Enter your M-Pesa phone number.", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Email required", description: "Enter your email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("0")
        ? `254${phone.slice(1)}`
        : phone.startsWith("+")
        ? phone.slice(1)
        : phone;

      const reference = "URBANPUNK_" + Date.now();

      const { data: stkResponse, error: stkError } = await supabase.functions.invoke("mpesa-stk-push", {
        body: { phone: formattedPhone, amount: Math.ceil(grandTotal), reference },
      });

      if (stkError) throw new Error(stkError.message || "Failed to initiate M-Pesa payment");
      if (!stkResponse?.success) throw new Error(stkResponse?.error || "M-Pesa STK Push failed");

      toast({
        title: "M-Pesa Prompt Sent!",
        description: "Check your phone and enter your M-Pesa PIN to complete payment.",
      });

      // Create order - pass userId if logged in, otherwise guest email
      const order = await createTicketOrder(user?.id || null, data, email);
      setOrderCode(order.order_code);
      setOrderId(order.id);

      await (supabase as any).from("mpesa_payments").insert({
        order_id: order.id,
        phone: formattedPhone,
        amount: Math.ceil(grandTotal),
        checkout_request_id: stkResponse.CheckoutRequestID || null,
        merchant_request_id: stkResponse.MerchantRequestID || null,
        status: "pending",
      });

      setSubmitted(true);
      sessionStorage.removeItem("checkout");

      toast({ title: "Payment Initiated!", description: "Complete the M-Pesa prompt on your phone. Your tickets are reserved." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Payment could not be completed. Please try again.";
      toast({ title: "Payment Failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
                <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" required placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" required placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                {!user && <p className="text-xs text-muted-foreground mt-1">If you sign up later with this email, your tickets will appear in your dashboard.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" /> Lipa na M-Pesa
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your Safaricom M-Pesa number. You'll receive an STK push prompt on your phone to complete the payment.
              </p>
              <div>
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input id="phone" type="tel" required placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Format: 07XXXXXXXX or 254XXXXXXXXX</p>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending STK Push...</span>
              ) : (
                `Pay ${formatCurrency(grandTotal)} via Lipa na M-Pesa`
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Secure checkout — powered by Safaricom M-Pesa
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
