import type { Income, Expense, Asset, Debt, Project, ProjectExpense, RetirementAccount } from "@/types";

// ── Row types (snake_case matching actual Supabase columns) ───────────────────

export interface IncomeRow {
  id: string; household_id: string; name: string; amount: number;
  frequency: string; type: string; guaranteed: boolean;
  start_date: string | null; data_source: string | null; notes: string | null;
}
export interface ExpenseRow {
  id: string; household_id: string; name: string; amount: number;
  frequency: string; category: string; fixed: boolean;
  essential: boolean; data_source: string | null; notes: string | null;
}
export interface AssetRow {
  id: string; household_id: string; name: string; type: string;
  value: number; owner: string | null; institution: string | null;
  liquidity: string | null; data_source: string | null; notes: string | null;
}
export interface DebtRow {
  id: string; household_id: string; name: string; type: string;
  original_balance: number; current_balance: number; interest_rate: number;
  minimum_payment: number; data_source: string | null; notes: string | null;
}
export interface RetirementAccountRow {
  id: string; household_id: string; name: string; type: string;
  owner: string; current_balance: number; monthly_contribution: number | null;
  employer_match: number | null; institution: string | null;
  data_source: string | null; notes: string | null;
}
export interface ProjectRow {
  id: string; household_id: string; name: string; description: string | null;
  target_amount: number; current_amount: number; category: string;
  target_date: string | null; notes: string | null;
}
export interface ProjectExpenseRow {
  id: string; project_id: string; name: string; amount: number;
  is_paid: boolean; due_date: string | null;
}

// ── To domain ────────────────────────────────────────────────────────────────

export const toIncome = (r: IncomeRow): Income => ({
  id: r.id, name: r.name, amount: r.amount,
  frequency: r.frequency as Income["frequency"],
  category: r.type as Income["category"],
  owner: "",
  isActive: r.guaranteed,
  startDate: r.start_date ?? undefined,
  dataSource: r.data_source ?? "Manual Entry",
  notes: r.notes ?? undefined,
});

export const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id, name: r.name, amount: r.amount,
  frequency: r.frequency as Expense["frequency"],
  category: r.category as Expense["category"],
  isFixed: r.fixed, isEssential: r.essential,
  dataSource: r.data_source ?? "Manual Entry",
  notes: r.notes ?? undefined,
});

export const toAsset = (r: AssetRow): Asset => ({
  id: r.id, name: r.name, value: r.value,
  category: r.type as Asset["category"],
  dataSource: r.data_source ?? "Manual Entry",
  notes: r.notes ?? undefined,
});

export const toDebt = (r: DebtRow): Debt => ({
  id: r.id, name: r.name,
  balance: r.current_balance,
  originalBalance: r.original_balance,
  interestRate: r.interest_rate,
  minimumPayment: r.minimum_payment,
  category: r.type as Debt["category"],
  dataSource: r.data_source ?? "Manual Entry",
  notes: r.notes ?? undefined,
});

export const toRetirementAccount = (r: RetirementAccountRow): RetirementAccount => ({
  id: r.id, name: r.name,
  type: r.type as RetirementAccount["type"],
  owner: r.owner,
  balance: r.current_balance,
  contributionYtd: r.monthly_contribution ?? undefined,
  employerMatchPct: r.employer_match ?? undefined,
  dataSource: r.data_source ?? "Manual Entry",
  notes: r.notes ?? undefined,
});

export const toProjectExpense = (r: ProjectExpenseRow): ProjectExpense => ({
  id: r.id, name: r.name, amount: r.amount,
  isPaid: r.is_paid, dueDate: r.due_date ?? undefined,
});

export const toProject = (r: ProjectRow): Project => ({
  id: r.id, name: r.name,
  description: r.description ?? undefined,
  totalBudget: r.target_amount,
  amountSpent: r.current_amount,
  category: r.category as Project["category"],
  status: "planned",
  targetDate: r.target_date ?? undefined,
  notes: r.notes ?? undefined,
  expenses: [],
});

// ── To row (omit id and household_id — provided separately) ─────────────────

export const fromIncome = (item: Omit<Income, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, amount: item.amount,
  frequency: item.frequency,
  type: item.category,
  guaranteed: item.isActive,
  start_date: item.startDate ?? null,
  data_source: item.dataSource ?? null,
  notes: item.notes ?? null,
});

export const fromExpense = (item: Omit<Expense, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, amount: item.amount,
  frequency: item.frequency, category: item.category,
  fixed: item.isFixed, essential: item.isEssential,
  data_source: item.dataSource ?? null,
  notes: item.notes ?? null,
});

export const fromAsset = (item: Omit<Asset, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, value: item.value,
  type: item.category,
  owner: null, institution: null, liquidity: null,
  data_source: item.dataSource ?? null,
  notes: item.notes ?? null,
});

export const fromDebt = (item: Omit<Debt, "id">, householdId: string) => ({
  household_id: householdId, name: item.name,
  type: item.category,
  original_balance: item.originalBalance,
  current_balance: item.balance,
  interest_rate: item.interestRate,
  minimum_payment: item.minimumPayment,
  data_source: item.dataSource ?? null,
  notes: item.notes ?? null,
});

export const fromRetirementAccount = (item: Omit<RetirementAccount, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, type: item.type,
  owner: item.owner,
  current_balance: item.balance,
  monthly_contribution: item.contributionYtd ?? null,
  employer_match: item.employerMatchPct ?? null,
  institution: null,
  data_source: item.dataSource ?? null,
  notes: item.notes ?? null,
});

export const fromProject = (item: Omit<Project, "id" | "expenses">, householdId: string) => ({
  household_id: householdId, name: item.name,
  description: item.description ?? null,
  category: item.category,
  target_amount: item.totalBudget,
  current_amount: item.amountSpent,
  target_date: item.targetDate ?? null,
  notes: item.notes ?? null,
});
