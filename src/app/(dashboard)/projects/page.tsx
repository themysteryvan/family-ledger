"use client";

import { FolderOpen, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { fmt, fmtPct } from "@/lib/finance";
import { mockProjects } from "@/lib/mock-data";

const totalBudget = mockProjects.reduce((s, p) => s + p.totalBudget, 0);
const totalSpent = mockProjects.reduce((s, p) => s + p.amountSpent, 0);
const active = mockProjects.filter((p) => p.status === "in_progress").length;

const statusColors: Record<string, string> = {
  planned: "var(--accent-blue)",
  in_progress: "var(--accent-amber)",
  completed: "var(--accent-green)",
  cancelled: "var(--text-muted)",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const categoryIcons: Record<string, string> = {
  home_improvement: "🏠",
  vacation: "✈️",
  vehicle: "🚗",
  education: "📚",
  emergency_fund: "🛡️",
  other: "📋",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Financial goals and one-time projects
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Plus size={15} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget"
          value={fmt(totalBudget, true)}
          icon={FolderOpen}
          accent="blue"
        />
        <StatCard
          title="Total Spent"
          value={fmt(totalSpent, true)}
          accent="amber"
        />
        <StatCard
          title="Remaining"
          value={fmt(totalBudget - totalSpent, true)}
          accent="green"
        />
        <StatCard
          title="Active Projects"
          value={String(active)}
          sub="In progress"
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockProjects.map((proj) => {
          const pct = (proj.amountSpent / proj.totalBudget) * 100;
          const remaining = proj.totalBudget - proj.amountSpent;
          return (
            <div
              key={proj.id}
              className="rounded-xl border p-5"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {categoryIcons[proj.category] || "📋"}
                  </span>
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {proj.name}
                    </p>
                    {proj.description && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {proj.description}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{
                    background: "var(--bg-elevated)",
                    color: statusColors[proj.status],
                  }}
                >
                  {statusLabels[proj.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Budget
                  </p>
                  <p
                    className="font-semibold mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fmt(proj.totalBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Spent
                  </p>
                  <p
                    className="font-semibold mt-0.5"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    {fmt(proj.amountSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Remaining
                  </p>
                  <p
                    className="font-semibold mt-0.5"
                    style={{
                      color:
                        remaining >= 0
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                    }}
                  >
                    {fmt(remaining)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-muted)" }}>
                    {fmtPct(Math.min(pct, 100), 0)} complete
                  </span>
                  {proj.targetDate && (
                    <span style={{ color: "var(--text-muted)" }}>
                      Target: {proj.targetDate}
                    </span>
                  )}
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background:
                        pct >= 100
                          ? "var(--accent-green)"
                          : pct > 75
                            ? "var(--accent-amber)"
                            : "var(--accent-blue)",
                    }}
                  />
                </div>
              </div>

              {proj.expenses.length > 0 && (
                <div
                  className="mt-4 pt-3 border-t"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Line Items
                  </p>
                  <div className="space-y-1.5">
                    {proj.expenses.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: e.isPaid
                                ? "var(--accent-green)"
                                : "var(--text-muted)",
                            }}
                          />
                          <span
                            className="text-xs"
                            style={{
                              color: e.isPaid
                                ? "var(--text-muted)"
                                : "var(--text-secondary)",
                              textDecoration: e.isPaid ? "line-through" : "none",
                            }}
                          >
                            {e.name}
                          </span>
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: e.isPaid
                              ? "var(--text-muted)"
                              : "var(--text-primary)",
                          }}
                        >
                          {fmt(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proj.notes && (
                <p
                  className="text-xs mt-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  {proj.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
