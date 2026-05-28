"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Import", href: "/import", icon: Upload },
  { label: "Budget", href: "/budget", icon: Target },
  { label: "Assets", href: "/assets", icon: Building2 },
  { label: "Debts", href: "/debts", icon: CreditCard },
  { label: "Net Worth", href: "/net-worth", icon: BarChart3 },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Forecasts", href: "/forecasts", icon: LineChart },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Health Score", href: "/health-score", icon: HeartPulse },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ background: "var(--accent-blue-dim)" }}
        >
          <Wallet size={15} style={{ color: "var(--accent-blue)" }} />
        </span>
        <span
          className="font-semibold text-sm tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Family Ledger
        </span>
      </div>

      {/* Family badge */}
      <div className="px-4 py-3">
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: "var(--bg-elevated)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Henderson Family
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Jake & Sarah
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                  style={
                    active
                      ? {
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                        }
                      : {}
                  }
                >
                  <Icon
                    size={16}
                    style={{
                      color: active
                        ? "var(--accent-blue)"
                        : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
