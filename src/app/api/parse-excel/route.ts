import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { Income, Expense, Asset, Debt, RetirementAccount, FrequencyType } from "@/types";

function str(val: ExcelJS.CellValue): string {
  if (val == null) return "";
  if (typeof val === "object" && "text" in val) return String((val as unknown as { text: string }).text ?? "").trim();
  if (typeof val === "object" && "result" in val) return str((val as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  return String(val).trim();
}

function num(val: ExcelJS.CellValue): number {
  const s = str(val).replace(/[$,%]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function mapFrequency(raw: string): FrequencyType {
  const v = raw.toLowerCase().replace(/[-\s]/g, "");
  if (v === "monthly" || v === "month") return "monthly";
  if (v === "weekly" || v === "week") return "weekly";
  if (v === "biweekly" || v === "biweek" || v === "everyotherweek") return "biweekly";
  if (v === "annually" || v === "annual" || v === "yearly" || v === "year") return "annually";
  if (v === "quarterly" || v === "quarter") return "quarterly";
  if (v === "semiannually" || v === "semiannual" || v === "biannually") return "semiannually";
  return "once";
}

function mapIncomeCategory(raw: string): Income["category"] {
  const v = raw.toLowerCase();
  if (v.includes("salary") || v.includes("wage") || v.includes("payroll")) return "salary";
  if (v.includes("freelance") || v.includes("consult") || v.includes("contract")) return "freelance";
  if (v.includes("rental") || v.includes("rent")) return "rental";
  if (v.includes("invest") || v.includes("dividend") || v.includes("capital")) return "investment";
  return "other";
}

function mapExpenseCategory(raw: string): Expense["category"] {
  const v = raw.toLowerCase();
  if (v.includes("hous") || v.includes("mortgage") || v.includes("rent")) return "housing";
  if (v.includes("util")) return "utilities";
  if (v.includes("food") || v.includes("grocer") || v.includes("dining")) return "food";
  if (v.includes("transport") || v.includes("car") || v.includes("gas") || v.includes("auto")) return "transport";
  if (v.includes("insur")) return "insurance";
  if (v.includes("health") || v.includes("medical") || v.includes("dental")) return "healthcare";
  if (v.includes("edu") || v.includes("school") || v.includes("tuition") || v.includes("kids")) return "education";
  if (v.includes("entertain") || v.includes("fun") || v.includes("hobby")) return "entertainment";
  if (v.includes("subscript") || v.includes("stream")) return "subscriptions";
  if (v.includes("cloth") || v.includes("apparel") || v.includes("fashion")) return "clothing";
  if (v.includes("personal") || v.includes("beauty") || v.includes("care")) return "personal";
  if (v.includes("saving") || v.includes("invest")) return "savings";
  if (v.includes("debt") || v.includes("loan") || v.includes("payment")) return "debt";
  return "other";
}

function mapAssetCategory(raw: string): Asset["category"] {
  const v = raw.toLowerCase();
  if (v.includes("real estate") || v.includes("home") || v.includes("house") || v.includes("property")) return "real_estate";
  if (v.includes("vehicle") || v.includes("car") || v.includes("truck") || v.includes("auto")) return "vehicle";
  if (v.includes("retirement") || v.includes("401") || v.includes("ira") || v.includes("pension")) return "retirement";
  if (v.includes("crypto") || v.includes("bitcoin") || v.includes("eth")) return "crypto";
  if (v.includes("invest") || v.includes("brokerage") || v.includes("stock") || v.includes("fund")) return "investment";
  if (v.includes("cash") || v.includes("check") || v.includes("saving") || v.includes("hysa") || v.includes("bank")) return "cash";
  return "other";
}

function mapDebtCategory(raw: string): Debt["category"] {
  const v = raw.toLowerCase();
  if (v.includes("mortgage") || v.includes("home loan")) return "mortgage";
  if (v.includes("auto") || v.includes("car") || v.includes("vehicle")) return "auto";
  if (v.includes("student") || v.includes("education") || v.includes("school")) return "student";
  if (v.includes("credit card") || v.includes("credit") || v.includes("card")) return "credit_card";
  if (v.includes("medical") || v.includes("hospital") || v.includes("health")) return "medical";
  if (v.includes("personal")) return "personal";
  return "other";
}

function mapRetirementType(raw: string): RetirementAccount["type"] {
  const v = raw.toLowerCase().replace(/[\s()]/g, "");
  if (v === "roth401k" || v.includes("roth401")) return "roth_401k";
  if (v === "401k" || v.includes("401k") || v.includes("401(k)")) return "401k";
  if (v === "rothira" || v.includes("rothira")) return "roth_ira";
  if (v === "ira" || v.includes("traditionalira")) return "ira";
  if (v.includes("403b") || v.includes("403(b)")) return "403b";
  if (v.includes("sep")) return "sep_ira";
  if (v.includes("pension")) return "pension";
  return "ira";
}

function sheetRows(ws: ExcelJS.Worksheet): ExcelJS.CellValue[][] {
  const rows: ExcelJS.CellValue[][] = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return; // skip header
    const vals = row.values as ExcelJS.CellValue[];
    // ExcelJS row.values is 1-indexed with undefined at [0]
    rows.push(vals.slice(1));
  });
  return rows;
}

function isExampleRow(first: string): boolean {
  // Skip rows where the first cell matches our example data patterns — users may not delete them
  return false; // we trust the user; just skip blank rows
}

function isBlank(row: ExcelJS.CellValue[]): boolean {
  return row.every((v) => v == null || str(v) === "");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (wb.xlsx as any).load(Buffer.from(arrayBuffer));

  const incomes: Omit<Income, "id">[] = [];
  const expenses: Omit<Expense, "id">[] = [];
  const assets: Omit<Asset, "id">[] = [];
  const debts: Omit<Debt, "id">[] = [];
  const retirementAccounts: Omit<RetirementAccount, "id">[] = [];

  // ── Income sheet ──────────────────────────────────────────────────────────
  const incomeSheet = wb.getWorksheet("Income");
  if (incomeSheet) {
    for (const row of sheetRows(incomeSheet)) {
      if (isBlank(row)) continue;
      const name = str(row[0]);
      if (!name) continue;
      incomes.push({
        name,
        amount: num(row[1]),
        frequency: mapFrequency(str(row[2])),
        owner: str(row[3]),
        category: mapIncomeCategory(str(row[4])),
        isActive: true,
        notes: str(row[5]) || undefined,
      });
    }
  }

  // ── Expenses sheet ────────────────────────────────────────────────────────
  const expenseSheet = wb.getWorksheet("Expenses");
  if (expenseSheet) {
    for (const row of sheetRows(expenseSheet)) {
      if (isBlank(row)) continue;
      const name = str(row[0]);
      if (!name) continue;
      const cat = mapExpenseCategory(str(row[3]));
      expenses.push({
        name,
        amount: num(row[1]),
        frequency: mapFrequency(str(row[2])),
        category: cat,
        isFixed: false,
        isEssential: ["housing", "utilities", "food", "healthcare", "insurance"].includes(cat),
        notes: str(row[5]) || undefined,
      });
    }
  }

  // ── Assets sheet ──────────────────────────────────────────────────────────
  const assetSheet = wb.getWorksheet("Assets");
  if (assetSheet) {
    for (const row of sheetRows(assetSheet)) {
      if (isBlank(row)) continue;
      const name = str(row[0]);
      if (!name) continue;
      const institution = str(row[4]);
      const notes = str(row[5]);
      assets.push({
        name,
        category: mapAssetCategory(str(row[1])),
        value: num(row[2]),
        purchasePrice: num(row[3]) || undefined,
        notes: [institution, notes].filter(Boolean).join(" — ") || undefined,
      });
    }
  }

  // ── Debts sheet ───────────────────────────────────────────────────────────
  const debtSheet = wb.getWorksheet("Debts");
  if (debtSheet) {
    for (const row of sheetRows(debtSheet)) {
      if (isBlank(row)) continue;
      const name = str(row[0]);
      if (!name) continue;
      const balance = num(row[2]);
      debts.push({
        name,
        category: mapDebtCategory(str(row[1])),
        balance,
        originalBalance: balance,
        interestRate: num(row[3]),
        minimumPayment: num(row[4]),
        notes: str(row[6]) || undefined,
      });
    }
  }

  // ── Retirement sheet ──────────────────────────────────────────────────────
  const retirementSheet = wb.getWorksheet("Retirement");
  if (retirementSheet) {
    for (const row of sheetRows(retirementSheet)) {
      if (isBlank(row)) continue;
      const name = str(row[0]);
      if (!name) continue;
      const institution = str(row[6]);
      retirementAccounts.push({
        name,
        type: mapRetirementType(str(row[1])),
        owner: str(row[2]),
        balance: num(row[3]),
        contributionYtd: undefined,
        employerMatchPct: num(row[5]) || undefined,
        notes: institution || undefined,
      });
    }
  }

  return NextResponse.json({ incomes, expenses, assets, debts, retirementAccounts });
}
