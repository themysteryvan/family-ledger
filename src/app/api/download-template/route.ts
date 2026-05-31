import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
const EXAMPLE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const EXAMPLE_FONT: Partial<ExcelJS.Font> = { italic: true, color: { argb: "FF9E9E9E" }, size: 10 };
const BORDER_SIDE: Partial<ExcelJS.BorderStyle> = "thin";
const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: BORDER_SIDE, color: { argb: "FFD0D0D0" } },
  left: { style: BORDER_SIDE, color: { argb: "FFD0D0D0" } },
  bottom: { style: BORDER_SIDE, color: { argb: "FFD0D0D0" } },
  right: { style: BORDER_SIDE, color: { argb: "FFD0D0D0" } },
};

interface SheetDef {
  name: string;
  headers: string[];
  widths: number[];
  examples: (string | number)[][];
}

function buildSheet(wb: ExcelJS.Workbook, def: SheetDef) {
  const ws = wb.addWorksheet(def.name, { views: [{ state: "frozen", ySplit: 1 }] });

  // Header row
  const headerRow = ws.addRow(def.headers);
  headerRow.height = 22;
  def.headers.forEach((_, ci) => {
    const cell = headerRow.getCell(ci + 1);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = CELL_BORDER;
  });

  // Example rows
  def.examples.forEach((rowData) => {
    const row = ws.addRow(rowData);
    row.height = 18;
    rowData.forEach((_, ci) => {
      const cell = row.getCell(ci + 1);
      cell.fill = EXAMPLE_FILL;
      cell.font = EXAMPLE_FONT;
      cell.alignment = { vertical: "middle" };
      cell.border = CELL_BORDER;
    });
  });

  // Column widths
  def.widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

export async function GET() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Family Ledger";
  wb.created = new Date();

  buildSheet(wb, {
    name: "Income",
    headers: ["Name", "Amount", "Frequency", "Owner", "Category", "Data Source", "Notes"],
    widths: [28, 14, 20, 16, 20, 22, 36],
    examples: [
      ["Annual Salary — Senior PM", 12500, "Monthly", "Alex", "Salary", "Paystub", "After-tax take-home"],
      ["Freelance Design", 2000, "Monthly", "Jordan", "Freelance", "Bank Statement", "Average; varies by project"],
      ["Rental Income — 2BR", 2400, "Monthly", "Joint", "Rental", "Manual Entry", "Net of property mgmt fee"],
    ],
  });

  buildSheet(wb, {
    name: "Expenses",
    headers: ["Name", "Amount", "Frequency", "Category", "Owner", "Data Source", "Notes"],
    widths: [28, 14, 20, 20, 16, 22, 36],
    examples: [
      ["Mortgage — Primary Home", 3200, "Monthly", "Housing", "Joint", "Mortgage Statement", "Principal + interest + escrow"],
      ["Electricity & Gas", 180, "Monthly", "Utilities", "Joint", "Manual Entry", "Average; higher in winter"],
      ["Grocery Shopping", 900, "Monthly", "Food", "Joint", "Manual Entry", ""],
    ],
  });

  buildSheet(wb, {
    name: "Assets",
    headers: ["Name", "Type", "Current Value", "Purchase Price", "Institution", "Data Source", "Notes"],
    widths: [28, 20, 18, 18, 22, 22, 36],
    examples: [
      ["Primary Home", "Real Estate", 620000, 480000, "", "Tax Return", "Zillow estimate"],
      ["HYSA — Marcus", "Savings", 28000, "", "Goldman Sachs", "Bank Statement", "Emergency fund — 4.5% APY"],
      ["Vanguard Taxable Brokerage", "Investment", 95000, 60000, "Vanguard", "Brokerage Statement", "Index fund portfolio"],
    ],
  });

  buildSheet(wb, {
    name: "Debts",
    headers: ["Name", "Type", "Balance", "Interest Rate (%)", "Minimum Payment", "Owner", "Data Source", "Notes"],
    widths: [28, 20, 16, 18, 18, 14, 22, 36],
    examples: [
      ["Primary Mortgage", "Mortgage", 392000, 6.75, 3200, "Joint", "Mortgage Statement", "30-yr fixed — Chase"],
      ["Honda CR-V Loan", "Auto", 14500, 5.99, 620, "Alex", "Manual Entry", "Honda Financial"],
      ["Federal Student Loans", "Student Loan", 28000, 5.05, 310, "Jordan", "Manual Entry", "MOHELA — IDR plan"],
    ],
  });

  buildSheet(wb, {
    name: "Retirement",
    headers: ["Account Name", "Type", "Owner", "Current Balance", "Monthly Contribution", "Employer Match %", "Institution", "Data Source"],
    widths: [28, 20, 14, 18, 22, 18, 20, 22],
    examples: [
      ["Fidelity 401(k)", "401(k)", "Alex", 148000, 1920, 4, "Fidelity", "Brokerage Statement"],
      ["Vanguard Roth IRA", "Roth IRA", "Alex", 42000, 583, 0, "Vanguard", "Brokerage Statement"],
      ["Fidelity Roth 401(k)", "Roth 401(k)", "Jordan", 61000, 1500, 3, "Fidelity", "Brokerage Statement"],
    ],
  });

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="family-ledger-template.xlsx"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
