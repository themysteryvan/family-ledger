"use client";

import { HeartPulse } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { buildFinancialSummary, calculateHealthScore, fmt, fmtPct } from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";

const gradeColors: Record<string, string> = {
  A: "var(--accent-green)",
  B: "var(--accent-blue)",
  C: "var(--accent-amber)",
  D: "var(--accent-amber)",
  F: "var(--accent-red)",
};

export default function HealthScorePage() {
  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);
  const assets = useFinanceStore((s) => s.assets);
  const debts = useFinanceStore((s) => s.debts);
  const retirementAccounts = useFinanceStore((s) => s.retirementAccounts);
  const householdName = useFinanceStore((s) => s.householdName);

  const retirementTotal = retirementAccounts.reduce((s, a) => s + a.balance, 0);
  const summary = buildFinancialSummary(incomes, expenses, assets, debts, retirementTotal);
  const liquidCash = assets.filter((a) => a.category === "cash").reduce((s, a) => s + a.value, 0);
  const emergencyFundMonths = summary.monthlyExpenses > 0 ? liquidCash / summary.monthlyExpenses : 0;
  const health = calculateHealthScore(summary, emergencyFundMonths);

  const radarData = [
    { subject: "Savings", score: health.savingsScore },
    { subject: "Debt", score: health.debtScore },
    { subject: "Cash Flow", score: health.cashFlowScore },
    { subject: "Emergency\nFund", score: health.emergencyFundScore },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Financial Health Score
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Overall financial wellness assessment
        </p>
      </div>

      <div className="rounded-xl border p-6 flex items-center gap-8" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 flex-shrink-0" style={{ borderColor: gradeColors[health.grade] }}>
          <span className="text-4xl font-bold" style={{ color: gradeColors[health.grade] }}>{health.grade}</span>
          <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{health.overall}/100</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {health.overall >= 85 ? "Excellent financial health" : health.overall >= 70 ? "Good financial health" : health.overall >= 55 ? "Fair financial health" : "Needs attention"}
          </h2>
          {householdName && (
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{householdName}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {health.insights.map((insight, i) => (
              <p key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>• {insight}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Savings Score" value={`${health.savingsScore}/100`} sub={fmtPct(summary.savingsRate) + " savings rate"} accent={health.savingsScore >= 70 ? "green" : "amber"} />
        <StatCard title="Debt Score" value={`${health.debtScore}/100`} sub={fmtPct(summary.debtToIncomeRatio) + " DTI ratio"} accent={health.debtScore >= 70 ? "green" : "amber"} />
        <StatCard title="Cash Flow Score" value={`${health.cashFlowScore}/100`} sub={fmt(summary.monthlyCashFlow) + "/mo net"} accent={health.cashFlowScore >= 70 ? "green" : "amber"} />
        <StatCard title="Emergency Fund" value={`${health.emergencyFundScore}/100`} sub={`${emergencyFundMonths.toFixed(1)} months saved`} accent={health.emergencyFundScore >= 70 ? "green" : "amber"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Score Breakdown</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Scoring Criteria</CardTitle>
          <div className="mt-4 space-y-5">
            {[
              { label: "Savings Rate", score: health.savingsScore, actual: fmtPct(summary.savingsRate), target: "Target: ≥ 20%", weight: "30%" },
              { label: "Debt-to-Income", score: health.debtScore, actual: fmtPct(summary.debtToIncomeRatio), target: "Target: ≤ 36%", weight: "25%" },
              { label: "Monthly Cash Flow", score: health.cashFlowScore, actual: fmt(summary.monthlyCashFlow), target: "Target: positive", weight: "25%" },
              { label: "Emergency Fund", score: health.emergencyFundScore, actual: `${emergencyFundMonths.toFixed(1)} months`, target: "Target: ≥ 6 months", weight: "20%" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>{item.weight}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{item.actual}</span>
                    <span className="font-semibold w-14 text-right" style={{ color: item.score >= 70 ? "var(--accent-green)" : item.score >= 40 ? "var(--accent-amber)" : "var(--accent-red)" }}>{item.score}/100</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.score >= 70 ? "var(--accent-green)" : item.score >= 40 ? "var(--accent-amber)" : "var(--accent-red)" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
