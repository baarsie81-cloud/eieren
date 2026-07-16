import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { assertTrustedOrigin, isAuthenticated } from "@/lib/auth/guards";
import type { WorksheetPreview } from "@/lib/import";

export const runtime = "nodejs";

function cellText(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (value instanceof Date) return value.toLocaleDateString("nl-NL");
  if (typeof value === "object") {
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value) return String(value.text ?? "");
  }
  return String(value);
}

function extractWorksheet(worksheet: ExcelJS.Worksheet): WorksheetPreview | null {
  const values: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let column = 1; column <= row.cellCount; column += 1) cells.push(cellText(row.getCell(column).value).trim());
    if (cells.some(Boolean)) values.push(cells);
  });
  if (values.length === 0) return null;
  const [headers, ...rows] = values;
  return { name: worksheet.name || "Werkblad 1", headers, rows };
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  try {
    await assertTrustedOrigin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Kies een bestand." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Het bestand is groter dan 5 MB." }, { status: 400 });

    const extension = file.name.toLocaleLowerCase("nl-NL").split(".").pop();
    if (extension === "xls") return NextResponse.json({ error: "Sla dit oude .xls-bestand eerst op als .xlsx." }, { status: 400 });
    if (extension !== "xlsx" && extension !== "csv") return NextResponse.json({ error: "Gebruik een .xlsx- of .csv-bestand." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    if (extension === "csv") await workbook.csv.read(Readable.from(buffer));
    else await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const worksheets = workbook.worksheets.map(extractWorksheet).filter((sheet): sheet is WorksheetPreview => Boolean(sheet));
    const rowCount = worksheets.reduce((total, sheet) => total + sheet.rows.length, 0);
    if (rowCount > 1000) return NextResponse.json({ error: "Het bestand bevat meer dan 1.000 gegevensregels." }, { status: 400 });
    if (worksheets.length === 0) return NextResponse.json({ error: "Geen gegevens gevonden in het bestand." }, { status: 400 });
    return NextResponse.json({ worksheets });
  } catch (error) {
    console.error("Excel-import kon niet worden gelezen", error);
    return NextResponse.json({ error: "Het bestand kon niet worden gelezen. Controleer de indeling." }, { status: 400 });
  }
}
