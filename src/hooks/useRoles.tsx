import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      setRoles((data || []).map((r: any) => r.role));
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isSeller: roles.includes('seller'),
    isBuyer: roles.includes('buyer'),
  };
};
