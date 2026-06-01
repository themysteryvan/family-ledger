"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Target,
  Building2,
  CreditCard,
  BarChart3,
  FolderOpen,
  LineChart,
  FileText,
  HeartPulse,
  Settings,
  Wallet,
  Upload,
  Sparkles,
  PiggyBank,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useFinanceStore } from "@/store/finance-store";

const navItems = [
  { label: "Advisor", href: "/advisor", icon: Sparkles },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Assets", href: "/assets", icon: Building2 },
  { label: "Debts", href: "/debts", icon: CreditCard },
  { label: "Retirement", href: "/retirement", icon: PiggyBank },
  { label: "Net Worth", href: "/net-worth", icon: BarChart3 },
  { label: "Budget", href: "/budget", icon: Target },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Forecasts", href: "/forecasts", icon: LineChart },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Health Score", href: "/health-score", icon: HeartPulse },
  { label: "Import", href: "/import", icon: Upload },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const householdName = useFinanceStore((s) => s.householdName);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/dashboard");
  }

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "var(--accent-blue-dim)" }}>
          <Wallet size={15} style={{ color: "var(--accent-blue)" }} />
        </span>
        <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
          Family Ledger
        </span>
      </div>

      {/* Household badge */}
      <div className="px-4 py-3">
        <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-elevated)" }}>
          {userEmail ? (
            <>
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                {householdName ?? userEmail}
              </p>
              {householdName && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Demo Mode</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sign in to save data</p>
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                  style={active ? { background: "var(--bg-elevated)", color: "var(--text-primary)" } : {}}
                >
                  <Icon size={16} style={{ color: active ? "var(--accent-blue)" : "var(--text-secondary)", flexShrink: 0 }} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Auth footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        {userEmail ? (
          <div>
            <p className="text-xs px-3 mb-1.5 truncate" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut size={15} style={{ flexShrink: 0 }} />
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-muted)" }}
          >
            <LogIn size={15} style={{ flexShrink: 0 }} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
