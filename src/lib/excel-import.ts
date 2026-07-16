import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { detectImportMapping, type WorksheetPreview } from "./import";

const MAX_ROWS_PER_SHEET = 1000;
const MAX_WORKSHEETS = 20;
const LEGACY_ORDER_COLUMNS = [24, 21, 18, 14, 11, 8, 5] as const;

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

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function positiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function rowValues(row: ExcelJS.Row) {
  const cells: string[] = [];
  for (let column = 1; column <= row.cellCount; column += 1) cells.push(cellText(row.getCell(column).value).trim());
  return cells;
}

function mappingScore(headers: string[]) {
  return Object.values(detectImportMapping(headers)).filter((value) => value != null).length;
}

export function extractStandardWorksheet(worksheet: ExcelJS.Worksheet): WorksheetPreview | null {
  const populated: { rowNumber: number; cells: string[] }[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowValues(row);
    if (cells.some(Boolean)) populated.push({ rowNumber: row.number, cells });
  });
  if (populated.length === 0) return null;

  let headerIndex = 0;
  let bestScore = 0;
  for (let index = 0; index < Math.min(populated.length, 30); index += 1) {
    const score = mappingScore(populated[index].cells);
    if (score > bestScore) {
      bestScore = score;
      headerIndex = index;
    }
  }
  if (bestScore < 2) headerIndex = 0;

  const data = populated.slice(headerIndex + 1);
  return {
    name: worksheet.name || "Werkblad 1",
    headers: populated[headerIndex].cells,
    rows: data.slice(0, MAX_ROWS_PER_SHEET).map((item) => item.cells),
    headerRowNumber: populated[headerIndex].rowNumber,
    rowNumbers: data.slice(0, MAX_ROWS_PER_SHEET).map((item) => item.rowNumber),
    source: "standard",
    rowLimitExceeded: data.length > MAX_ROWS_PER_SHEET,
  };
}

function isLegacyCustomerSheet(worksheet: ExcelJS.Worksheet) {
  if (normalized(worksheet.name) !== "klanten") return false;
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 8); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (normalized(cellText(row.getCell(2).value)).includes("naamklant")
      && normalized(cellText(row.getCell(3).value)).includes("telefoonnummer")) return true;
  }
  return false;
}

function latestOrder(row: ExcelJS.Row) {
  for (const column of LEGACY_ORDER_COLUMNS) {
    const regular = positiveNumber(cellText(row.getCell(column).value));
    const organic = positiveNumber(cellText(row.getCell(column + 1).value));
    if (regular + organic === 0) continue;
    const eggs = Math.max(1, Math.round((regular + organic) * 10));
    const paid = positiveNumber(cellText(row.getCell(column + 2).value));
    const total = paid || regular * 3.5 + organic * 4.3;
    return {
      eggs,
      unitPrice: (total / eggs).toFixed(2).replace(".", ","),
      organicEggs: Math.round(organic * 10),
    };
  }
  return { eggs: 10, unitPrice: "", organicEggs: 0 };
}

export function extractLegacyEiPimWorksheet(worksheet: ExcelJS.Worksheet): WorksheetPreview | null {
  if (!isLegacyCustomerSheet(worksheet)) return null;

  const rows: string[][] = [];
  const rowNumbers: number[] = [];
  let currentStreet: string | null = null;
  let routeOrder = 0;

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const first = cellText(row.getCell(1).value).trim();
    const nameHeader = normalized(cellText(row.getCell(2).value));
    const frequencyHeader = normalized(cellText(row.getCell(4).value));
    const orderHeader = normalized(cellText(row.getCell(5).value));

    if (first && frequencyHeader.includes("frequentie") && (nameHeader.includes("naamklant") || orderHeader === "gewoon")) {
      currentStreet = normalized(first) === "adres" ? "" : first;
      continue;
    }
    if (normalized(first) === "adres" && frequencyHeader.includes("frequentie")) {
      currentStreet = "";
      continue;
    }
    if (currentStreet == null || !first) continue;

    const name = cellText(row.getCell(2).value).trim();
    const phone = cellText(row.getCell(3).value).trim();
    const frequency = cellText(row.getCell(4).value).trim();
    const hasOrder = LEGACY_ORDER_COLUMNS.some((column) => positiveNumber(cellText(row.getCell(column).value)) + positiveNumber(cellText(row.getCell(column + 1).value)) > 0);
    if (!name && !phone && !frequency && !hasOrder) continue;

    const address = currentStreet ? `${currentStreet} ${first}`.trim() : first;
    const order = latestOrder(row);
    routeOrder += 1;
    const notes = [frequency, order.organicEggs ? `${order.organicEggs} bio-eieren in de laatst ingevulde bestelling` : ""].filter(Boolean).join(" · ");
    rows.push([
      name || `Bewoner ${address}`,
      address,
      phone,
      String(order.eggs),
      order.unitPrice,
      notes,
      String(routeOrder),
    ]);
    rowNumbers.push(rowNumber);
  }

  return {
    name: `${worksheet.name} (Ei Pim-formaat)`,
    headers: ["Naam", "Adres", "Telefoon", "Eieren", "Prijs per ei", "Notitie", "Volgorde"],
    rows: rows.slice(0, MAX_ROWS_PER_SHEET),
    headerRowNumber: 1,
    rowNumbers: rowNumbers.slice(0, MAX_ROWS_PER_SHEET),
    source: "ei-pim-legacy",
    suggestedCity: "Apeldoorn",
    notice: "Bestaand Ei Pim-bestand herkend. Straatnamen en huisnummers zijn samengevoegd; de laatst ingevulde bestelling bepaalt standaard het aantal en de prijs.",
    rowLimitExceeded: rows.length > MAX_ROWS_PER_SHEET,
  };
}

export async function parseImportWorkbook(buffer: Buffer, extension: "xlsx" | "csv") {
  const workbook = new ExcelJS.Workbook();
  if (extension === "csv") await workbook.csv.read(Readable.from(buffer));
  else await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const worksheets: WorksheetPreview[] = [];
  for (const worksheet of workbook.worksheets.slice(0, MAX_WORKSHEETS)) {
    if (worksheet.state !== "visible") continue;
    const legacy = extractLegacyEiPimWorksheet(worksheet);
    const extracted = legacy ?? extractStandardWorksheet(worksheet);
    if (extracted) worksheets.push(extracted);
  }
  return worksheets.sort((left, right) => Number(right.source === "ei-pim-legacy") - Number(left.source === "ei-pim-legacy"));
}
