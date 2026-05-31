export type FrequencyType =
  | "monthly"
  | "biweekly"
  | "weekly"
  | "annually"
  | "semiannually"
  | "quarterly"
  | "once";

export interface Income {
  id: string;
  name: string;
  amount: number;
  frequency: FrequencyType;
  category: "salary" | "freelance" | "rental" | "investment" | "other";
  owner: string;
  isActive: boolean;
  startDate?: string;
  dataSource?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: FrequencyType;
  category:
    | "housing"
    | "utilities"
    | "food"
    | "transport"
    | "insurance"
    | "healthcare"
    | "education"
    | "entertainment"
    | "subscriptions"
    | "clothing"
    | "personal"
    | "savings"
    | "debt"
    | "other";
  isFixed: boolean;
  isEssential: boolean;
  dataSource?: string;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  category:
    | "real_estate"
    | "vehicle"
    | "investment"
    | "retirement"
    | "cash"
    | "crypto"
    | "other";
  appreciationRate?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  dataSource?: string;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  category:
    | "mortgage"
    | "auto"
    | "student"
    | "credit_card"
    | "personal"
    | "medical"
    | "other";
  lender?: string;
  dueDate?: string;
  dataSource?: string;
  notes?: string;
}

export interface ProjectExpense {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  totalBudget: number;
  amountSpent: number;
  category:
    | "home_improvement"
    | "vacation"
    | "vehicle"
    | "education"
    | "emergency_fund"
    | "other";
  status: "planned" | "in_progress" | "completed" | "cancelled";
  targetDate?: string;
  expenses: ProjectExpense[];
  notes?: string;
}

export type RetirementAccountType =
  | "401k"
  | "roth_401k"
  | "ira"
  | "roth_ira"
  | "403b"
  | "sep_ira"
  | "pension";

export interface RetirementAccount {
  id: string;
  name: string;
  type: RetirementAccountType;
  owner: string;
  balance: number;
  contributionYtd?: number;
  employerMatchPct?: number;
  annualContributionLimit?: number;
  dataSource?: string;
  notes?: string;
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
}

export interface FinancialSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  expenseRatio: number;
}

export interface HealthScore {
  overall: number;
  savingsScore: number;
  debtScore: number;
  cashFlowScore: number;
  emergencyFundScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  insights: string[];
}

export interface BudgetCategory {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
}
