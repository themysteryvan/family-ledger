"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: "blue" | "green" | "red" | "amber" | "purple";
  className?: string;
  href?: string;
}

const accentMap = {
  blue: { icon: "var(--accent-blue)", bg: "var(--accent-blue-dim)", badge: "var(--accent-blue)" },
  green: { icon: "var(--accent-green)", bg: "var(--accent-green-dim)", badge: "var(--accent-green)" },
  red: { icon: "var(--accent-red)", bg: "var(--accent-red-dim)", badge: "var(--accent-red)" },
  amber: { icon: "var(--accent-amber)", bg: "var(--accent-amber-dim)", badge: "var(--accent-amber)" },
  purple: { icon: "var(--accent-purple)", bg: "var(--accent-purple-dim)", badge: "var(--accent-purple)" },
};

export function StatCard({ title, value, sub, icon: Icon, trend, trendLabel, accent = "blue", className, href }: StatCardProps) {
  const colors = accentMap[accent];
  const trendColor = trend === "up" ? "var(--accent-green)" : trend === "down" ? "var(--accent-red)" : "var(--text-muted)";

  const inner = (
    <div
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-3",
        href && "cursor-pointer transition-colors hover:border-[var(--accent-blue)]",
        className
      )}
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {title}
        </span>
        {Icon && (
          <span className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: colors.bg }}>
            <Icon size={16} style={{ color: colors.icon }} />
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
      {trendLabel && (
        <p className="text-xs font-medium" style={{ color: trendColor }}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendLabel}
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
