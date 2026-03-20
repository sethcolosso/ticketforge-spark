import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, role },
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      setLoading(false);
      toast({ title: "Account created!", description: "Welcome to URBANPUNK. Check your email to confirm." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "An error occurred", variant: "destructive" });
      setLoading(false);
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
          <h1 className="text-2xl font-heading font-bold mt-4">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start selling or buying tickets today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" required placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" required placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required placeholder="••••••••" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>I want to</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => setRole('buyer')}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  role === 'buyer' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                🎟️ Buy Tickets
              </button>
              <button type="button" onClick={() => setRole('seller')}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  role === 'seller' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                🎪 Sell Tickets
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
