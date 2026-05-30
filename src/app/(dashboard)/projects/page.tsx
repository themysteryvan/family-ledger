"use client";

import { useState } from "react";
import { FolderOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectForm } from "@/components/forms/project-form";
import { useFinanceStore } from "@/store/finance-store";
import { fmt, fmtPct } from "@/lib/finance";
import type { Project } from "@/types";

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
  const projects = useFinanceStore((s) => s.projects);
  const addProject = useFinanceStore((s) => s.addProject);
  const updateProject = useFinanceStore((s) => s.updateProject);
  const deleteProject = useFinanceStore((s) => s.deleteProject);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBudget = projects.reduce((s, p) => s + p.totalBudget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.amountSpent, 0);
  const active = projects.filter((p) => p.status === "in_progress").length;

  function openAdd() { setEditItem(null); setShowModal(true); }
  function openEdit(item: Project) { setEditItem(item); setShowModal(true); }

  function handleSave(data: Omit<Project, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateProject(id, patch);
    } else {
      addProject(data);
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) { deleteProject(id); setDeletingId(null); }
    else setDeletingId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Financial goals and one-time projects</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff" }}>
          <Plus size={15} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Budget" value={fmt(totalBudget, true)} icon={FolderOpen} accent="blue" />
        <StatCard title="Total Spent" value={fmt(totalSpent, true)} accent="amber" />
        <StatCard title="Remaining" value={fmt(totalBudget - totalSpent, true)} accent="green" />
        <StatCard title="Active Projects" value={String(active)} sub="In progress" accent="purple" />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <EmptyState icon={FolderOpen} title="No projects yet" description="Plan home improvements, vacations, emergency funds, and other financial goals." action="New Project" onAction={openAdd} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const pct = proj.totalBudget > 0 ? (proj.amountSpent / proj.totalBudget) * 100 : 0;
          const remaining = proj.totalBudget - proj.amountSpent;
          return (
            <div key={proj.id} className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl flex-shrink-0">{categoryIcons[proj.category] || "📋"}</span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{proj.name}</p>
                    {proj.description && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{proj.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-elevated)", color: statusColors[proj.status] }}>
                    {statusLabels[proj.status]}
                  </span>
                  <button onClick={() => openEdit(proj)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                    <Pencil size={13} />
                  </button>
                  {deletingId === proj.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDeleteClick(proj.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => handleDeleteClick(proj.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Budget</p>
                  <p className="font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{fmt(proj.totalBudget)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Spent</p>
                  <p className="font-semibold mt-0.5" style={{ color: "var(--accent-amber)" }}>{fmt(proj.amountSpent)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Remaining</p>
                  <p className="font-semibold mt-0.5" style={{ color: remaining >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>{fmt(remaining)}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-muted)" }}>{fmtPct(Math.min(pct, 100), 0)} complete</span>
                  {proj.targetDate && <span style={{ color: "var(--text-muted)" }}>Target: {proj.targetDate}</span>}
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "var(--accent-green)" : pct > 75 ? "var(--accent-amber)" : "var(--accent-blue)" }} />
                </div>
              </div>

              {/* Line items */}
              {proj.expenses.length > 0 && (
                <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Line Items</p>
                  <div className="space-y-1.5">
                    {proj.expenses.map((e) => (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.isPaid ? "var(--accent-green)" : "var(--text-muted)" }} />
                          <span className="text-xs" style={{ color: e.isPaid ? "var(--text-muted)" : "var(--text-secondary)", textDecoration: e.isPaid ? "line-through" : "none" }}>
                            {e.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: e.isPaid ? "var(--text-muted)" : "var(--text-primary)" }}>{fmt(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proj.notes && <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{proj.notes}</p>}
            </div>
          );
        })}
      </div>
      )}

      {showModal && (
        <Modal title={editItem ? "Edit Project" : "New Project"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <ProjectForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
