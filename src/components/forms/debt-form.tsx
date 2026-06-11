"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import type { Debt } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";
import { OwnerSelect } from "@/components/ui/owner-select";
import { uploadDocument } from "@/lib/supabase/storage";

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

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let documentUrl = initial?.documentUrl;
    if (pendingFile) {
      setUploading(true);
      try { documentUrl = await uploadDocument(pendingFile, "debts"); }
      catch (err) { console.error("Upload failed:", err); }
      finally { setUploading(false); }
    }
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
      documentUrl,
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
        <OwnerSelect value={f.owner} onChange={(v) => set("owner", v)} />
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
        />
      </Field>

      <div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
        {pendingFile ? (
          <div className="flex items-center gap-2">
            <Paperclip size={13} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm truncate max-w-[240px]" style={{ color: "var(--text-secondary)" }}>{pendingFile.name}</span>
            <button type="button" onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>Remove</button>
          </div>
        ) : initial?.documentUrl ? (
          <div className="flex items-center gap-3">
            <a href={initial.documentUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm" style={{ color: "var(--accent-blue)" }}>
              <Paperclip size={13} /> View attachment
            </a>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs" style={{ color: "var(--text-muted)" }}>Replace</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <Paperclip size={13} /> Attach document
          </button>
        )}
        {uploading && <span className="text-xs mt-1 block" style={{ color: "var(--text-muted)" }}>Uploading…</span>}
      </div>

      <FormActions onClose={onClose} submitLabel={uploading ? "Saving…" : initial ? "Save changes" : "Add debt"} />
    </form>
  );
}
