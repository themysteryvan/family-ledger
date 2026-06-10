"use client";

import { useFinanceStore } from "@/store/finance-store";

export function FilterBar() {
  const members = useFinanceStore((s) => s.householdMembers);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);
  const setOwnerFilter = useFinanceStore((s) => s.setOwnerFilter);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setOwnerFilter(val === "" ? null : val);
  }

  return (
    <select
      value={ownerFilter ?? ""}
      onChange={handleChange}
      className="px-3 py-1.5 rounded-lg text-xs font-medium outline-none transition-colors"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
        appearance: "auto",
      }}
    >
      <option value="">All</option>
      {members.map((m) => (
        <option key={m.id} value={m.name}>{m.name}</option>
      ))}
      <option value="Joint">Joint</option>
    </select>
  );
}
