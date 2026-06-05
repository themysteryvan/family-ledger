import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/family-ledger-template.xlsx");

const wb = new ExcelJS.Workbook();
wb.creator = "Standing Ledger";
wb.created = new Date();

// ── Shared styles ─────────────────────────────────────────────────────────────

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
const NOTE_FILL   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
const EXAMPLE_FILL= { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };

const HEADER_FONT  = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const NOTE_FONT    = { italic: true, color: { argb: "FF856404" }, size: 10 };
const EXAMPLE_FONT = { italic: true, color: { argb: "FF9E9E9E" }, size: 10 };
const BORDER = { style: "thin", color: { argb: "FFD0D0D0" } };
const CELL_BORDER = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

function addSheet({ name, headers, widths, examples }) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 3 }] });

  // Row 1: instruction note (merged across all columns)
  const noteRow = ws.addRow(["⚠  Delete example rows before uploading. Keep the header row."]);
  const noteCell = noteRow.getCell(1);
  noteCell.fill = NOTE_FILL;
  noteCell.font = NOTE_FONT;
  noteCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.mergeCells(1, 1, 1, headers.length);
  noteRow.height = 22;

  // Row 2: blank spacer
  ws.addRow([]);

  // Row 3: headers
  const headerRow = ws.addRow(headers);
  headerRow.height = 22;
  headers.forEach((_, ci) => {
    const cell = headerRow.getCell(ci + 1);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = CELL_BORDER;
  });

  // Example rows
  examples.forEach((row) => {
    const exRow = ws.addRow(row);
    exRow.height = 18;
    row.forEach((_, ci) => {
      const cell = exRow.getCell(ci + 1);
      cell.fill = EXAMPLE_FILL;
      cell.font = EXAMPLE_FONT;
      cell.alignment = { vertical: "middle" };
      cell.border = CELL_BORDER;
    });
  });

  // Column widths
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Freeze top 3 rows and style tab
  ws.getRow(1).height = 24;

  return ws;
}

// ── Income ────────────────────────────────────────────────────────────────────
addSheet({
  name: "Income",
  headers: ["Source Name", "Amount", "Frequency", "Owner", "Category", "Start Date", "Notes"],
  widths:  [28, 14, 20, 16, 20, 14, 36],
  examples: [
    ["Annual Salary — Senior PM", 12500, "Monthly", "Alex", "Salary", "2022-03-01", "After-tax take-home"],
    ["Freelance Design", 2000, "Monthly", "Jordan", "Freelance", "2024-01-01", "Average; varies by project"],
    ["Rental Income — 2BR Unit", 2400, "Monthly", "Joint", "Rental", "2021-06-01", "Net after property mgmt fee"],
    ["Dividend Portfolio", 800, "Quarterly", "Alex", "Investment", "2019-01-01", "Vanguard taxable account"],
  ],
});

// ── Expenses ──────────────────────────────────────────────────────────────────
addSheet({
  name: "Expenses",
  headers: ["Name", "Amount", "Frequency", "Category", "Fixed?", "Essential?", "Notes"],
  widths:  [28, 14, 20, 20, 12, 14, 36],
  examples: [
    ["Mortgage — Primary Home", 3200, "Monthly", "Housing", "Yes", "Yes", "Principal + interest + escrow"],
    ["Electricity & Gas", 180, "Monthly", "Utilities", "No", "Yes", "Average; higher in winter"],
    ["Grocery Shopping", 900, "Monthly", "Food", "No", "Yes", ""],
    ["Netflix + Spotify", 35, "Monthly", "Subscriptions", "Yes", "No", ""],
    ["Annual Car Insurance", 2400, "Annually", "Insurance", "Yes", "Yes", "Both vehicles combined"],
  ],
});

// ── Assets ────────────────────────────────────────────────────────────────────
addSheet({
  name: "Assets",
  headers: ["Name", "Type", "Current Value ($)", "Purchase Price ($)", "Purchase Date", "Growth Rate (%/yr)", "Notes"],
  widths:  [28, 20, 20, 20, 14, 18, 36],
  examples: [
    ["Primary Home", "Real Estate", 620000, 480000, "2019-08-15", 3.5, "Zillow estimate"],
    ["2022 Honda CR-V", "Vehicle", 24000, 34000, "2022-04-01", -15, "Estimated depreciation"],
    ["HYSA — Marcus", "Cash", 28000, "", "", 4.5, "Emergency fund"],
    ["Vanguard Taxable Brokerage", "Investment", 95000, 60000, "2018-01-01", 7, "Index fund portfolio"],
  ],
});

// ── Debts ─────────────────────────────────────────────────────────────────────
addSheet({
  name: "Debts",
  headers: ["Name", "Type", "Current Balance ($)", "Original Balance ($)", "Interest Rate (%)", "Min. Payment ($/mo)", "Lender", "Due Date", "Notes"],
  widths:  [28, 20, 20, 20, 18, 20, 20, 14, 30],
  examples: [
    ["Primary Mortgage", "Mortgage", 392000, 480000, 6.75, 3200, "Chase", "2054-09-01", "30-yr fixed"],
    ["Honda CR-V Loan", "Auto", 14500, 34000, 5.99, 620, "Honda Financial", "2028-04-01", ""],
    ["Chase Sapphire Reserve", "Credit Card", 3200, 3200, 24.99, 96, "Chase", "", "Pay in full monthly"],
    ["Federal Student Loans", "Student", 28000, 45000, 5.05, 310, "MOHELA", "2032-06-01", "IDR plan"],
  ],
});

// ── Retirement ────────────────────────────────────────────────────────────────
addSheet({
  name: "Retirement",
  headers: ["Account Name", "Type", "Owner", "Current Balance ($)", "Contributions YTD ($)", "Employer Match (%)", "Annual Limit ($)", "Notes"],
  widths:  [28, 20, 16, 20, 22, 20, 16, 36],
  examples: [
    ["Fidelity 401(k)", "401(k)", "Alex", 148000, 12000, 4, 23000, "Employer matches 4%"],
    ["Vanguard Roth IRA", "Roth IRA", "Alex", 42000, 7000, 0, 7000, "Max contributions annually"],
    ["Fidelity Roth 401(k)", "Roth 401(k)", "Jordan", 61000, 8000, 3, 23000, "Partial Roth election"],
    ["Vanguard Roth IRA", "Roth IRA", "Jordan", 29000, 7000, 0, 7000, ""],
  ],
});

await wb.xlsx.writeFile(OUT);
console.log("✓ Written:", OUT);
