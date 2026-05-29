"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, RotateCcw, User } from "lucide-react";
import { useFinanceStore } from "@/store/finance-store";
import { buildFinancialSummary, toMonthly } from "@/lib/finance";
import type { Income, Expense, Asset, Debt, Project } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What's the biggest financial risk I should address right now?",
  "Am I on track to retire comfortably?",
  "Which debt should I pay off first and why?",
  "How does my savings rate compare to where I should be?",
  "What would happen to our finances if one of us lost our job?",
  "Should I be investing more instead of paying down debt?",
];

function buildFinancialContext(
  incomes: Income[],
  expenses: Expense[],
  assets: Asset[],
  debts: Debt[],
  projects: Project[],
) {
  const summary = buildFinancialSummary(incomes, expenses, assets, debts);

  const expensesByCategory = expenses.reduce((acc, e) => {
    const m = toMonthly(e.amount, e.frequency);
    acc[e.category] = (acc[e.category] || 0) + m;
    return acc;
  }, {} as Record<string, number>);

  return {
    summary: {
      monthlyIncome: Math.round(summary.monthlyIncome),
      monthlyExpenses: Math.round(summary.monthlyExpenses),
      monthlyCashFlow: Math.round(summary.monthlyCashFlow),
      totalAssets: Math.round(summary.totalAssets),
      totalDebt: Math.round(summary.totalDebt),
      netWorth: Math.round(summary.netWorth),
      savingsRate: Math.round(summary.savingsRate * 10) / 10,
      debtToIncomeRatio: Math.round(summary.debtToIncomeRatio * 10) / 10,
      expenseRatio: Math.round(summary.expenseRatio * 10) / 10,
    },
    incomes: incomes.map((i) => ({
      name: i.name,
      owner: i.owner,
      amount: i.amount,
      frequency: i.frequency,
      category: i.category,
      isActive: i.isActive,
      monthlyEquivalent: Math.round(toMonthly(i.amount, i.frequency)),
    })),
    expensesByCategory: Object.fromEntries(
      Object.entries(expensesByCategory).map(([k, v]) => [k, Math.round(v)])
    ),
    expenses: expenses.map((e) => ({
      name: e.name,
      amount: e.amount,
      frequency: e.frequency,
      category: e.category,
      isFixed: e.isFixed,
      isEssential: e.isEssential,
      monthlyEquivalent: Math.round(toMonthly(e.amount, e.frequency)),
    })),
    assets: assets.map((a) => ({
      name: a.name,
      value: a.value,
      category: a.category,
      purchasePrice: a.purchasePrice,
      appreciationRate: a.appreciationRate,
    })),
    debts: debts.map((d) => ({
      name: d.name,
      balance: d.balance,
      originalBalance: d.originalBalance,
      interestRate: d.interestRate,
      minimumPayment: d.minimumPayment,
      category: d.category,
      lender: d.lender,
      percentPaid: d.originalBalance > 0
        ? Math.round(((d.originalBalance - d.balance) / d.originalBalance) * 100)
        : 0,
    })),
    projects: projects.map((p) => ({
      name: p.name,
      totalBudget: p.totalBudget,
      amountSpent: p.amountSpent,
      status: p.status,
      category: p.category,
      targetDate: p.targetDate,
    })),
  };
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const formatted = message.content
    // Bold — green for assistant, white for user
    .replace(
      /\*\*(.*?)\*\*/g,
      isUser
        ? "<strong style=\"color:#fff;font-weight:600\">$1</strong>"
        : "<strong style=\"color:var(--accent-green);font-weight:600\">$1</strong>"
    )
    // h3 / h2 headers — section dividers
    .replace(
      /^### (.+)$/gm,
      '<p style="color:var(--text-primary);font-size:0.8rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-top:1.25rem;margin-bottom:0.5rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border-subtle)">$1</p>'
    )
    .replace(
      /^## (.+)$/gm,
      '<p style="color:var(--text-primary);font-size:0.8rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-top:1.25rem;margin-bottom:0.5rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border-subtle)">$1</p>'
    )
    // Bullet items
    .replace(
      /^- (.+)$/gm,
      '<li style="color:var(--text-primary);line-height:1.7;padding-left:0.25rem">$1</li>'
    )
    .replace(
      /(<li[\s\S]*?<\/li>)+/g,
      (match) => `<ul style="list-style-type:disc;padding-left:1.25rem;margin:0.75rem 0;display:flex;flex-direction:column;gap:0.35rem">${match}</ul>`
    )
    // Paragraph breaks
    .replace(/\n\n/g, '<div style="height:0.75rem"></div>')
    .replace(/\n/g, "<br />");

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: isUser ? "var(--accent-blue-dim)" : "var(--accent-purple-dim)" }}
      >
        {isUser
          ? <User size={15} style={{ color: "var(--accent-blue)" }} />
          : <Sparkles size={15} style={{ color: "var(--accent-purple)" }} />
        }
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-5 py-4 ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
        style={{
          background: isUser ? "var(--accent-blue)" : "var(--bg-elevated)",
          color: isUser ? "#fff" : "var(--text-secondary)",
          fontSize: "0.9rem",
          lineHeight: "1.75",
          border: isUser ? "none" : "1px solid var(--border-subtle)",
        }}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    </div>
  );
}

export default function AdvisorPage() {
  const { incomes, expenses, assets, debts, projects } = useFinanceStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  async function send(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: content.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const financialContext = buildFinancialContext(incomes, expenses, assets, debts, projects);
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          financialContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Request failed");
      }

      const { reply } = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, something went wrong: ${e instanceof Error ? e.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Financial Advisor
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            AI advisor with access to your complete financial picture
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
          >
            <RotateCcw size={13} /> New chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4" style={{ background: "var(--accent-purple-dim)" }}>
                <Sparkles size={26} style={{ color: "var(--accent-purple)" }} />
              </div>
              <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>Your AI financial advisor</h2>
              <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--text-muted)" }}>
                Ask anything about your finances. I have access to all your income, expenses, assets, debts, and projects.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left text-sm px-4 py-3 rounded-xl border transition-colors hover:border-[var(--accent-blue)]"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--accent-purple-dim)" }}>
                  <Sparkles size={14} style={{ color: "var(--accent-purple)" }} />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm text-sm" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing your finances…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3">
        <div
          className="flex items-end gap-3 rounded-xl border px-4 py-3"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your finances… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
            style={{ color: "var(--text-primary)", minHeight: "24px", maxHeight: "160px" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 transition-opacity"
            style={{ background: "var(--accent-blue)" }}
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" style={{ color: "#fff" }} />
              : <Send size={15} style={{ color: "#fff" }} />
            }
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          Financial advice is AI-generated and for informational purposes only. Consult a licensed advisor for major decisions.
        </p>
      </div>
    </div>
  );
}
