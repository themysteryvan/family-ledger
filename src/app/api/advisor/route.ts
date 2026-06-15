import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 10;

const SYSTEM_PROMPT = `You are a personal financial advisor with access to the user's complete, real financial data. Your job is to give specific, actionable advice using their actual numbers — never generic tips.

Rules:
- Only answer questions about the user's own financial data or personal finance topics — including budgeting, investing, debt payoff, retirement planning, savings, taxes, insurance, and divorce financial planning (asset division, alimony buyout calculations, settlement analysis, what each spouse walks away with, etc.)
- If asked anything clearly unrelated to personal finance — weather, sports, coding, history, recipes, general knowledge, etc. — politely decline and redirect: "I'm only able to help with personal finance questions and your financial data. What would you like to know about your finances?"
- Always reference exact dollar amounts, percentages, and account names from the data provided
- Proactively flag issues even if the user doesn't ask about them (e.g. high-interest debt, low emergency fund, underfunded retirement)
- Be direct and honest — if something looks bad, say so clearly
- Prioritize recommendations by impact (biggest wins first)
- Respond conversationally like a financial advisor talking to a client — use plain prose, not a structured report
- Only use bullet points when listing 3 or more distinct items that genuinely benefit from a list. Never use bullets for 1–2 items, and never write one bullet per sentence when prose flows better
- Never use headers (##, ###) — structure your response through natural paragraph breaks instead
- When asked a question, answer it directly first in plain sentences, then add relevant context
- Format numbers as currency (e.g. $1,234) and percentages with one decimal place
- You may use **bold** for emphasis on key figures or terms, but use it sparingly`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Enforce daily limit for authenticated users
  let remaining: number | null = null;
  if (user) {
    const today = new Date().toISOString().slice(0, 10);

    const { data: row } = await supabase
      .from("daily_message_counts")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const current = row?.count ?? 0;

    if (current >= DAILY_LIMIT) {
      return NextResponse.json({ error: "LIMIT_REACHED", remaining: 0 }, { status: 429 });
    }

    await supabase
      .from("daily_message_counts")
      .upsert(
        { user_id: user.id, date: today, count: current + 1 },
        { onConflict: "user_id,date" }
      );

    remaining = DAILY_LIMIT - (current + 1);
  }

  const { messages, financialContext } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const contextBlock = `<financial_data>
${JSON.stringify(financialContext, null, 2)}
</financial_data>

The above is the user's complete, current financial data. Use it to inform all responses.`;

  const anthropicMessages = messages.map((m: { role: string; content: string }, i: number) => {
    if (i === 0 && m.role === "user") {
      return { role: "user", content: `${contextBlock}\n\n${m.content}` };
    }
    return { role: m.role, content: m.content };
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return NextResponse.json({ reply: text, remaining });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ remaining: null });

  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await supabase
    .from("daily_message_counts")
    .select("count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const used = row?.count ?? 0;
  return NextResponse.json({ remaining: Math.max(0, DAILY_LIMIT - used) });
}
