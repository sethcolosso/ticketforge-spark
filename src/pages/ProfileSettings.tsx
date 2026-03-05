import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { DbProfile } from "@/types/database";

const ProfileSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        const p = data as DbProfile;
        setFirstName(p.first_name || "");
        setLastName(p.last_name || "");
        setPhone(p.phone || "");
      }
    };
    load();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq('id', user.id);
    // Also update auth metadata
    await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed." });
    }
  };

  if (authLoading || !user) return <div className="py-24 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-xl">
        <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-heading font-bold mb-8">Profile Settings</h1>

        {/* Profile Info */}
        <form onSubmit={handleSaveProfile} className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h2 className="font-heading font-semibold">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user.email || ""} disabled className="opacity-60" />
          </div>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>

        {/* Password */}
        <form onSubmit={handleChangePassword} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading font-semibold">Change Password</h2>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" variant="outline" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
