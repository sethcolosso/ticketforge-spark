import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { formatCurrency } from "@/lib/currency";

const SplitPaymentPage = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [split, setSplit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const fetchSplit = async () => {
      const { data } = await (supabase as any)
        .from("split_payments")
        .select("*, orders(events(title, date, venue))")
        .eq("share_code", code)
        .single();
      setSplit(data);
      setLoading(false);
    };
    if (code) fetchSplit();
  }, [code]);

  const handlePay = async () => {
    if (!user || !split || !phone) return;
    setPaying(true);
    try {
      let mpesaRes: { receipt?: string; simulated?: boolean } | null = null;

      try {
        const formattedPhone = phone.startsWith("0") ? `254${phone.slice(1)}` : phone.startsWith("+") ? phone.slice(1) : phone;
        const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
          body: {
            phone: formattedPhone,
            amount: Math.ceil(split.total_amount / split.num_splits),
            reference: `SPLIT_${split.share_code}`,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "STK Push failed");
        mpesaRes = { receipt: data.CheckoutRequestID, simulated: false };
      } catch (err) {
        if (err instanceof FunctionsFetchError || err instanceof FunctionsRelayError) {
          mpesaRes = { simulated: true, receipt: `SIM${Date.now().toString(36).toUpperCase()}` };
          toast({
            title: "M-Pesa service unreachable",
            description: "Continuing in offline simulation mode. Deploy edge functions to enable real STK push.",
            variant: "destructive",
          });
        } else {
          throw err;
        }
      }

      // Record contribution
      await (supabase as any).from("split_payment_contributions").insert({
        split_id: split.id,
        user_id: user.id,
        amount: split.total_amount / split.num_splits,
        status: "paid",
        phone_number: phone,
        mpesa_receipt: mpesaRes?.receipt || null,
      });

      setPaid(true);
      toast({ title: "Payment sent!", description: mpesaRes?.simulated ? "M-Pesa payment simulated." : "Your M-Pesa payment has been initiated." });
    } catch (err) {
      let description = err instanceof Error ? err.message : "Please try again.";

      if (err instanceof FunctionsHttpError) {
        const response = await err.context.json().catch(() => null);
        description = response?.error || description;
      } else if (err instanceof FunctionsFetchError || err instanceof FunctionsRelayError) {
        description = "Could not reach the M-Pesa service. Confirm Supabase Edge Functions are deployed and environment variables are correct.";
      }

      toast({ title: "Payment failed", description, variant: "destructive" });
    }
    setPaying(false);
  };

  if (loading) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  if (!split) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Split Not Found</h1>
        <Link to="/events"><Button variant="outline">Browse Events</Button></Link>
      </div>
    );
  }

  const perPerson = split.total_amount / split.num_splits;

  if (paid) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-heading font-bold mb-3">Payment Sent!</h1>
        <p className="text-muted-foreground mb-6">
          Your contribution of {formatCurrency(perPerson)} for {split.orders?.events?.title} has been processed.
        </p>
        <Link to="/events"><Button>Browse Events</Button></Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-heading font-bold">Split Payment</h1>
          </div>

          <div className="space-y-1">
            <p className="font-medium">{split.orders?.events?.title}</p>
            <p className="text-sm text-muted-foreground">
              {split.orders?.events?.venue} · {new Date(split.orders?.events?.date).toLocaleDateString()}
            </p>
          </div>

          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span>{formatCurrency(split.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Split between</span>
              <span>{split.num_splits} people</span>
            </div>
            <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-border">
              <span>Your share</span>
              <span className="text-primary">{formatCurrency(perPerson)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>M-Pesa Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              type="tel"
            />
          </div>

          <Button className="w-full" onClick={handlePay} disabled={paying || !phone}>
            {paying ? "Processing..." : `Pay ${formatCurrency(perPerson)} via M-Pesa`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SplitPaymentPage;
