import { NextRequest, NextResponse } from "next/server";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
}

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const PROMPT = `You are a financial data extraction assistant. Extract every transaction from this receipt, bank statement screenshot, or financial document image.

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

  const mimeType = (file.type || "image/jpeg").toLowerCase();

  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return NextResponse.json({
      error: "HEIC/HEIF images are not supported. Take a screenshot of the statement instead, or use a JPG/PNG photo.",
    }, { status: 400 });
  }

  const effectiveMime = SUPPORTED_MIME_TYPES.has(mimeType) ? mimeType : "image/jpeg";
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
              type: "image",
              source: {
                type: "base64",
                media_type: effectiveMime as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64,
              },
            },
            { type: "text", text: PROMPT },
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
    return NextResponse.json({ error: "Could not extract transactions from this image." }, { status: 502 });
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
    return NextResponse.json({
      error: "No transactions found in this image. Make sure it shows a bank statement, receipt, or transaction list.",
    }, { status: 422 });
  }

  return NextResponse.json({ transactions });
}
