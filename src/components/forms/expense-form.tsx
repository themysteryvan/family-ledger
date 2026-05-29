"use client";

import { useState } from "react";
import type { Expense, FrequencyType } from "@/types";
import { Field, Input, Select, Textarea, Checkbox, FormActions } from "@/components/ui/form-field";
import { CategorySelect } from "@/components/ui/category-select";

interface Props {
  initial?: Expense;
  onSave: (data: Omit<Expense, "id"> & { id?: string }) => void;
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

export const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transport" },
  { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education / Kids" },
  { value: "entertainment", label: "Entertainment" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "clothing", label: "Clothing" },
  { value: "personal", label: "Personal" },
  { value: "savings", label: "Savings" },
  { value: "debt", label: "Debt Payment" },
  { value: "other", label: "Other" },
];

export function ExpenseForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState<{
    name: string;
    amount: string;
    frequency: FrequencyType;
    category: string;
    isFixed: boolean;
    isEssential: boolean;
    notes: string;
  }>({
    name: initial?.name ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    frequency: initial?.frequency ?? "monthly",
    category: initial?.category ?? "housing",
    isFixed: initial?.isFixed ?? true,
    isEssential: initial?.isEssential ?? true,
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<Expense, "id"> = {
      name: f.name.trim(),
      amount: parseFloat(f.amount) || 0,
      frequency: f.frequency,
      category: (f.category.trim() || "other") as Expense["category"],
      isFixed: f.isFixed,
      isEssential: f.isEssential,
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Expense name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Mortgage Payment"
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
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Category">
        <CategorySelect
          value={f.category}
          options={EXPENSE_CATEGORIES}
          onChange={(v) => set("category", v)}
          selectStyle={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
          inputStyle={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}
        />
      </Field>

      <div className="flex gap-6">
        <Checkbox label="Fixed amount" checked={f.isFixed} onChange={(v) => set("isFixed", v)} />
        <Checkbox label="Essential" checked={f.isEssential} onChange={(v) => set("isEssential", v)} />
      </div>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add expense"} />
    </form>
  );
}
