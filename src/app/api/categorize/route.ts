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

  const prompt = `You are a personal finance assistant. Categorize each transaction into exactly one of these categories:
housing, utilities, food, transport, kids, health, insurance, entertainment, personal, pets, savings, other

Transactions:
${transactionList}

Reply with ONLY a JSON object mapping each index to its category label (lowercase). Example:
{"0": "food", "1": "transport", "2": "housing"}

Use these guidelines:
- housing: rent, mortgage, HOA, home repairs, hardware stores
- utilities: electric, gas, water, internet, phone, cell
- food: groceries, restaurants, coffee, delivery apps
- transport: gas stations, auto repair, parking, tolls, rideshare, public transit
- kids: daycare, school, tutoring, children's activities, toys
- health: pharmacy, doctor, dentist, gym, medical
- insurance: any insurance premium
- entertainment: streaming, movies, concerts, sports, hobbies
- personal: clothing, beauty, haircuts, Amazon (general shopping)
- pets: vet, pet food, pet supplies
- savings: transfers to savings, investments, 401k
- other: anything that doesn't fit above`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
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
