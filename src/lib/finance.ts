import type {
  Income,
  Expense,
  Asset,
  Debt,
  FinancialSummary,
  HealthScore,
  FrequencyType,
  NetWorthSnapshot,
} from "@/types";

export function filterByOwner<T extends { owner?: string }>(items: T[], filter: string | null): T[] {
  if (filter === null) return items;
  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  const target = norm(filter);
  return items.filter((i) => norm(i.owner) === target);
}

export function toMonthly(amount: number, frequency: FrequencyType): number {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "semiannually":
      return amount / 6;
    case "annually":
      return amount / 12;
    case "once":
      return 0;
    default:
      return amount;
  }
}

export function monthlyIncome(incomes: Income[]): number {
  return incomes
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);
}

export function monthlyExpenses(expenses: Expense[]): number {
  return expenses.reduce(
    (sum, e) => sum + toMonthly(e.amount, e.frequency),
    0
  );
}

export function totalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.balance, 0);
}

export function buildFinancialSummary(
  incomes: Income[],
  expenses: Expense[],
  assets: Asset[],
  debts: Debt[],
  retirementTotal = 0
): FinancialSummary {
  const income = monthlyIncome(incomes);
  const expense = monthlyExpenses(expenses);
  const debtPayments = debts.reduce((sum, d) => sum + (d.minimumPayment ?? 0), 0);
  const assets_ = totalAssets(assets) + retirementTotal;
  const debt = totalDebt(debts);
  const cashFlow = income - expense - debtPayments;

  return {
    monthlyIncome: income,
    monthlyExpenses: expense,
    monthlyCashFlow: cashFlow,
    totalAssets: assets_,
    totalDebt: debt,
    netWorth: assets_ - debt,
    savingsRate: income > 0 ? (cashFlow / income) * 100 : 0,
    debtToIncomeRatio: income > 0 ? (debtPayments / income) * 100 : 0,
    expenseRatio: income > 0 ? (expense / income) * 100 : 0,
  };
}

export function calculateHealthScore(
  summary: FinancialSummary,
  emergencyFundMonths: number
): HealthScore {
  // Savings rate: 20%+ = 100, 10-20% = 70, 0-10% = 40, negative = 0
  const savingsScore =
    summary.savingsRate >= 20
      ? 100
      : summary.savingsRate >= 10
        ? 50 + (summary.savingsRate - 10) * 5
        : summary.savingsRate >= 0
          ? summary.savingsRate * 4
          : 0;

  // Debt-to-income: <15% = 100, 15-36% = 70, 36-50% = 40, >50% = 10
  const debtScore =
    summary.debtToIncomeRatio < 15
      ? 100
      : summary.debtToIncomeRatio < 36
        ? 100 - ((summary.debtToIncomeRatio - 15) / 21) * 30
        : summary.debtToIncomeRatio < 50
          ? 70 - ((summary.debtToIncomeRatio - 36) / 14) * 30
          : 10;

  // Cash flow positive
  const cashFlowScore =
    summary.monthlyCashFlow > 0
      ? Math.min(100, 50 + (summary.monthlyCashFlow / summary.monthlyIncome) * 200)
      : 0;

  // Emergency fund: 6+ months = 100, 3-6 = 70, 1-3 = 40, <1 = 10
  const emergencyFundScore =
    emergencyFundMonths >= 6
      ? 100
      : emergencyFundMonths >= 3
        ? 40 + (emergencyFundMonths - 3) * 10
        : emergencyFundMonths >= 1
          ? 10 + (emergencyFundMonths - 1) * 15
          : 10;

  const overall = Math.round(
    savingsScore * 0.3 +
      debtScore * 0.25 +
      cashFlowScore * 0.25 +
      emergencyFundScore * 0.2
  );

  const grade =
    overall >= 85
      ? "A"
      : overall >= 70
        ? "B"
        : overall >= 55
          ? "C"
          : overall >= 40
            ? "D"
            : "F";

  const insights: string[] = [];
  if (summary.savingsRate < 10)
    insights.push("Savings rate is below the recommended 10-20% threshold.");
  if (summary.savingsRate >= 20)
    insights.push("Excellent savings rate — you're building wealth consistently.");
  if (summary.debtToIncomeRatio > 36)
    insights.push("Debt-to-income ratio is high; consider accelerating debt payoff.");
  if (emergencyFundMonths < 3)
    insights.push("Build your emergency fund to at least 3–6 months of expenses.");
  if (emergencyFundMonths >= 6)
    insights.push("Emergency fund is fully funded — great financial resilience.");
  if (summary.monthlyCashFlow < 0)
    insights.push("Monthly cash flow is negative — review discretionary expenses.");
  if (summary.netWorth > 0)
    insights.push(`Net worth is positive at ${fmt(summary.netWorth)}.`);

  return {
    overall,
    savingsScore: Math.round(savingsScore),
    debtScore: Math.round(debtScore),
    cashFlowScore: Math.round(cashFlowScore),
    emergencyFundScore: Math.round(emergencyFundScore),
    grade,
    insights,
  };
}

export function fmt(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function buildNetWorthHistory(
  currentAssets: number,
  currentDebt: number,
  months = 12
): NetWorthSnapshot[] {
  const history: NetWorthSnapshot[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const factor = 1 - i * 0.008;
    const assetVal = currentAssets * factor * (0.97 + Math.random() * 0.06);
    const debtVal = currentDebt * (1 + i * 0.003);
    history.push({
      date: d.toISOString().slice(0, 7),
      totalAssets: Math.round(assetVal),
      totalDebt: Math.round(debtVal),
      netWorth: Math.round(assetVal - debtVal),
    });
  }
  return history;
}
