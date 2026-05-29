import { NextRequest, NextResponse } from "next/server";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
}

const PROMPT = `You are a financial data extraction assistant. Extract every transaction from this bank or credit card statement.

Return ONLY a JSON array — no explanation, no markdown fences. Each element must have exactly these fields:
- "date": the transaction date as a string (e.g. "2026-05-01"), or "" if not found
- "description": the merchant or transaction description
- "amount": the transaction amount as a positive number (expenses only)

Rules:
- Skip transfers between accounts, payments to the card itself, and credits/refunds
- Skip opening/closing balances
- If a row has both debit and credit columns, only include rows where the debit/expense column is populated
- Amounts must be positive numbers (no minus signs)
- No duplicates

Return only the JSON array, starting with [ and ending with ].`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Encode PDF as base64 and send directly to Claude — no pdf-parse needed
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  const text = (data.content?.[0]?.text ?? "") as string;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse transactions from PDF. Claude returned an unexpected response." }, { status: 502 });
  }

  let transactions: ParsedTransaction[];
  try {
    const raw = JSON.parse(jsonMatch[0]) as Array<{ date?: string; description?: string; amount?: number }>;
    transactions = raw
      .filter((t) => t.description && typeof t.amount === "number" && t.amount > 0)
      .map((t) => ({
        date: String(t.date ?? ""),
        description: String(t.description ?? "").trim(),
        amount: Number(t.amount),
      }));
  } catch {
    return NextResponse.json({ error: "Failed to parse extracted transactions." }, { status: 502 });
  }

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No transactions found in this PDF. Make sure it is a bank or credit card statement." }, { status: 422 });
  }

  return NextResponse.json({ transactions });
}
