"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DashboardHeader() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything until auth state is known, or when logged in
  if (loggedIn !== false) return null;

  return (
    <div
      className="flex justify-end px-6 py-3 border-b"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
    >
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        style={{
          background: "var(--accent-blue)",
          color: "#fff",
        }}
      >
        <LogIn size={15} />
        Sign In / Create Account
      </Link>
    </div>
  );
}
