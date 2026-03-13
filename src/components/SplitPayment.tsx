import { useState } from "react";
import { Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";

interface SplitPaymentProps {
  orderId: string;
  totalAmount: number;
  eventTitle: string;
}

const SplitPayment = ({ orderId, totalAmount, eventTitle }: SplitPaymentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [numSplits, setNumSplits] = useState(2);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const perPerson = totalAmount / numSplits;

  const handleCreateSplit = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const { data, error } = await (supabase as any)
        .from("split_payments")
        .insert({
          order_id: orderId,
          inviter_id: user.id,
          total_amount: totalAmount,
          num_splits: numSplits,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      setShareCode(data.share_code);

      // Add inviter's contribution
      await (supabase as any).from("split_payment_contributions").insert({
        split_id: data.id,
        user_id: user.id,
        amount: perPerson,
        status: "paid",
      });

      toast({ title: "Split created!", description: "Share the code with your friends." });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create split.", variant: "destructive" });
    }
    setCreating(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/split/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" /> Split Payment
      </h3>

      {!shareCode ? (
        <>
          <p className="text-xs text-muted-foreground">Split the cost of your tickets with friends</p>
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Split between</Label>
            <Input
              type="number"
              min={2}
              max={10}
              value={numSplits}
              onChange={(e) => setNumSplits(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">people</span>
          </div>
          <p className="text-sm">
            {formatCurrency(perPerson)} <span className="text-muted-foreground">per person</span>
          </p>
          <Button size="sm" onClick={handleCreateSplit} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Split"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Share this link with {numSplits - 1} friend{numSplits > 2 ? "s" : ""}</p>
          <div className="flex gap-2">
            <Input readOnly value={`${window.location.origin}/split/${shareCode}`} className="text-xs font-mono" />
            <Button size="icon" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each person pays {formatCurrency(perPerson)} via M-Pesa
          </p>
        </>
      )}
    </div>
  );
};

export default SplitPayment;
