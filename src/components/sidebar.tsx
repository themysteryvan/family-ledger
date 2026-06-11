"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Target,
  CreditCard,
  BarChart3,
  FolderOpen,
  LineChart,
  FileText,
  Settings,
  Home,
  Wallet,
  Sparkles,
  PiggyBank,
  Building2,
  LogIn,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useFinanceStore } from "@/store/finance-store";

const topNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Household", href: "/household", icon: Home },
  { label: "AI Analysis", href: "/advisor", icon: Sparkles },
  { label: "Net Worth", href: "/net-worth", icon: BarChart3 },
  { label: "Forecasts", href: "/forecasts", icon: LineChart },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

const dashboardSubItems = [
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Budget", href: "/budget", icon: Target },
  { label: "Debts", href: "/debts", icon: CreditCard },
  { label: "Retirement", href: "/retirement", icon: PiggyBank },
  { label: "Assets", href: "/assets", icon: Building2 },
];

const dashboardSubPaths = dashboardSubItems.map((i) => i.href);

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const householdName = useFinanceStore((s) => s.householdName);

  const isDashboardSection =
    pathname === "/dashboard" ||
    dashboardSubPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

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
          Standing Ledger
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md hover:bg-[var(--bg-elevated)] transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
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
          {topNavItems.map(({ label, href, icon: Icon }) => {
            const isDash = href === "/dashboard";
            const active = isDash
              ? isDashboardSection
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                  style={active ? { background: "var(--bg-elevated)", color: "var(--text-primary)" } : {}}
                >
                  <Icon
                    size={16}
                    style={{ color: active ? "var(--accent-blue)" : "var(--text-secondary)", flexShrink: 0 }}
                  />
                  {label}
                </Link>

                {/* Dashboard sub-nav — shown when on dashboard or any sub-page */}
                {isDash && isDashboardSection && (
                  <div
                    className="ml-4 pl-3 mt-0.5 mb-1 space-y-0.5 border-l"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {dashboardSubItems.map(({ label: subLabel, href: subHref, icon: SubIcon }) => {
                      const subActive = pathname === subHref || pathname.startsWith(subHref + "/");
                      return (
                        <Link
                          key={subHref}
                          href={subHref}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            subActive
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          )}
                          style={subActive ? { background: "var(--bg-elevated)" } : {}}
                        >
                          <SubIcon
                            size={13}
                            style={{
                              color: subActive ? "var(--accent-blue)" : "var(--text-secondary)",
                              flexShrink: 0,
                            }}
                          />
                          {subLabel}
                        </Link>
                      );
                    })}
                  </div>
                )}
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
