import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also check if user has an active session (already clicked the link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/login");
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
          <h1 className="text-2xl font-heading font-bold mt-4">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
        </div>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" required placeholder="••••••••" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              This link may be invalid or expired. Please request a new password reset.
            </p>
            <Link to="/forgot-password">
              <Button variant="outline" className="w-full">Request new link</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
