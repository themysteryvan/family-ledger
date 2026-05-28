"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";

interface Props {
  initial?: Project;
  onSave: (data: Omit<Project, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const CATEGORIES: { value: Project["category"]; label: string }[] = [
  { value: "home_improvement", label: "Home Improvement" },
  { value: "vacation", label: "Vacation" },
  { value: "vehicle", label: "Vehicle" },
  { value: "education", label: "Education" },
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: Project["status"]; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function ProjectForm({ initial, onSave, onClose }: Props) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    totalBudget: initial?.totalBudget != null ? String(initial.totalBudget) : "",
    amountSpent: initial?.amountSpent != null ? String(initial.amountSpent) : "0",
    category: initial?.category ?? "other" as Project["category"],
    status: initial?.status ?? "planned" as Project["status"],
    targetDate: initial?.targetDate ?? "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<Project, "id"> = {
      name: f.name.trim(),
      description: f.description.trim() || undefined,
      totalBudget: parseFloat(f.totalBudget) || 0,
      amountSpent: parseFloat(f.amountSpent) || 0,
      category: f.category,
      status: f.status,
      targetDate: f.targetDate || undefined,
      expenses: initial?.expenses ?? [],
      notes: f.notes.trim() || undefined,
    };
    onSave(initial ? { ...data, id: initial.id } : data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Project name">
        <Input
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Backyard Deck & Patio"
          required
        />
      </Field>

      <Field label="Description (optional)">
        <Input
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Brief description of the project"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Total budget ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.totalBudget}
            onChange={(e) => set("totalBudget", e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Amount spent ($)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.amountSpent}
            onChange={(e) => set("amountSpent", e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <Select
            value={f.category}
            onChange={(e) => set("category", e.target.value as Project["category"])}
          >
            {CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={f.status}
            onChange={(e) => set("status", e.target.value as Project["status"])}
          >
            {STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Target date (optional)">
        <Input
          type="date"
          value={f.targetDate}
          onChange={(e) => set("targetDate", e.target.value)}
        />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <FormActions onClose={onClose} submitLabel={initial ? "Save changes" : "Add project"} />
    </form>
  );
}
