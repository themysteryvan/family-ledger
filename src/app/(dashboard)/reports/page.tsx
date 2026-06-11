"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  TrendingUp,
  BarChart3,
  DollarSign,
  HeartPulse,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import {
  buildFinancialSummary,
  calculateHealthScore,
  filterByOwner,
  toMonthly,
  monthlyIncome,
  monthlyExpenses,
  totalAssets,
  totalDebt,
  fmt,
  fmtPct,
} from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";
import { format, subMonths } from "date-fns";
import type { Income, Expense, Asset, Debt, RetirementAccount } from "@/types";

// ── Label helpers ──────────────────────────────────────────────────────────────

const ASSET_CATEGORY_LABELS: Record<Asset["category"], string> = {
  real_estate: "Real Estate",
  vehicle: "Vehicle",
  investment: "Investment",
  retirement: "Retirement",
  cash: "Cash & Savings",
  crypto: "Cryptocurrency",
  other: "Other",
};

const DEBT_CATEGORY_LABELS: Record<Debt["category"], string> = {
  mortgage: "Mortgage",
  auto: "Auto Loan",
  student: "Student Loan",
  credit_card: "Credit Card",
  personal: "Personal Loan",
  medical: "Medical",
  other: "Other",
};

const EXPENSE_CATEGORY_LABELS: Record<Expense["category"], string> = {
  housing: "Housing",
  utilities: "Utilities",
  food: "Food & Dining",
  transport: "Transport",
  insurance: "Insurance",
  healthcare: "Healthcare",
  education: "Education",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  clothing: "Clothing",
  personal: "Personal",
  savings: "Savings",
  debt: "Debt Payments",
  other: "Other",
};

const INCOME_CATEGORY_LABELS: Record<Income["category"], string> = {
  salary: "Salary",
  freelance: "Freelance",
  rental: "Rental",
  investment: "Investment",
  other: "Other",
};

// ── Grade colors ───────────────────────────────────────────────────────────────

const gradeColors: Record<string, string> = {
  A: "var(--accent-green)",
  B: "var(--accent-blue)",
  C: "var(--accent-amber)",
  D: "var(--accent-amber)",
  F: "var(--accent-red)",
};

// ── Date formatting ────────────────────────────────────────────────────────────

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

// ── Report data types ──────────────────────────────────────────────────────────

interface AssetAllocationRow { label: string; value: string; pct: string; }
interface DebtSummaryRow { label: string; balance: string; pct: string; }
interface RetirementRow { name: string; type: string; owner: string; balance: string; }
interface AssetDetailRow { name: string; category: string; value: string; owner: string; notes: string; }
interface DebtDetailRow { name: string; category: string; balance: string; rate: string; minPayment: string; owner: string; }
interface IncomeRow { name: string; category: string; owner: string; monthly: string; annual: string; }
interface ExpenseCategoryRow { category: string; monthly: string; pctOfIncome: string; }

interface ReportData {
  householdName: string;
  ownerLabel: string;
  date: string;
  totalAssets: string;
  totalDebt: string;
  netWorth: string;
  netWorthPositive: boolean;
  assetAllocation: AssetAllocationRow[];
  debtSummaryRows: DebtSummaryRow[];
  retirementRows: RetirementRow[];
  assetDetails: AssetDetailRow[];
  debtDetails: DebtDetailRow[];
  incomeRows: IncomeRow[];
  incomeTotalMonthly: string;
  incomeTotalAnnual: string;
  expenseCategoryRows: ExpenseCategoryRow[];
  totalMonthlyIncome: string;
  totalMonthlyExpenses: string;
  monthlyDebtPayments: string;
  monthlyCashFlow: string;
  cashFlowPositive: boolean;
  savingsRate: string;
  debtToIncome: string;
}

// ── HTML generator ─────────────────────────────────────────────────────────────

function generateReportHTML(data: ReportData): string {
  const retirementSection =
    data.retirementRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Retirement Accounts</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Account Name</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Type</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Owner</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.retirementRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.name}</td>
                <td style="padding:6px 8px;color:#374151;">${r.type}</td>
                <td style="padding:6px 8px;color:#374151;">${r.owner || "—"}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.balance}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const debtSummarySection =
    data.debtSummaryRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Debt Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Category</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Total Balance</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">% of Total Debt</th>
            </tr>
          </thead>
          <tbody>
            ${data.debtSummaryRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.label}</td>
                <td style="padding:6px 8px;text-align:right;color:#dc2626;">${r.balance}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.pct}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const retirementDetailSection =
    data.retirementRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Retirement Accounts</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Name</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Type</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Owner</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.retirementRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.name}</td>
                <td style="padding:6px 8px;color:#374151;">${r.type}</td>
                <td style="padding:6px 8px;color:#374151;">${r.owner || "—"}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.balance}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.householdName} — Financial Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    }
    @media screen {
      body { max-width: 900px; margin: 40px auto; padding: 0 40px; }
    }
    @media print {
      @page { margin: 0.75in; }
    }
    .doc-header {
      border-bottom: 2px solid #1e40af;
      padding-bottom: 16px;
      margin-bottom: 28px;
    }
    .doc-header h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .doc-header .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-header .meta { display: flex; gap: 24px; margin-top: 10px; font-size: 12px; color: #6b7280; }
    .section { margin-bottom: 36px; page-break-inside: avoid; }
    .section h2 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e40af;
      border-top: 2px solid #1e40af;
      padding-top: 10px;
      margin-bottom: 16px;
    }
    .summary-boxes { display: flex; gap: 12px; margin-bottom: 20px; }
    .summary-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; background: #f9fafb; }
    .summary-box .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
    .summary-box .value { font-size: 20px; font-weight: 700; color: #111827; }
    .summary-box .value.green { color: #16a34a; }
    .summary-box .value.red   { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { border-bottom: 1px solid #e5e7eb; }
    th { text-align: left; padding: 6px 8px; color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    th.num, td.num { text-align: right; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:last-child { border-bottom: none; }
    td { padding: 7px 8px; color: #374151; }
    td.bold { color: #111827; font-weight: 600; }
    td.green { color: #16a34a; font-weight: 600; }
    td.red   { color: #dc2626; }
    tr.totals-row td { border-top: 1px solid #e5e7eb; font-weight: 700; color: #111827; background: #f9fafb; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 12px; }
    .metric-row { display: contents; }
    .metric-label { padding: 9px 14px; color: #6b7280; font-size: 12px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .metric-value { padding: 9px 14px; color: #111827; font-size: 12px; font-weight: 600; border-bottom: 1px solid #f3f4f6; text-align: right; }
    .metric-value.green { color: #16a34a; }
    .metric-value.red   { color: #dc2626; }
    .report-footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${data.householdName}</h1>
    <div class="subtitle">Financial Statement</div>
    <div class="meta">
      <span>Prepared: ${data.date}</span>
      <span>Scope: ${data.ownerLabel}</span>
    </div>
  </div>

  <!-- Section 1: Net Worth Summary -->
  <div class="section">
    <h2>Net Worth Summary</h2>
    <div class="summary-boxes">
      <div class="summary-box">
        <div class="label">Total Assets</div>
        <div class="value green">${data.totalAssets}</div>
      </div>
      <div class="summary-box">
        <div class="label">Total Debts</div>
        <div class="value red">${data.totalDebt}</div>
      </div>
      <div class="summary-box">
        <div class="label">Net Worth</div>
        <div class="value ${data.netWorthPositive ? "green" : "red"}">${data.netWorth}</div>
      </div>
    </div>
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Asset Allocation</h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="num">Total Value</th>
          <th class="num">% of Assets</th>
        </tr>
      </thead>
      <tbody>
        ${data.assetAllocation
          .map(
            (r) => `
          <tr>
            <td class="bold">${r.label}</td>
            <td class="num">${r.value}</td>
            <td class="num">${r.pct}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${debtSummarySection}
    ${retirementSection}
  </div>

  <!-- Section 2: Asset & Debt Detail -->
  <div class="section">
    <h2>Asset &amp; Debt Detail</h2>
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Assets</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th class="num">Current Value</th>
          <th>Owner</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.assetDetails.length > 0
            ? data.assetDetails
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td class="num">${r.value}</td>
            <td>${r.owner || "—"}</td>
            <td style="color:#9ca3af;">${r.notes || "—"}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="5" style="color:#9ca3af;padding:12px 8px;">No assets recorded.</td></tr>'
        }
      </tbody>
    </table>
    ${retirementDetailSection}
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Debts &amp; Liabilities</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th class="num">Balance</th>
          <th class="num">Interest Rate</th>
          <th class="num">Min. Payment</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.debtDetails.length > 0
            ? data.debtDetails
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td class="num red">${r.balance}</td>
            <td class="num">${r.rate}</td>
            <td class="num">${r.minPayment}</td>
            <td>${r.owner || "—"}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="6" style="color:#9ca3af;padding:12px 8px;">No debts recorded.</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <!-- Section 3: Income & Cash Flow -->
  <div class="section">
    <h2>Income &amp; Cash Flow</h2>
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Monthly Income Sources</h3>
    <table>
      <thead>
        <tr>
          <th>Source Name</th>
          <th>Category</th>
          <th>Owner</th>
          <th class="num">Monthly</th>
          <th class="num">Annual</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.incomeRows.length > 0
            ? data.incomeRows
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td>${r.owner || "—"}</td>
            <td class="num green">${r.monthly}</td>
            <td class="num">${r.annual}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="5" style="color:#9ca3af;padding:12px 8px;">No income sources recorded.</td></tr>'
        }
        <tr class="totals-row">
          <td colspan="3">Total</td>
          <td class="num">${data.incomeTotalMonthly}</td>
          <td class="num">${data.incomeTotalAnnual}</td>
        </tr>
      </tbody>
    </table>
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Monthly Expenses by Category</h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="num">Monthly Amount</th>
          <th class="num">% of Income</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.expenseCategoryRows.length > 0
            ? data.expenseCategoryRows
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.category}</td>
            <td class="num">${r.monthly}</td>
            <td class="num">${r.pctOfIncome}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="3" style="color:#9ca3af;padding:12px 8px;">No expenses recorded.</td></tr>'
        }
      </tbody>
    </table>
    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Key Financial Metrics</h3>
    <div class="metrics">
      <div class="metric-label">Total Monthly Income</div>
      <div class="metric-value green">${data.totalMonthlyIncome}</div>
      <div class="metric-label">Total Monthly Expenses</div>
      <div class="metric-value">${data.totalMonthlyExpenses}</div>
      <div class="metric-label">Monthly Debt Payments</div>
      <div class="metric-value red">${data.monthlyDebtPayments}</div>
      <div class="metric-label">Monthly Cash Flow</div>
      <div class="metric-value ${data.cashFlowPositive ? "green" : "red"}">${data.monthlyCashFlow}</div>
      <div class="metric-label">Savings Rate</div>
      <div class="metric-value">${data.savingsRate}</div>
      <div class="metric-label">Debt-to-Income Ratio</div>
      <div class="metric-value">${data.debtToIncome}</div>
    </div>
  </div>

  <div class="report-footer">
    This report was generated by Family Ledger on ${data.date}. It is intended for informational purposes only.
  </div>
</body>
</html>`;
}

// ── Data computation ───────────────────────────────────────────────────────────

function buildReportData(
  householdName: string,
  ownerFilter: string | null,
  incomes: Income[],
  expenses: Expense[],
  assets: Asset[],
  debts: Debt[],
  retirementAccounts: RetirementAccount[]
): ReportData {
  const today = new Date();
  const date = formatDateLong(today);
  const ownerLabel = ownerFilter ?? "Full Household";

  const filteredIncomes = filterByOwner(incomes, ownerFilter).filter((i) => i.isActive);
  const filteredExpenses = filterByOwner(expenses, ownerFilter);
  const filteredAssets = filterByOwner(assets, ownerFilter);
  const filteredDebts = filterByOwner(debts, ownerFilter);
  const filteredRetirement = filterByOwner(retirementAccounts, ownerFilter);

  const retirementTotal = filteredRetirement.reduce((s, a) => s + a.balance, 0);
  const assetsTotal = totalAssets(filteredAssets) + retirementTotal;
  const debtTotal = totalDebt(filteredDebts);
  const netWorthVal = assetsTotal - debtTotal;
  const incomeMonthly = monthlyIncome(
    filterByOwner(incomes, ownerFilter).filter((i) => i.isActive)
  );
  const expenseMonthly = monthlyExpenses(filteredExpenses);
  const debtPayments = filteredDebts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0);
  const cashFlow = incomeMonthly - expenseMonthly - debtPayments;
  const savingsRate = incomeMonthly > 0 ? (cashFlow / incomeMonthly) * 100 : 0;
  const dti = incomeMonthly > 0 ? (debtPayments / incomeMonthly) * 100 : 0;

  type AssetCategoryKey = Asset["category"] | "retirement_accounts";
  const assetGroups: Record<AssetCategoryKey, number> = {
    real_estate: 0,
    vehicle: 0,
    investment: 0,
    retirement: 0,
    cash: 0,
    crypto: 0,
    other: 0,
    retirement_accounts: retirementTotal,
  };
  for (const a of filteredAssets) {
    assetGroups[a.category] += a.value;
  }

  const assetAllocation: AssetAllocationRow[] = (
    Object.entries(assetGroups) as [AssetCategoryKey, number][]
  )
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, val]) => ({
      label:
        cat === "retirement_accounts"
          ? "Retirement Accounts"
          : ASSET_CATEGORY_LABELS[cat as Asset["category"]],
      value: fmt(val),
      pct: assetsTotal > 0 ? fmtPct((val / assetsTotal) * 100) : "0.0%",
    }));

  const debtGroups: Partial<Record<Debt["category"], number>> = {};
  for (const d of filteredDebts) {
    debtGroups[d.category] = (debtGroups[d.category] ?? 0) + d.balance;
  }
  const debtSummaryRows: DebtSummaryRow[] = (
    Object.entries(debtGroups) as [Debt["category"], number][]
  )
    .sort(([, a], [, b]) => b - a)
    .map(([cat, bal]) => ({
      label: DEBT_CATEGORY_LABELS[cat],
      balance: fmt(bal),
      pct: debtTotal > 0 ? fmtPct((bal / debtTotal) * 100) : "0.0%",
    }));

  const retirementRows: RetirementRow[] = filteredRetirement
    .sort((a, b) => b.balance - a.balance)
    .map((r) => ({
      name: r.name,
      type: r.type.toUpperCase(),
      owner: r.owner,
      balance: fmt(r.balance),
    }));

  const assetDetails: AssetDetailRow[] = filteredAssets
    .sort((a, b) => b.value - a.value)
    .map((a) => ({
      name: a.name,
      category: ASSET_CATEGORY_LABELS[a.category],
      value: fmt(a.value),
      owner: a.owner ?? "",
      notes: a.notes ?? "",
    }));

  const debtDetails: DebtDetailRow[] = filteredDebts
    .sort((a, b) => b.balance - a.balance)
    .map((d) => ({
      name: d.name,
      category: DEBT_CATEGORY_LABELS[d.category],
      balance: fmt(d.balance),
      rate: fmtPct(d.interestRate),
      minPayment: fmt(d.minimumPayment),
      owner: d.owner ?? "",
    }));

  const activeIncomes = filterByOwner(incomes, ownerFilter).filter((i) => i.isActive);
  let incomeTotalMonthlyNum = 0;
  const incomeRows: IncomeRow[] = activeIncomes.map((i) => {
    const mo = toMonthly(i.amount, i.frequency);
    incomeTotalMonthlyNum += mo;
    return {
      name: i.name,
      category: INCOME_CATEGORY_LABELS[i.category],
      owner: i.owner,
      monthly: fmt(mo),
      annual: fmt(mo * 12),
    };
  });

  const expCatGroups: Partial<Record<Expense["category"], number>> = {};
  for (const e of filteredExpenses) {
    const mo = toMonthly(e.amount, e.frequency);
    expCatGroups[e.category] = (expCatGroups[e.category] ?? 0) + mo;
  }
  const expenseCategoryRows: ExpenseCategoryRow[] = (
    Object.entries(expCatGroups) as [Expense["category"], number][]
  )
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, mo]) => ({
      category: EXPENSE_CATEGORY_LABELS[cat],
      monthly: fmt(mo),
      pctOfIncome:
        incomeMonthly > 0 ? fmtPct((mo / incomeMonthly) * 100) : "—",
    }));

  return {
    householdName: householdName || "My Household",
    ownerLabel,
    date,
    totalAssets: fmt(assetsTotal),
    totalDebt: fmt(debtTotal),
    netWorth: fmt(netWorthVal),
    netWorthPositive: netWorthVal >= 0,
    assetAllocation,
    debtSummaryRows,
    retirementRows,
    assetDetails,
    debtDetails,
    incomeRows,
    incomeTotalMonthly: fmt(incomeTotalMonthlyNum),
    incomeTotalAnnual: fmt(incomeTotalMonthlyNum * 12),
    expenseCategoryRows,
    totalMonthlyIncome: fmt(incomeMonthly),
    totalMonthlyExpenses: fmt(expenseMonthly),
    monthlyDebtPayments: fmt(debtPayments),
    monthlyCashFlow: fmt(cashFlow),
    cashFlowPositive: cashFlow >= 0,
    savingsRate: fmtPct(savingsRate),
    debtToIncome: fmtPct(dti),
  };
}

// ── Tab type ───────────────────────────────────────────────────────────────────

type Tab = "report" | "health-score" | "export";

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  "report": "Monthly financial summary and trend analysis",
  "health-score": "Overall financial wellness assessment",
  "export": "Generate a printable PDF financial statement",
};

// ── Inner component ────────────────────────────────────────────────────────────

function ReportsContent() {
  const [tab, setTab] = useState<Tab>("report");

  // State
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [generating, setGenerating] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    () => new Set(["netWorth", "detail", "cashFlow"])
  );

  // Store reads
  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);
  const assets = useFinanceStore((s) => s.assets);
  const debts = useFinanceStore((s) => s.debts);
  const retirementAccounts = useFinanceStore((s) => s.retirementAccounts);
  const householdName = useFinanceStore((s) => s.householdName);
  const householdMembers = useFinanceStore((s) => s.householdMembers);

  // Shared computed
  const retirementTotal = retirementAccounts.reduce((s, a) => s + a.balance, 0);
  const summary = buildFinancialSummary(incomes, expenses, assets, debts, retirementTotal);

  // Report tab
  const monthlyData = mounted
    ? Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        const isCurrent = i === 5;
        return {
          month: format(d, "MMM"),
          income: isCurrent ? Math.round(summary.monthlyIncome) : 0,
          expenses: isCurrent ? Math.round(summary.monthlyExpenses) : 0,
          savings: isCurrent ? Math.round(summary.monthlyCashFlow) : 0,
          isCurrent,
        };
      })
    : [];

  // Health score tab
  const liquidCash = assets
    .filter((a) => a.category === "cash")
    .reduce((s, a) => s + a.value, 0);
  const emergencyFundMonths =
    summary.monthlyExpenses > 0 ? liquidCash / summary.monthlyExpenses : 0;
  const health = calculateHealthScore(summary, emergencyFundMonths);
  const radarData = [
    { subject: "Savings", score: health.savingsScore },
    { subject: "Debt", score: health.debtScore },
    { subject: "Cash Flow", score: health.cashFlowScore },
    { subject: "Emergency\nFund", score: health.emergencyFundScore },
  ];

  // Export tab
  const today = new Date();
  const dateLabel = formatDateLong(today);
  const filteredAssets = filterByOwner(assets, scope);
  const filteredDebts = filterByOwner(debts, scope);
  const filteredIncomes = filterByOwner(incomes, scope).filter((i) => i.isActive);
  const filteredExpenses = filterByOwner(expenses, scope);
  const filteredRetirement = filterByOwner(retirementAccounts, scope);
  const exportRetTotal = filteredRetirement.reduce((s, a) => s + a.balance, 0);
  const exportAssetsTotal = totalAssets(filteredAssets) + exportRetTotal;
  const exportDebtTotal = totalDebt(filteredDebts);
  const exportNetWorth = exportAssetsTotal - exportDebtTotal;
  const exportIncomeMonthly = monthlyIncome(filteredIncomes);
  const exportExpenseMonthly = monthlyExpenses(filteredExpenses);

  function handleGeneratePDF() {
    setGenerating(true);
    try {
      const data = buildReportData(
        householdName ?? "My Household",
        scope,
        incomes,
        expenses,
        assets,
        debts,
        retirementAccounts
      );
      let html = generateReportHTML(data);
      if (!selectedSections.has("netWorth")) {
        html = html.replace(/<!-- Section 1: Net Worth Summary -->[\s\S]*?(?=<!-- Section 2:|<div class="report-footer")/, "");
      }
      if (!selectedSections.has("detail")) {
        html = html.replace(/<!-- Section 2: Asset & Debt Detail -->[\s\S]*?(?=<!-- Section 3:|<div class="report-footer")/, "");
      }
      if (!selectedSections.has("cashFlow")) {
        html = html.replace(/<!-- Section 3: Income & Cash Flow -->[\s\S]*?(?=<div class="report-footer")/, "");
      }
      const win = window.open("", "_blank");
      if (!win) {
        alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } finally {
      setGenerating(false);
    }
  }

  const exportSections = [
    {
      key: "netWorth",
      icon: BarChart3,
      title: "Net Worth Summary",
      items: [
        `${filteredAssets.length + filteredRetirement.length} assets totalling ${fmt(exportAssetsTotal)}`,
        `${filteredDebts.length} debts totalling ${fmt(exportDebtTotal)}`,
        `Net worth: ${fmt(exportNetWorth)}`,
        "Asset allocation by category",
        filteredRetirement.length > 0
          ? `${filteredRetirement.length} retirement account${filteredRetirement.length !== 1 ? "s" : ""}`
          : null,
      ].filter(Boolean) as string[],
    },
    {
      key: "detail",
      icon: DollarSign,
      title: "Asset & Debt Detail",
      items: [
        `${filteredAssets.length} asset${filteredAssets.length !== 1 ? "s" : ""} with name, category, value, and owner`,
        filteredRetirement.length > 0
          ? `${filteredRetirement.length} retirement account${filteredRetirement.length !== 1 ? "s" : ""}`
          : null,
        `${filteredDebts.length} debt${filteredDebts.length !== 1 ? "s" : ""} with balance, rate, and minimum payment`,
      ].filter(Boolean) as string[],
    },
    {
      key: "cashFlow",
      icon: TrendingUp,
      title: "Income & Cash Flow",
      items: [
        `${filteredIncomes.length} active income source${filteredIncomes.length !== 1 ? "s" : ""} — ${fmt(exportIncomeMonthly)}/mo`,
        `Expenses by category — ${fmt(exportExpenseMonthly)}/mo total`,
        "Key financial metrics: cash flow, savings rate, DTI",
      ],
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "report", label: "Monthly Report" },
    { key: "health-score", label: "Health Score" },
    { key: "export", label: "Export" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {TAB_DESCRIPTIONS[tab]}
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 pb-px border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors"
            style={
              tab === t.key
                ? {
                    background: "var(--accent-blue)",
                    color: "#fff",
                    border: "1px solid var(--accent-blue)",
                  }
                : {
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }
            }
            onMouseEnter={(e) => {
              if (tab !== t.key)
                e.currentTarget.style.background = "var(--bg-surface)";
            }}
            onMouseLeave={(e) => {
              if (tab !== t.key)
                e.currentTarget.style.background = "var(--bg-elevated)";
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Monthly Report tab ─────────────────────────────────────────────── */}
      {tab === "report" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Monthly Income" value={fmt(summary.monthlyIncome)} icon={FileText} accent="green" />
            <StatCard title="Monthly Expenses" value={fmt(summary.monthlyExpenses)} accent="red" />
            <StatCard title="Monthly Savings" value={fmt(summary.monthlyCashFlow)} accent="blue" />
            <StatCard
              title="Savings Rate"
              value={fmtPct(summary.savingsRate)}
              accent="purple"
              trend="up"
              trendLabel="vs 15% target"
            />
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <CardTitle>Income vs Expenses</CardTitle>
            <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>
              Historical months will populate as data is added
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmt(Number(v)), ""]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>
                  )}
                />
                <Bar dataKey="income" name="Income" fill="var(--accent-green)" radius={[3, 3, 0, 0]} opacity={0.85} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--accent-red)" radius={[3, 3, 0, 0]} opacity={0.85} />
                <Bar dataKey="savings" name="Net Savings" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <CardTitle>Monthly Summary</CardTitle>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Month", "Income", "Expenses", "Net Savings", "Savings Rate"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, i) => {
                  const rate = row.income > 0 ? (row.savings / row.income) * 100 : 0;
                  return (
                    <tr
                      key={row.month}
                      style={{
                        borderBottom:
                          i < monthlyData.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        background: row.isCurrent ? "var(--bg-elevated)" : "transparent",
                      }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                        {row.month}{row.isCurrent ? " (current)" : ""}
                      </td>
                      <td
                        className="px-5 py-3"
                        style={{ color: row.isCurrent ? "var(--accent-green)" : "var(--text-muted)" }}
                      >
                        {row.isCurrent ? fmt(row.income) : "—"}
                      </td>
                      <td
                        className="px-5 py-3"
                        style={{ color: row.isCurrent ? "var(--accent-red)" : "var(--text-muted)" }}
                      >
                        {row.isCurrent ? fmt(row.expenses) : "—"}
                      </td>
                      <td
                        className="px-5 py-3 font-semibold"
                        style={{ color: row.isCurrent ? "var(--accent-blue)" : "var(--text-muted)" }}
                      >
                        {row.isCurrent ? fmt(row.savings) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {row.isCurrent ? (
                          <span
                            style={{
                              color:
                                rate >= 20
                                  ? "var(--accent-green)"
                                  : rate >= 10
                                  ? "var(--accent-amber)"
                                  : "var(--accent-red)",
                            }}
                          >
                            {fmtPct(rate)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Health Score tab ───────────────────────────────────────────────── */}
      {tab === "health-score" && (
        <>
          <div
            className="rounded-xl border p-6 flex items-center gap-8"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div
              className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 flex-shrink-0"
              style={{ borderColor: gradeColors[health.grade] }}
            >
              <span className="text-4xl font-bold" style={{ color: gradeColors[health.grade] }}>
                {health.grade}
              </span>
              <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {health.overall}/100
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                {health.overall >= 85
                  ? "Excellent financial health"
                  : health.overall >= 70
                  ? "Good financial health"
                  : health.overall >= 55
                  ? "Fair financial health"
                  : "Needs attention"}
              </h2>
              {householdName && (
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {householdName}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {health.insights.map((insight, i) => (
                  <p key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    • {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Savings Score"
              value={`${health.savingsScore}/100`}
              sub={fmtPct(summary.savingsRate) + " savings rate"}
              accent={health.savingsScore >= 70 ? "green" : "amber"}
            />
            <StatCard
              title="Debt Score"
              value={`${health.debtScore}/100`}
              sub={fmtPct(summary.debtToIncomeRatio) + " DTI ratio"}
              accent={health.debtScore >= 70 ? "green" : "amber"}
            />
            <StatCard
              title="Cash Flow Score"
              value={`${health.cashFlowScore}/100`}
              sub={fmt(summary.monthlyCashFlow) + "/mo net"}
              accent={health.cashFlowScore >= 70 ? "green" : "amber"}
            />
            <StatCard
              title="Emergency Fund"
              value={`${health.emergencyFundScore}/100`}
              sub={`${emergencyFundMonths.toFixed(1)} months saved`}
              accent={health.emergencyFundScore >= 70 ? "green" : "amber"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <CardTitle>Score Breakdown</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="var(--accent-blue)"
                    fill="var(--accent-blue)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <CardTitle>Scoring Criteria</CardTitle>
              <div className="mt-4 space-y-5">
                {[
                  {
                    label: "Savings Rate",
                    score: health.savingsScore,
                    actual: fmtPct(summary.savingsRate),
                    target: "Target: ≥ 20%",
                    weight: "30%",
                  },
                  {
                    label: "Debt-to-Income",
                    score: health.debtScore,
                    actual: fmtPct(summary.debtToIncomeRatio),
                    target: "Target: ≤ 36%",
                    weight: "25%",
                  },
                  {
                    label: "Monthly Cash Flow",
                    score: health.cashFlowScore,
                    actual: fmt(summary.monthlyCashFlow),
                    target: "Target: positive",
                    weight: "25%",
                  },
                  {
                    label: "Emergency Fund",
                    score: health.emergencyFundScore,
                    actual: `${emergencyFundMonths.toFixed(1)} months`,
                    target: "Target: ≥ 6 months",
                    weight: "20%",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
                        >
                          {item.weight}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{item.actual}</span>
                        <span
                          className="font-semibold w-14 text-right"
                          style={{
                            color:
                              item.score >= 70
                                ? "var(--accent-green)"
                                : item.score >= 40
                                ? "var(--accent-amber)"
                                : "var(--accent-red)",
                          }}
                        >
                          {item.score}/100
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-muted)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.score}%`,
                          background:
                            item.score >= 70
                              ? "var(--accent-green)"
                              : item.score >= 40
                              ? "var(--accent-amber)"
                              : "var(--accent-red)",
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {item.target}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Export tab ─────────────────────────────────────────────────────── */}
      {tab === "export" && (
        <>
          {/* Report config card */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ background: "var(--accent-blue-dim)" }}
                >
                  <FileText size={18} style={{ color: "var(--accent-blue)" }} />
                </span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {householdName ?? "My Household"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    As of {dateLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Scope
                  </label>
                  <select
                    value={scope ?? ""}
                    onChange={(e) => setScope(e.target.value || null)}
                    className="rounded-md px-3 py-1.5 text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      outline: "none",
                    }}
                  >
                    <option value="">Full Household</option>
                    {householdMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    <option value="Joint">Joint</option>
                  </select>
                </div>

                <button
                  onClick={handleGeneratePDF}
                  disabled={generating || selectedSections.size === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                  style={{
                    background: "var(--accent-blue)",
                    color: "#fff",
                    opacity: generating || selectedSections.size === 0 ? 0.5 : 1,
                    cursor: generating || selectedSections.size === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <Download size={15} />
                  {generating
                    ? "Preparing…"
                    : selectedSections.size === 0
                    ? "Select sections"
                    : `Generate PDF${selectedSections.size < 3 ? ` (${selectedSections.size})` : ""}`}
                </button>
              </div>
            </div>
          </div>

          {/* Section previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportSections.map(({ key, icon: Icon, title, items }) => {
              const checked = selectedSections.has(key);
              return (
                <div
                  key={key}
                  onClick={() =>
                    setSelectedSections((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                  className="rounded-xl border p-5 cursor-pointer select-none"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: checked ? "var(--accent-blue)" : "var(--border)",
                    opacity: checked ? 1 : 0.5,
                    transition: "border-color 0.15s, opacity 0.15s",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedSections((prev) => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: "var(--accent-blue)", flexShrink: 0 }}
                    />
                    <Icon
                      size={15}
                      style={{ color: checked ? "var(--accent-blue)" : "var(--text-muted)" }}
                    />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {title}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: "var(--text-muted)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Tip: To save as PDF, choose &ldquo;Save as PDF&rdquo; as the destination in the print
            dialog. Click any section card to include or exclude it from the report.
          </p>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return <ReportsContent />;
}
