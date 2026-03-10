import { useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Check your email", description: "We sent you a password reset link." });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-heading font-bold text-2xl mb-4">
            <Ticket className="h-7 w-7" />
            URBANPUNK
          </Link>
          <h1 className="text-2xl font-heading font-bold mt-4">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "Check your inbox for a reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and click the link to set a new password.
            </p>
            <Button variant="outline" onClick={() => setSent(false)} className="w-full">Send again</Button>
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
