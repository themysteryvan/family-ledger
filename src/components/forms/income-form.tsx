"use client";

import { useState } from "react";
import type { Income, FrequencyType } from "@/types";
import { Field, Input, Select, Textarea, Checkbox, FormActions } from "@/components/ui/form-field";

interface Props {
  initial?: Income;
  onSave: (data: Omit<Income, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const FREQUENCIES: { value: FrequencyType; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
  { value: "annually", label: "Annually" },
  { value: "semiannually", label: "Semi-annually" },
  { value: "quarterly", label: "Quarterly" },
  { value: "once", label: "One-time" },
];

const CATEGORIES: { value: Income["category"]; label: string }[] = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance / Consulting" },
  { value: "investment", label: "Investment" },
  { value: "rental", label: "Rental" },
  { value: "other", label: "Other" },
];

export function IncomeForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    frequency: initial?.frequency ?? "monthly" as FrequencyType,
    category: initial?.category ?? "salary" as Income["category"],
    owner: initial?.owner ?? "Jake",
    isActive: initial?.isActive ?? true,
    startDate: initial?.startDate ?? "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<Income, "id"> = {
      name: f.name.trim(),
      amount: parseFloat(f.amount) || 0,
      frequency: f.frequency,
      category: f.category,
      owner: f.owner.trim(),
      isActive: f.isActive,
      startDate: f.startDate || undefined,
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Source name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Jake Salary — Senior PM"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Frequency">
          <Select
            value={f.frequency}
            onChange={(e) => set("frequency", e.target.value as FrequencyType)}
          >
            {FREQUENCIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <Select
            value={f.category}
            onChange={(e) => set("category", e.target.value as Income["category"])}
          >
            {CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Owner">
          <Select
            value={f.owner}
            onChange={(e) => set("owner", e.target.value)}
          >
            <option value="Jake">Jake</option>
            <option value="Sarah">Sarah</option>
            <option value="Joint">Joint</option>
          </Select>
        </Field>
      </div>

      <Field label="Start date (optional)">
        <Input
          type="date"
          value={f.startDate}
          onChange={(e) => set("startDate", e.target.value)}
        />
      </Field>

      <Checkbox
        label="Active income source"
        checked={f.isActive}
        onChange={(v) => set("isActive", v)}
      />

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add income"} />
    </form>
  );
}
