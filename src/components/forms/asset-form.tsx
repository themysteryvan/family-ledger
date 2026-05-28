"use client";

import { useState } from "react";
import type { Asset } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";

interface Props {
  initial?: Asset;
  onSave: (data: Omit<Asset, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const CATEGORIES: { value: Asset["category"]; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "retirement", label: "Retirement Account" },
  { value: "investment", label: "Investment / Brokerage" },
  { value: "cash", label: "Cash / Savings" },
  { value: "vehicle", label: "Vehicle" },
  { value: "crypto", label: "Crypto" },
  { value: "other", label: "Other" },
];

export function AssetForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    value: initial?.value != null ? String(initial.value) : "",
    category: initial?.category ?? "cash" as Asset["category"],
    appreciationRate: initial?.appreciationRate != null ? String(initial.appreciationRate) : "",
    purchasePrice: initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
    purchaseDate: initial?.purchaseDate ?? "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<Asset, "id"> = {
      name: f.name.trim(),
      value: parseFloat(f.value) || 0,
      category: f.category,
      appreciationRate: f.appreciationRate !== "" ? parseFloat(f.appreciationRate) : undefined,
      purchasePrice: f.purchasePrice !== "" ? parseFloat(f.purchasePrice) : undefined,
      purchaseDate: f.purchaseDate || undefined,
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Asset name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. 218 Birchwood Ln"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Current value ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.value}
            onChange={(e) => set("value", e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Category">
          <Select
            value={f.category}
            onChange={(e) => set("category", e.target.value as Asset["category"])}
          >
            {CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Purchase price (optional)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.purchasePrice}
            onChange={(e) => set("purchasePrice", e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Purchase date (optional)">
          <Input
            type="date"
            value={f.purchaseDate}
            onChange={(e) => set("purchaseDate", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Annual growth/depreciation rate % (optional)">
        <Input
          type="number"
          step="0.1"
          value={f.appreciationRate}
          onChange={(e) => set("appreciationRate", e.target.value)}
          placeholder="e.g. 7.0 or -12"
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add asset"} />
    </form>
  );
}
