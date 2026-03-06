import { useState, useEffect } from "react";
import { Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

const AdminUserManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  const handleDeleteUser = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will remove their profile and roles. The auth account must be removed separately from the backend panel.")) return;

    // Delete roles and profile (orders remain for record-keeping)
    await (supabase as any).from('user_roles').delete().eq('user_id', profileId);
    await (supabase as any).from('waitlist').delete().eq('user_id', profileId);
    const { error } = await (supabase as any).from('profiles').delete().eq('id', profileId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User profile deleted", description: "To fully remove their login, delete their auth account from the backend panel." });
      fetchProfiles();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-8">
      <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
        <UserX className="h-5 w-5 text-primary" /> Registered Users ({profiles.length})
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        To fully delete a user's login credentials, go to your backend panel after removing their profile here.
      </p>
      {profiles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No registered users.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-background">
              <div>
                <p className="text-sm font-medium">
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {p.id.slice(0, 8)}... · Joined {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1" onClick={() => handleDeleteUser(p.id)}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
