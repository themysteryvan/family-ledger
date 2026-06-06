"use client";

import { useState } from "react";
import { Users, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useFinanceStore } from "@/store/finance-store";
import type { HouseholdMember } from "@/types";

const inputCls =
  "px-3 py-2 rounded-lg text-sm outline-none transition-colors focus:ring-1 focus:ring-[var(--accent-blue)]";
const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

export default function HouseholdPage() {
  const members = useFinanceStore((s) => s.householdMembers);
  const addMember = useFinanceStore((s) => s.addMember);
  const updateMember = useFinanceStore((s) => s.updateMember);
  const deleteMember = useFinanceStore((s) => s.deleteMember);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openAdd() {
    setAdding(true);
    setEditingId(null);
    setDeletingId(null);
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    addMember({ name, role: newRole.trim() || undefined });
    setNewName("");
    setNewRole("");
    setAdding(false);
  }

  function cancelAdd() {
    setAdding(false);
    setNewName("");
    setNewRole("");
  }

  function startEdit(m: HouseholdMember) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditRole(m.role ?? "");
    setDeletingId(null);
  }

  function handleSaveEdit() {
    const name = editName.trim();
    if (!name || !editingId) return;
    updateMember(editingId, { name, role: editRole.trim() || undefined });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Household</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Household members assigned to income, assets, debts, and expenses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Plus size={15} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={String(members.length)} icon={Users} accent="blue" />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Household Members</CardTitle>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Name", "Role", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && !adding && (
              <tr>
                <td colSpan={3}>
                  <EmptyState
                    icon={Users}
                    title="No members yet"
                    description="Add household members to assign ownership to income, assets, debts, and expenses."
                    action="Add Member"
                    onAction={openAdd}
                  />
                </td>
              </tr>
            )}

            {members.map((member, i) => {
              const isLast = i === members.length - 1 && !adding;
              const rowBorder = isLast ? "none" : "1px solid var(--border-subtle)";

              if (editingId === member.id) {
                return (
                  <tr key={member.id} style={{ borderBottom: rowBorder }}>
                    <td className="px-5 py-3">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        placeholder="Name"
                        className={inputCls + " w-full"}
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        placeholder="Role (optional)"
                        className={inputCls + " w-full"}
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "var(--accent-blue)", color: "#fff", opacity: editName.trim() ? 1 : 0.5 }}
                        >
                          <Check size={12} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={member.id} style={{ borderBottom: rowBorder }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{member.name}</td>
                  <td className="px-5 py-3">
                    {member.role ? (
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                        {member.role}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {deletingId === member.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Delete?</span>
                        <button
                          onClick={() => { deleteMember(member.id); setDeletingId(null); }}
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}
                        >Yes</button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                        >No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => startEdit(member)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingId(member.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {adding && (
              <tr style={{ borderTop: members.length > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                <td className="px-5 py-3">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") cancelAdd(); }}
                    placeholder="Name"
                    className={inputCls + " w-full"}
                    style={inputStyle}
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") cancelAdd(); }}
                    placeholder="Role (optional)"
                    className={inputCls + " w-full"}
                    style={inputStyle}
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleAdd}
                      disabled={!newName.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "var(--accent-blue)", color: "#fff", opacity: newName.trim() ? 1 : 0.5 }}
                    >
                      <Check size={12} /> Add
                    </button>
                    <button onClick={cancelAdd} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
