import { NextRequest, NextResponse } from "next/server";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
}

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

  // Dynamic import avoids pdf-parse reading test files at module load time
  const { default: pdfParse } = await import("pdf-parse") as unknown as { default: (buf: Buffer) => Promise<{ text: string }> };
  const buffer = Buffer.from(await file.arrayBuffer());

  let pdfText: string;
  try {
    const { text } = await pdfParse(buffer);
    pdfText = text;
  } catch {
    return NextResponse.json({ error: "Failed to read PDF. Make sure it is a text-based PDF, not a scanned image." }, { status: 422 });
  }

  if (!pdfText.trim()) {
    return NextResponse.json({ error: "No text found in PDF. It may be a scanned image — please use a text-based PDF or CSV instead." }, { status: 422 });
  }

  // Truncate to avoid exceeding token limits (~120k chars ≈ 30k tokens)
  const truncated = pdfText.slice(0, 120_000);

  const prompt = `You are a financial data extraction assistant. Extract every transaction from the bank or credit card statement text below.

Return ONLY a JSON array — no explanation, no markdown. Each element must have exactly these fields:
- "date": the transaction date as a string (e.g. "2026-05-01"), or "" if not found
- "description": the merchant or transaction description
- "amount": the transaction amount as a positive number (expenses only — skip deposits/credits/payments)

Rules:
- Skip transfers between accounts, payments to the card itself, and credits/refunds
- Skip opening/closing balances, interest charges, and fees — unless they are clearly a merchant charge
- If a row has both a debit and credit column, only include rows where the debit/expense column is populated
- Amounts should be positive numbers (no minus signs)
- Do not include duplicates

Statement text:
${truncated}

Return only the JSON array, starting with [ and ending with ].`;

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
      messages: [{ role: "user", content: prompt }],
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
    return NextResponse.json({ error: "No transactions found in this PDF. It may not be a bank statement, or it may be a scanned image." }, { status: 422 });
  }

  return NextResponse.json({ transactions });
}
