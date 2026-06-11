"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import type { Asset } from "@/types";
import { Field, Input, Select, Textarea, FormActions } from "@/components/ui/form-field";
import { OwnerSelect } from "@/components/ui/owner-select";
import { uploadDocument, openDocument } from "@/lib/supabase/storage";

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
    owner: initial?.owner ?? "",
    appreciationRate: initial?.appreciationRate != null ? String(initial.appreciationRate) : "",
    purchasePrice: initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
    purchaseDate: initial?.purchaseDate ?? "",
    notes: initial?.notes ?? "",
  });

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let documentUrl = initial?.documentUrl;
    if (pendingFile) {
      setUploading(true);
      setUploadError(null);
      try { documentUrl = await uploadDocument(pendingFile, "assets"); }
      catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed — check your connection and try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const data: Omit<Asset, "id"> = {
      name: f.name.trim(),
      value: parseFloat(f.value) || 0,
      category: f.category,
      owner: f.owner.trim() || undefined,
      appreciationRate: f.appreciationRate !== "" ? parseFloat(f.appreciationRate) : undefined,
      purchasePrice: f.purchasePrice !== "" ? parseFloat(f.purchasePrice) : undefined,
      purchaseDate: f.purchaseDate || undefined,
      notes: f.notes.trim() || undefined,
      documentUrl,
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

      <Field label="Owner (optional)">
        <OwnerSelect value={f.owner ?? ""} onChange={(v) => set("owner", v)} />
      </Field>

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
            <button type="button" onClick={() => openDocument(initial.documentUrl!).catch(console.error)}
              className="flex items-center gap-1.5 text-sm" style={{ color: "var(--accent-blue)" }}>
              <Paperclip size={13} /> View attachment
            </button>
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
        {uploadError && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{uploadError}</p>}
      </div>

      <FormActions onClose={onClose} submitLabel={uploading ? "Uploading…" : initial ? "Save changes" : "Add asset"} />
    </form>
  );
}
