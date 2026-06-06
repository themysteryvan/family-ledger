"use client";

import { useState } from "react";
import { useFinanceStore } from "@/store/finance-store";

const cls =
  "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors " +
  "focus:ring-1 focus:ring-[var(--accent-blue)] placeholder:text-[var(--text-muted)]";

const style = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

const ADD_SENTINEL = "__add_new__";

interface Props {
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}

export function OwnerSelect({ value, onChange, optional = true }: Props) {
  const members = useFinanceStore((s) => s.householdMembers);
  const addMember = useFinanceStore((s) => s.addMember);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  function handleSelect(v: string) {
    if (v === ADD_SENTINEL) setAdding(true);
    else onChange(v);
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    addMember({ name });
    onChange(name);
    setAdding(false);
    setNewName("");
  }

  function handleCancel() {
    setAdding(false);
    setNewName("");
  }

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Member name"
          className={cls + " flex-1"}
          style={style}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0"
          style={{ background: "var(--accent-blue)", color: "#fff", opacity: newName.trim() ? 1 : 0.5 }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0"
          style={{ color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => handleSelect(e.target.value)}
      className={cls}
      style={{ ...style, appearance: "auto" }}
    >
      {optional && <option value="">— Unassigned —</option>}
      {members.map((m) => (
        <option key={m.id} value={m.name}>
          {m.name}{m.role ? ` (${m.role})` : ""}
        </option>
      ))}
      <option value={ADD_SENTINEL}>+ Add member...</option>
    </select>
  );
}
