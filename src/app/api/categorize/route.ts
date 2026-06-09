import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const { transactions } = await req.json() as { transactions: { index: number; description: string; amount: number }[] };

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
  }

  const transactionList = transactions
    .map((t) => `${t.index}: "${t.description}" $${t.amount.toFixed(2)}`)
    .join("\n");

  const prompt = `You are a personal finance assistant. For each transaction return two fields:
1. "category": one of: housing, utilities, food, transport, kids, health, insurance, entertainment, personal, pets, savings, other
2. "type": one of: expense, income, debt_payment, transfer, skip

Type classification rules:
- income: payroll, direct deposit, salary, ACH credit, interest earned, dividend, refund, cashback, tax refund
- expense: purchase, subscription, bill, retail, restaurant, service fee
- debt_payment: "payment thank you", credit card payment, loan payment, mortgage payment, autopay to a lender
- transfer: transfer between own accounts, Zelle/Venmo to self, internal fund move, "transfer to"
- skip: opening balance, closing balance, non-transaction administrative rows

Category rules (use "other" when category is not applicable to the type):
- housing: rent, mortgage, HOA, home repairs, hardware stores
- utilities: electric, gas, water, internet, phone, cell
- food: groceries, restaurants, coffee, delivery apps
- transport: gas stations, auto repair, parking, tolls, rideshare, transit
- kids: daycare, school, tutoring, children's activities
- health: pharmacy, doctor, dentist, gym, medical
- insurance: any insurance premium
- entertainment: streaming, movies, concerts, sports, hobbies
- personal: clothing, beauty, haircuts, Amazon general shopping
- pets: vet, pet food, pet supplies
- savings: transfers to savings accounts, brokerage contributions, 401k
- other: anything else

Transactions:
${transactionList}

Reply with ONLY a JSON object where each key is the index and value is an object with "category" and "type". Example:
{"0": {"category": "food", "type": "expense"}, "1": {"category": "other", "type": "income"}, "2": {"category": "other", "type": "debt_payment"}}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
  }

  return NextResponse.json({ categories: JSON.parse(jsonMatch[0]) });
}
