import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import urbanpunkLogo from "@/assets/urbanpunk-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const message = error.message.toLowerCase();
      setShowResendConfirmation(message.includes("confirm") || message.includes("not confirmed"));
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      setShowResendConfirmation(false);
      toast({ title: "Welcome back!", description: "You have been logged in." });
      navigate("/dashboard");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Enter your email first.", variant: "destructive" });
      return;
    }

    setResendingConfirmation(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setResendingConfirmation(false);

    if (error) {
      toast({ title: "Resend failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Confirmation sent",
      description: "Check inbox/spam for the confirmation email.",
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-heading font-bold text-2xl mb-4">
            <img src={urbanpunkLogo} alt="URBANPUNK" className="h-10 w-auto rounded" />
            URBANPUNK
          </Link>
          <h1 className="text-2xl font-heading font-bold mt-4">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          {showResendConfirmation && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendingConfirmation}
              onClick={handleResendConfirmation}
            >
              {resendingConfirmation ? "Sending confirmation..." : "Resend confirmation email"}
            </Button>
          )}
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
