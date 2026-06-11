"use client";

import { useState, useEffect } from "react";
import { Menu, LogIn, Wallet } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function NavShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className="flex h-full" style={{ background: "var(--bg-base)" }}>
      {/* Backdrop — mobile only, sits behind the open sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel
          Mobile: fixed overlay, slides in from left
          Desktop: in-flow flex child, always visible */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-56 flex-shrink-0 h-full",
          "transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0 md:transition-none"
        )}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content — always full-width on mobile (sidebar is out of flow) */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        {/* Mobile top bar — hamburger + logo + optional Sign In */}
        <div
          className="flex items-center gap-3 h-14 px-4 border-b flex-shrink-0 md:hidden"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg flex-shrink-0 hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} style={{ color: "var(--text-secondary)" }} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
              style={{ background: "var(--accent-blue-dim)" }}
            >
              <Wallet size={13} style={{ color: "var(--accent-blue)" }} />
            </span>
            <span className="text-sm font-semibold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
              Standing Ledger
            </span>
          </div>

          {loggedIn !== true && (
            <Link
              href="/login"
              className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              <LogIn size={13} />
              Sign In
            </Link>
          )}
        </div>

        {/* Desktop Sign In bar — only when not logged in */}
        {loggedIn !== true && (
          <div
            className="hidden md:flex justify-end px-6 py-3 border-b flex-shrink-0"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              <LogIn size={15} />
              Sign In / Create Account
            </Link>
          </div>
        )}

        {loggedIn !== true && (
          <div
            className="flex-shrink-0 px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                Know exactly where you stand.
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Track your assets, debts, income, and expenses in one place. Free to get started.
              </p>
            </div>
            <Link
              href="/login"
              className="flex-shrink-0 inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              Create Free Account
            </Link>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
