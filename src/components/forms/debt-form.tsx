"use client";

import { useState } from "react";
import type { Debt } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";

interface Props {
  initial?: Debt;
  onSave: (data: Omit<Debt, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const CATEGORIES: { value: Debt["category"]; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "auto", label: "Auto Loan" },
  { value: "student", label: "Student Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "personal", label: "Personal Loan" },
  { value: "medical", label: "Medical" },
  { value: "other", label: "Other" },
];

export function DebtForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    balance: initial?.balance != null ? String(initial.balance) : "",
    originalBalance: initial?.originalBalance != null ? String(initial.originalBalance) : "",
    interestRate: initial?.interestRate != null ? String(initial.interestRate) : "",
    minimumPayment: initial?.minimumPayment != null ? String(initial.minimumPayment) : "",
    category: initial?.category ?? "credit_card" as Debt["category"],
    owner: initial?.owner ?? "",
    lender: initial?.lender ?? "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<Debt, "id"> = {
      name: f.name.trim(),
      balance: parseFloat(f.balance) || 0,
      originalBalance: parseFloat(f.originalBalance) || parseFloat(f.balance) || 0,
      interestRate: parseFloat(f.interestRate) || 0,
      minimumPayment: parseFloat(f.minimumPayment) || 0,
      category: f.category,
      owner: f.owner.trim() || undefined,
      lender: f.lender.trim() || undefined,
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Debt name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Chase Sapphire Preferred"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
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
        <Field label="Original balance ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.originalBalance}
            onChange={(e) => set("originalBalance", e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Interest rate (APR %)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.interestRate}
            onChange={(e) => set("interestRate", e.target.value)}
            placeholder="e.g. 6.75"
            required
          />
        </Field>
        <Field label="Minimum payment ($/mo)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.minimumPayment}
            onChange={(e) => set("minimumPayment", e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <Select
            value={f.category}
            onChange={(e) => set("category", e.target.value as Debt["category"])}
          >
            {CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lender (optional)">
          <Input
            value={f.lender}
            onChange={(e) => set("lender", e.target.value)}
            placeholder="e.g. US Bank"
          />
        </Field>
      </div>

      <Field label="Owner (optional)">
        <Input
          value={f.owner}
          onChange={(e) => set("owner", e.target.value)}
          placeholder="e.g. Jake, Sarah, Joint"
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add debt"} />
    </form>
  );
}
