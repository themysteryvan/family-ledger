import type { Income, Expense, Asset, Debt, Project, RetirementAccount, HouseholdMember } from "@/types";

export const mockHouseholdMembers: HouseholdMember[] = [
  { id: "mem-1", name: "Jake", role: "Primary" },
  { id: "mem-2", name: "Sarah", role: "Spouse" },
  { id: "mem-3", name: "Joint", role: "Shared" },
];

// Henderson family: Jake + Sarah Henderson, 2 kids (Owen 7, Lily 3), dog Biscuit
//
// Income breakdown (~$12,500/mo):
//   Jake salary:      $6,500/mo  ($78k/yr net)
//   Sarah salary:     $4,500/mo  ($54k/yr net, RN)
//   Sarah consulting: $800/mo    (per-diem shifts)
//   Dividends:        $250/mo
//   Jake bonus:       $6,000/yr  ($500/mo amortized)
//   ─────────────────────────────────────────────
//   Total monthly:    $12,550

export const mockIncomes: Income[] = [
  {
    id: "inc-1",
    name: "Jake Salary — Senior Product Manager",
    amount: 6_500,
    frequency: "monthly",
    category: "salary",
    owner: "Jake",
    isActive: true,
    startDate: "2020-04-01",
    notes: "Net after 401(k) pre-tax deduction and federal/state taxes",
  },
  {
    id: "inc-2",
    name: "Sarah Salary — Registered Nurse",
    amount: 4_500,
    frequency: "monthly",
    category: "salary",
    owner: "Sarah",
    isActive: true,
    startDate: "2018-09-10",
  },
  {
    id: "inc-3",
    name: "Sarah Consulting — Healthcare Staffing",
    amount: 800,
    frequency: "monthly",
    category: "freelance",
    owner: "Sarah",
    isActive: true,
    notes: "Per-diem shifts; varies $400–$1,200",
  },
  {
    id: "inc-4",
    name: "Investment Dividends",
    amount: 250,
    frequency: "monthly",
    category: "investment",
    owner: "Joint",
    isActive: true,
    notes: "Brokerage + dividend ETFs",
  },
  {
    id: "inc-5",
    name: "Jake Annual Performance Bonus",
    amount: 6_000,
    frequency: "annually",
    category: "salary",
    owner: "Jake",
    isActive: true,
    notes: "Paid in March; ~8% of base",
  },
];

// Expense breakdown (~$7,200/mo):
// Note: mortgage, car payment, and student loan are tracked as Debts, not here.
// Savings contributions (401k, Roth IRA, emergency fund) are handled separately.
//
//   Housing ops:  $1,010  (HOA, property tax, maintenance)
//   Utilities:      $460  (electric, gas, water, internet, phone)
//   Food:         $1,520  (groceries + dining)
//   Transport:      $500  (gas, insurance, registration)
//   Kids:         $1,810  (daycare, activities, supplies)
//   Healthcare:     $825  (premiums, copays, vet)
//   Insurance:      $230  (home, life, umbrella)
//   Entertainment:  $395  (streaming, outings, gym)
//   Personal:       $450  (clothing, personal care, misc)
//   ─────────────────────────────────────────────────
//   Total:        ~$7,200

export const mockExpenses: Expense[] = [
  // ── Housing (operations only — mortgage is in Debts) ───────────────────────
  {
    id: "exp-1",
    name: "HOA Fees",
    amount: 210,
    frequency: "monthly",
    category: "housing",
    isFixed: true,
    isEssential: true,
  },
  {
    id: "exp-2",
    name: "Property Taxes",
    amount: 5_850,
    frequency: "annually",
    category: "housing",
    isFixed: true,
    isEssential: true,
    notes: "Escrowed; shown here for budgeting visibility",
  },
  {
    id: "exp-3",
    name: "Home Maintenance",
    amount: 320,
    frequency: "monthly",
    category: "housing",
    isFixed: false,
    isEssential: true,
    notes: "1% rule annualized + misc repairs",
  },

  // ── Utilities ──────────────────────────────────────────────────────────────
  {
    id: "exp-4",
    name: "Electricity",
    amount: 148,
    frequency: "monthly",
    category: "utilities",
    isFixed: false,
    isEssential: true,
  },
  {
    id: "exp-5",
    name: "Natural Gas",
    amount: 72,
    frequency: "monthly",
    category: "utilities",
    isFixed: false,
    isEssential: true,
  },
  {
    id: "exp-6",
    name: "Water & Sewer",
    amount: 60,
    frequency: "monthly",
    category: "utilities",
    isFixed: false,
    isEssential: true,
  },
  {
    id: "exp-7",
    name: "Internet — Xfinity Gigabit",
    amount: 80,
    frequency: "monthly",
    category: "utilities",
    isFixed: true,
    isEssential: true,
  },
  {
    id: "exp-8",
    name: "Cell Phones (2 lines) — T-Mobile",
    amount: 100,
    frequency: "monthly",
    category: "utilities",
    isFixed: true,
    isEssential: true,
  },

  // ── Food ───────────────────────────────────────────────────────────────────
  {
    id: "exp-9",
    name: "Groceries",
    amount: 1_100,
    frequency: "monthly",
    category: "food",
    isFixed: false,
    isEssential: true,
    notes: "Family of 4 + meal prep; Costco + Kroger",
  },
  {
    id: "exp-10",
    name: "Dining Out & Takeout",
    amount: 420,
    frequency: "monthly",
    category: "food",
    isFixed: false,
    isEssential: false,
    notes: "Date nights + family weekends",
  },

  // ── Transport (gas + insurance — car payments are in Debts) ───────────────
  {
    id: "exp-11",
    name: "Gas & Fuel (2 vehicles)",
    amount: 230,
    frequency: "monthly",
    category: "transport",
    isFixed: false,
    isEssential: true,
  },
  {
    id: "exp-12",
    name: "Auto Insurance (2 vehicles) — Progressive",
    amount: 2_760,
    frequency: "annually",
    category: "insurance",
    isFixed: true,
    isEssential: true,
    notes: "6-month policy; full coverage on both",
  },
  {
    id: "exp-13",
    name: "Vehicle Registration & Fees",
    amount: 480,
    frequency: "annually",
    category: "transport",
    isFixed: true,
    isEssential: true,
  },

  // ── Kids ───────────────────────────────────────────────────────────────────
  {
    id: "exp-14",
    name: "Daycare — Lily (age 3)",
    amount: 1_380,
    frequency: "monthly",
    category: "education",
    isFixed: true,
    isEssential: true,
    notes: "Full-time daycare center; ends 2027",
  },
  {
    id: "exp-15",
    name: "After-school & Activities — Owen (age 7)",
    amount: 310,
    frequency: "monthly",
    category: "education",
    isFixed: false,
    isEssential: true,
    notes: "Soccer league + piano lessons",
  },
  {
    id: "exp-16",
    name: "School Supplies & Kids Clothing",
    amount: 120,
    frequency: "monthly",
    category: "education",
    isFixed: false,
    isEssential: true,
  },

  // ── Healthcare ─────────────────────────────────────────────────────────────
  {
    id: "exp-17",
    name: "Health Insurance Premium (family) — BCBS",
    amount: 510,
    frequency: "monthly",
    category: "healthcare",
    isFixed: true,
    isEssential: true,
    notes: "Jake employer-sponsored PPO plan",
  },
  {
    id: "exp-18",
    name: "Dental & Vision Insurance",
    amount: 72,
    frequency: "monthly",
    category: "healthcare",
    isFixed: true,
    isEssential: true,
  },
  {
    id: "exp-19",
    name: "Medical Copays & Prescriptions",
    amount: 138,
    frequency: "monthly",
    category: "healthcare",
    isFixed: false,
    isEssential: true,
  },
  {
    id: "exp-20",
    name: "Vet & Pet Insurance — Biscuit",
    amount: 105,
    frequency: "monthly",
    category: "healthcare",
    isFixed: false,
    isEssential: true,
    notes: "Golden Retriever; wellness plan + emergency coverage",
  },

  // ── Insurance ──────────────────────────────────────────────────────────────
  {
    id: "exp-21",
    name: "Homeowner's Insurance",
    amount: 1_680,
    frequency: "annually",
    category: "insurance",
    isFixed: true,
    isEssential: true,
  },
  {
    id: "exp-22",
    name: "Term Life Insurance — Jake ($750k)",
    amount: 480,
    frequency: "annually",
    category: "insurance",
    isFixed: true,
    isEssential: true,
    notes: "20yr policy — Haven Life",
  },
  {
    id: "exp-23",
    name: "Term Life Insurance — Sarah ($500k)",
    amount: 360,
    frequency: "annually",
    category: "insurance",
    isFixed: true,
    isEssential: true,
    notes: "20yr policy",
  },
  {
    id: "exp-24",
    name: "Umbrella Liability Policy",
    amount: 240,
    frequency: "annually",
    category: "insurance",
    isFixed: true,
    isEssential: true,
    notes: "$1M coverage",
  },

  // ── Entertainment ──────────────────────────────────────────────────────────
  {
    id: "exp-25",
    name: "Streaming (Netflix + Disney+ + Spotify)",
    amount: 54,
    frequency: "monthly",
    category: "entertainment",
    isFixed: true,
    isEssential: false,
  },
  {
    id: "exp-26",
    name: "Family Outings & Events",
    amount: 290,
    frequency: "monthly",
    category: "entertainment",
    isFixed: false,
    isEssential: false,
    notes: "Movies, parks, weekend day-trips",
  },
  {
    id: "exp-27",
    name: "Gym Memberships (Jake + Sarah)",
    amount: 51,
    frequency: "monthly",
    category: "entertainment",
    isFixed: true,
    isEssential: false,
  },

  // ── Personal & Household ───────────────────────────────────────────────────
  {
    id: "exp-28",
    name: "Clothing — Adults",
    amount: 140,
    frequency: "monthly",
    category: "personal",
    isFixed: false,
    isEssential: false,
  },
  {
    id: "exp-29",
    name: "Personal Care & Hair",
    amount: 110,
    frequency: "monthly",
    category: "personal",
    isFixed: false,
    isEssential: false,
  },
  {
    id: "exp-30",
    name: "Amazon & Household Supplies",
    amount: 95,
    frequency: "monthly",
    category: "personal",
    isFixed: false,
    isEssential: false,
  },
  {
    id: "exp-31",
    name: "Dog Food & Supplies — Biscuit",
    amount: 105,
    frequency: "monthly",
    category: "personal",
    isFixed: false,
    isEssential: true,
  },
];

// Assets:
//   Regular assets:   $732k  (home equity, brokerage, cash, vehicles, 529s)
//   Retirement accts: $186k  (tracked separately in mockRetirementAccounts)
//   Total assets:     $918k
//   Total debts:      $432k
//   Net worth:       ~$486k

export const mockAssets: Asset[] = [
  {
    id: "ast-1",
    name: "Primary Residence — 218 Birchwood Ln",
    value: 590_000,
    category: "real_estate",
    appreciationRate: 4.5,
    purchasePrice: 430_000,
    purchaseDate: "2021-08-20",
    notes: "4BR/3BA suburban home",
  },
  {
    id: "ast-2",
    name: "Joint Brokerage — Fidelity",
    value: 39_500,
    category: "investment",
    appreciationRate: 8.0,
    notes: "FZROX + FXNAX + dividend ETFs",
  },
  {
    id: "ast-3",
    name: "High-Yield Savings — SoFi",
    value: 24_500,
    category: "cash",
    notes: "Emergency fund — 4.6% APY",
  },
  {
    id: "ast-4",
    name: "Joint Checking — Chase",
    value: 9_800,
    category: "cash",
  },
  {
    id: "ast-5",
    name: "2023 Honda Accord Sport",
    value: 26_400,
    category: "vehicle",
    purchasePrice: 34_200,
    purchaseDate: "2023-01-15",
    appreciationRate: -15,
  },
  {
    id: "ast-6",
    name: "2020 Toyota RAV4 XLE",
    value: 18_900,
    category: "vehicle",
    purchasePrice: 31_500,
    purchaseDate: "2020-03-08",
    appreciationRate: -12,
  },
  {
    id: "ast-7",
    name: "529 Plan — Owen",
    value: 15_200,
    category: "investment",
    appreciationRate: 6.5,
    notes: "Age-based index portfolio",
  },
  {
    id: "ast-8",
    name: "529 Plan — Lily",
    value: 7_400,
    category: "investment",
    appreciationRate: 6.5,
    notes: "Age-based index portfolio",
  },
];

// Debt minimum payments: $2,650 + $485 + $295 + $35 = $3,465/mo (~$3,800 target)
// Mortgage is the dominant driver; will be ~$3,500 total with a small extra payment.

export const mockDebts: Debt[] = [
  {
    id: "dbt-1",
    name: "Mortgage — 218 Birchwood Ln",
    balance: 384_500,
    originalBalance: 430_000,
    interestRate: 7.125,
    minimumPayment: 2_890,
    category: "mortgage",
    lender: "US Bank",
    notes: "30yr fixed, originated Aug 2021; includes PITI",
  },
  {
    id: "dbt-2",
    name: "Auto Loan — Honda Accord",
    balance: 22_400,
    originalBalance: 30_000,
    interestRate: 6.4,
    minimumPayment: 485,
    category: "auto",
    lender: "Honda Financial Services",
  },
  {
    id: "dbt-3",
    name: "Student Loan — Sarah (Federal)",
    balance: 18_900,
    originalBalance: 32_000,
    interestRate: 4.99,
    minimumPayment: 295,
    category: "student",
    lender: "MOHELA",
    notes: "Income-driven repayment plan",
  },
  {
    id: "dbt-4",
    name: "Chase Sapphire Preferred",
    balance: 1_420,
    originalBalance: 1_420,
    interestRate: 22.99,
    minimumPayment: 35,
    category: "credit_card",
    lender: "Chase",
    notes: "Paid in full monthly — current balance",
  },
];

export const mockRetirementAccounts: RetirementAccount[] = [
  {
    id: "ret-1",
    name: "Jake 401(k) — Fidelity",
    type: "401k",
    owner: "Jake",
    balance: 131_500,
    contributionYtd: 4_500,
    employerMatchPct: 4,
    annualContributionLimit: 23_000,
    notes: "Invested in target-date 2055 fund",
  },
  {
    id: "ret-2",
    name: "Sarah Roth IRA — Vanguard",
    type: "roth_ira",
    owner: "Sarah",
    balance: 54_800,
    contributionYtd: 3_500,
    annualContributionLimit: 7_000,
    notes: "VTSAX + VTIAX (80/20)",
  },
];

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Backyard Deck & Patio",
    description: "Cedar deck + stamped concrete patio with pergola",
    totalBudget: 22_000,
    amountSpent: 7_800,
    category: "home_improvement",
    status: "in_progress",
    targetDate: "2026-09-15",
    expenses: [
      { id: "pe-1", name: "Design & permits", amount: 1_400, isPaid: true },
      { id: "pe-2", name: "Materials deposit", amount: 6_400, isPaid: true },
      { id: "pe-3", name: "Concrete & labor", amount: 7_200, isPaid: false },
      { id: "pe-4", name: "Pergola kit", amount: 3_800, isPaid: false },
      { id: "pe-5", name: "Landscaping & lighting", amount: 3_200, isPaid: false },
    ],
  },
  {
    id: "proj-2",
    name: "Family Vacation — Pacific Northwest",
    description: "8-day road trip: Portland → Olympic NP → Seattle",
    totalBudget: 7_500,
    amountSpent: 1_200,
    category: "vacation",
    status: "in_progress",
    targetDate: "2026-08-01",
    expenses: [
      { id: "pe-6", name: "Hotel bookings", amount: 1_200, isPaid: true },
      { id: "pe-7", name: "National Park passes", amount: 120, isPaid: false },
      { id: "pe-8", name: "Gas & rental car", amount: 980, isPaid: false },
      { id: "pe-9", name: "Food & dining", amount: 1_600, isPaid: false },
      { id: "pe-10", name: "Activities & tours", amount: 1_400, isPaid: false },
      { id: "pe-11", name: "Misc & souvenirs", amount: 500, isPaid: false },
    ],
  },
  {
    id: "proj-3",
    name: "Emergency Fund — 6-Month Goal",
    description: "Build HYSA to $25,000 (6 months of core expenses)",
    totalBudget: 25_000,
    amountSpent: 24_500,
    category: "emergency_fund",
    status: "in_progress",
    expenses: [],
    notes: "Almost there — $500 remaining at $400/mo",
  },
  {
    id: "proj-4",
    name: "New Roof",
    description: "Replace 18-yr-old asphalt shingle roof",
    totalBudget: 14_000,
    amountSpent: 0,
    category: "home_improvement",
    status: "planned",
    targetDate: "2027-05-01",
    expenses: [],
    notes: "3 quotes received: $12,800–$15,400",
  },
];
