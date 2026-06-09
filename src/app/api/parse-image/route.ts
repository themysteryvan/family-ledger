import { NextRequest, NextResponse } from "next/server";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
}

// Anthropic vision API accepts exactly these four media_type values.
const ANTHROPIC_MIME_MAP: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg":  "image/jpeg", // normalize — Anthropic rejects "image/jpg"
  "image/png":  "image/png",
  "image/gif":  "image/gif",
  "image/webp": "image/webp",
};

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

  const rawMime = (file.type || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  // Reject HEIC by MIME type or file extension — iOS camera often sends empty type for HEIC
  const isHeic = rawMime === "image/heic" || rawMime === "image/heif" || ext === "heic" || ext === "heif";
  if (isHeic) {
    return NextResponse.json({
      error: "HEIC/HEIF images are not supported by the AI vision API. Take a screenshot instead, or export as JPG/PNG.",
    }, { status: 400 });
  }

  const effectiveMime = ANTHROPIC_MIME_MAP[rawMime] ?? ANTHROPIC_MIME_MAP[`image/${ext}`];
  if (!effectiveMime) {
    return NextResponse.json({
      error: `Unsupported image type "${rawMime || ext || "unknown"}". Please use JPG, PNG, GIF, or WebP.`,
    }, { status: 400 });
  }

  console.log(`[parse-image] file="${file.name}" rawMime="${rawMime}" effectiveMime="${effectiveMime}" size=${file.size}`);
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
                media_type: effectiveMime,
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
    const errText = await res.text();
    console.error("[parse-image] Anthropic API error", res.status, errText);
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${errText}` }, { status: 502 });
  }

  const data = await res.json();
  console.log("[parse-image] Anthropic response:", JSON.stringify(data).slice(0, 500));
  const text = (data.content?.[0]?.text ?? "") as string;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({
      error: `Could not extract transactions from this image. Claude responded: ${text.slice(0, 300)}`,
    }, { status: 502 });
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
  } catch (e) {
    return NextResponse.json({ error: `Failed to parse extracted transactions: ${e}` }, { status: 502 });
  }

  if (transactions.length === 0) {
    return NextResponse.json({
      error: "No transactions found in this image. Make sure it shows a bank statement, receipt, or transaction list.",
    }, { status: 422 });
  }

  return NextResponse.json({ transactions });
}
