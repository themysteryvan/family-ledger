"use client";

import { useState } from "react";
import type { RetirementAccount, RetirementAccountType } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";
import { OwnerSelect } from "@/components/ui/owner-select";

interface Props {
  initial?: RetirementAccount;
  onSave: (data: Omit<RetirementAccount, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const ACCOUNT_TYPES: { value: RetirementAccountType; label: string }[] = [
  { value: "401k", label: "401(k)" },
  { value: "roth_401k", label: "Roth 401(k)" },
  { value: "ira", label: "Traditional IRA" },
  { value: "roth_ira", label: "Roth IRA" },
  { value: "403b", label: "403(b)" },
  { value: "sep_ira", label: "SEP IRA" },
  { value: "pension", label: "Pension" },
];

export function RetirementForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    type: initial?.type ?? "401k" as RetirementAccountType,
    owner: initial?.owner ?? "",
    balance: initial?.balance != null ? String(initial.balance) : "",
    contributionYtd: initial?.contributionYtd != null ? String(initial.contributionYtd) : "",
    employerMatchPct: initial?.employerMatchPct != null ? String(initial.employerMatchPct) : "",
    annualContributionLimit: initial?.annualContributionLimit != null ? String(initial.annualContributionLimit) : "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<RetirementAccount, "id"> = {
      name: f.name.trim(),
      type: f.type,
      owner: f.owner.trim(),
      balance: parseFloat(f.balance) || 0,
      contributionYtd: f.contributionYtd ? parseFloat(f.contributionYtd) : undefined,
      employerMatchPct: f.employerMatchPct ? parseFloat(f.employerMatchPct) : undefined,
      annualContributionLimit: f.annualContributionLimit ? parseFloat(f.annualContributionLimit) : undefined,
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Account name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Fidelity 401(k)"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Account type">
          <Select value={f.type} onChange={(e) => set("type", e.target.value as RetirementAccountType)}>
            {ACCOUNT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Owner">
          <OwnerSelect value={f.owner} onChange={(v) => set("owner", v)} optional={false} />
        </Field>
      </div>

      <Field label="Current balance ($)">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={f.balance}
          onChange={(e) => set("balance", e.target.value)}
          placeholder="0.00"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Contributions YTD ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.contributionYtd}
            onChange={(e) => set("contributionYtd", e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Employer match (%)">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={f.employerMatchPct}
            onChange={(e) => set("employerMatchPct", e.target.value)}
            placeholder="e.g. 4"
          />
        </Field>
      </div>

      <Field label="Annual contribution limit ($)">
        <Input
          type="number"
          min="0"
          step="1"
          value={f.annualContributionLimit}
          onChange={(e) => set("annualContributionLimit", e.target.value)}
          placeholder="e.g. 23000"
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add account"} />
    </form>
  );
}
