"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { useFinanceStore } from "@/store/finance-store";
import { fmt } from "@/lib/finance";
import type { Expense } from "@/types";

// Maps AI-returned labels to Expense category values
const CATEGORY_MAP: Record<string, Expense["category"]> = {
  housing: "housing",
  utilities: "utilities",
  food: "food",
  transport: "transport",
  kids: "education",
  health: "healthcare",
  insurance: "insurance",
  entertainment: "entertainment",
  personal: "personal",
  pets: "other",
  savings: "savings",
  other: "other",
};

const ESSENTIAL_CATEGORIES = new Set<Expense["category"]>(["housing", "utilities", "food", "healthcare", "insurance"]);

const DISPLAY_CATEGORIES: { value: Expense["category"]; label: string }[] = [
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "education", label: "Kids / Education" },
  { value: "healthcare", label: "Health" },
  { value: "insurance", label: "Insurance" },
  { value: "entertainment", label: "Entertainment" },
  { value: "personal", label: "Personal" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Other" },
];

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Expense["category"];
  aiCategory: Expense["category"] | null;
  include: boolean;
}

// Detect and parse common bank CSV formats
function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  function col(row: string[], ...names: string[]): string {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return (row[idx] || "").trim().replace(/^["']|["']$/g, "");
    }
    return "";
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas inside
    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);

    const desc = col(cells, "description", "merchant", "memo", "payee", "name", "details");
    const dateStr = col(cells, "date", "posted", "transaction date", "trans date");

    // Amount: try debit column first (positive = expense), then amount
    let amount = 0;
    const debit = col(cells, "debit", "withdrawal", "charge");
    const credit = col(cells, "credit", "deposit");
    const rawAmount = col(cells, "amount");

    if (debit) {
      amount = Math.abs(parseFloat(debit.replace(/[$,]/g, "")) || 0);
    } else if (rawAmount) {
      const parsed = parseFloat(rawAmount.replace(/[$,]/g, "")) || 0;
      // Negative amounts are debits in some formats
      amount = Math.abs(parsed);
      // Skip credits (positive in "amount" column with a "credit" column present)
      if (parsed > 0 && credit) continue;
    }

    if (!desc || amount === 0) continue;

    rows.push({
      id: `${i}-${Date.now()}`,
      date: dateStr || "",
      description: desc,
      amount,
      category: "other",
      aiCategory: null,
      include: true,
    });
  }
  return rows;
}

async function categorizWithAI(rows: ParsedRow[]): Promise<Record<string, Expense["category"]>> {
  const res = await fetch("/api/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactions: rows.map((r, i) => ({ index: i, description: r.description, amount: r.amount })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Categorization failed");
  }

  const { categories } = await res.json() as { categories: Record<string, string> };
  const result: Record<string, Expense["category"]> = {};
  for (const [idx, label] of Object.entries(categories)) {
    result[idx] = CATEGORY_MAP[label.toLowerCase()] ?? "other";
  }
  return result;
}

type Stage = "upload" | "categorizing" | "review" | "done";

export default function ImportPage() {
  const { addExpense } = useFinanceStore();
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setError(null);
    setFileName(file.name);

    const text = await file.text();
    const parsed = parseCSV(text);

    if (parsed.length === 0) {
      setError("No transactions found. Make sure the CSV has Date, Description, and Amount columns.");
      return;
    }

    setRows(parsed);
    setStage("categorizing");

    try {
      // Batch in groups of 50 to stay within prompt limits
      const BATCH = 50;
      const updated = [...parsed];
      for (let start = 0; start < parsed.length; start += BATCH) {
        const batch = parsed.slice(start, start + BATCH);
        const mapping = await categorizWithAI(batch);
        for (const [idxStr, cat] of Object.entries(mapping)) {
          const globalIdx = start + parseInt(idxStr, 10);
          if (updated[globalIdx]) {
            updated[globalIdx] = { ...updated[globalIdx], category: cat, aiCategory: cat };
          }
        }
      }
      setRows(updated);
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI categorization failed.");
      // Still show review with default categories
      setRows(parsed.map((r) => ({ ...r, aiCategory: null })));
      setStage("review");
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function updateRow(id: string, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function confirmImport() {
    const toImport = rows.filter((r) => r.include);
    for (const row of toImport) {
      addExpense({
        name: row.description,
        amount: row.amount,
        frequency: "once",
        category: row.category,
        isFixed: false,
        isEssential: ESSENTIAL_CATEGORIES.has(row.category),
        notes: row.date ? `Imported transaction: ${row.date}` : "Imported transaction",
      });
    }
    setStage("done");
  }

  function reset() {
    setStage("upload");
    setRows([]);
    setError(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const includedCount = rows.filter((r) => r.include).length;
  const totalAmount = rows.filter((r) => r.include).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Import Transactions</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload a bank or credit card CSV and let AI categorize your transactions</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "var(--accent-red-dim)", border: "1px solid var(--accent-red)" }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-red)" }} />
          <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0" style={{ color: "var(--accent-red)" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Upload stage */}
      {(stage === "upload") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-20 transition-colors"
          style={{
            borderColor: isDragging ? "var(--accent-blue)" : "var(--border)",
            background: isDragging ? "var(--accent-blue-dim)" : "var(--bg-surface)",
          }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--bg-elevated)" }}>
            <Upload size={26} style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Drop a CSV file here, or click to browse</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Supports most bank and credit card exports</p>
          </div>
          <p className="text-xs px-6 text-center" style={{ color: "var(--text-muted)" }}>
            Needs columns for date, description/merchant, and amount. Works with Chase, Bank of America, Citi, Wells Fargo, and similar formats.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileInput} />
        </div>
      )}

      {/* Categorizing stage */}
      {stage === "categorizing" && (
        <div className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--accent-blue-dim)" }}>
            <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Analyzing {rows.length} transactions…</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Claude is categorizing your spending</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            <Sparkles size={13} style={{ color: "var(--accent-blue)" }} />
            Powered by Claude claude-sonnet-4-20250514
          </div>
        </div>
      )}

      {/* Review stage */}
      {stage === "review" && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-xl border px-5 py-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>File</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileText size={13} style={{ color: "var(--accent-blue)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fileName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Selected</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{includedCount} of {rows.length}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent-red)" }}>{fmt(totalAmount)}</p>
              </div>
              {!error && (
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
                  <Sparkles size={12} />
                  AI categorized
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={reset} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
                Start over
              </button>
              <button
                onClick={confirmImport}
                disabled={includedCount === 0}
                className="text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-40"
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                Import {includedCount} transaction{includedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          {/* Review table */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={rows.every((r) => r.include)}
                      onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, include: e.target.checked })))}
                      className="rounded"
                      style={{ accentColor: "var(--accent-blue)" }}
                    />
                  </th>
                  {["Date", "Description", "Amount", "Category", "AI?"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      opacity: row.include ? 1 : 0.4,
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                        style={{ accentColor: "var(--accent-blue)" }}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{row.date || "—"}</td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <p className="truncate font-medium" style={{ color: "var(--text-primary)" }}>{row.description}</p>
                    </td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "var(--accent-red)" }}>{fmt(row.amount)}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={row.category}
                        onChange={(e) => updateRow(row.id, { category: e.target.value as Expense["category"] })}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {DISPLAY_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {row.aiCategory ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
                          AI
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                          manual
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Done stage */}
      {stage === "done" && (
        <div className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--accent-green-dim)" }}>
            <CheckCircle size={26} style={{ color: "var(--accent-green)" }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>Import complete!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {includedCount} transaction{includedCount !== 1 ? "s" : ""} ({fmt(totalAmount)}) added to your expenses
            </p>
          </div>
          <button onClick={reset} className="text-sm font-medium px-5 py-2 rounded-lg" style={{ background: "var(--accent-blue)", color: "#fff" }}>
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
