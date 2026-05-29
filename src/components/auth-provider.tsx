"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFinanceStore } from "@/store/finance-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadFromSupabase = useFinanceStore((s) => s.loadFromSupabase);
  const clearSupabaseData = useFinanceStore((s) => s.clearSupabaseData);

  useEffect(() => {
    const supabase = createClient();

    // Load data for already-authenticated session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadFromSupabase(user.id);
    });

    // React to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        loadFromSupabase(session.user.id);
      } else if (event === "SIGNED_OUT") {
        clearSupabaseData();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromSupabase, clearSupabaseData]);

  return <>{children}</>;
}
