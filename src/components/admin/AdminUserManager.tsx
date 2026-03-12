import { useState, useEffect } from "react";
import { Trash2, UserX, ShieldPlus, Store, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_verified: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminUserManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: profs }, { data: rls }] = await Promise.all([
      (supabase as any).from('profiles').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('user_roles').select('user_id, role'),
    ]);
    setProfiles(profs || []);
    setRoles(rls || []);
    setLoading(false);
  };

  const getUserRoles = (userId: string) => roles.filter(r => r.user_id === userId).map(r => r.role);

  const handleAddRole = async (userId: string, role: 'admin' | 'seller') => {
    const { error } = await (supabase as any).from('user_roles').insert({ user_id: userId, role });
    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already has this role", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: `${role} role added!` });
      fetchData();
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const { error } = await (supabase as any).from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${role} role removed` });
      fetchData();
    }
  };

  const handleToggleVerified = async (profileId: string, current: boolean) => {
    const { error } = await (supabase as any).from('profiles').update({ is_verified: !current }).eq('id', profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !current ? "Seller verified!" : "Verification removed" });
      fetchData();
    }
  };

  const handleDeleteUser = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will remove their profile and roles.")) return;
    await (supabase as any).from('user_roles').delete().eq('user_id', profileId);
    await (supabase as any).from('waitlist').delete().eq('user_id', profileId);
    const { error } = await (supabase as any).from('profiles').delete().eq('id', profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User profile deleted" });
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-8">
      <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
        <UserX className="h-5 w-5 text-primary" /> Registered Users ({profiles.length})
      </h2>
      {profiles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No registered users.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map(p => {
            const userRoles = getUserRoles(p.id);
            return (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-border bg-background gap-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                    {p.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {p.id.slice(0, 8)}... · Joined {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {userRoles.map(r => (
                      <Badge key={r} variant="secondary" className="text-xs capitalize cursor-pointer" onClick={() => handleRemoveRole(p.id, r)}>
                        {r} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {!userRoles.includes('admin') && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleAddRole(p.id, 'admin')}>
                      <ShieldPlus className="h-3 w-3" /> Make Admin
                    </Button>
                  )}
                  {!userRoles.includes('seller') && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleAddRole(p.id, 'seller')}>
                      <Store className="h-3 w-3" /> Make Seller
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className={`gap-1 text-xs ${p.is_verified ? 'border-primary/50' : ''}`} onClick={() => handleToggleVerified(p.id, p.is_verified)}>
                    <BadgeCheck className="h-3 w-3" /> {p.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1 text-xs" onClick={() => handleDeleteUser(p.id)}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
