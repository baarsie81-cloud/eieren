import { customerInputFromValues, type CustomerInput } from "./customer-input";

export const importFields = ["name", "addressLine", "postalCode", "city", "phone", "defaultEggs", "unitPrice", "note", "routeOrder"] as const;
export type ImportField = (typeof importFields)[number];
export type ImportMapping = Record<ImportField, number | null>;

export const importFieldLabels: Record<ImportField, string> = {
  name: "Naam",
  addressLine: "Adres",
  postalCode: "Postcode",
  city: "Plaats",
  phone: "Telefoon",
  defaultEggs: "Eieren",
  unitPrice: "Prijs per ei",
  note: "Notitie",
  routeOrder: "Volgorde",
};

const aliases: Record<ImportField, string[]> = {
  name: ["naam", "klant", "klantnaam", "familie", "bewoner"],
  addressLine: ["adres", "straat", "straatnaam", "adresregel", "huisadres"],
  postalCode: ["postcode", "post code", "zip", "zip code"],
  city: ["plaats", "woonplaats", "stad"],
  phone: ["telefoon", "telefoonnummer", "mobiel", "06", "tel"],
  defaultEggs: ["eieren", "aantal eieren", "aantal", "standaard aantal"],
  unitPrice: ["prijs", "prijs per ei", "stuksprijs", "afwijkende prijs"],
  note: ["notitie", "opmerking", "opmerkingen", "bijzonderheden"],
  routeOrder: ["volgorde", "route", "routevolgorde", "stop", "stopnummer"],
};

export type WorksheetPreview = { name: string; headers: string[]; rows: string[][] };

export type ImportCandidate = CustomerInput & { rowNumber: number };
export type ImportRowStatus = "new" | "update" | "skip" | "error";
export type ImportPreviewRow = {
  rowNumber: number;
  status: ImportRowStatus;
  reason: string;
  customer: ImportCandidate;
  existingId?: string;
};

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL").replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function detectImportMapping(headers: string[]): ImportMapping {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(importFields.map((field) => {
    const index = normalized.findIndex((header) => aliases[field].includes(header));
    return [field, index >= 0 ? index : null];
  })) as ImportMapping;
}

export function mapWorksheetRows(rows: string[][], mapping: ImportMapping): ImportCandidate[] {
  return rows.map((row, index) => {
    const value = (field: ImportField) => {
      const column = mapping[field];
      return column == null ? "" : row[column] ?? "";
    };
    return {
      ...customerInputFromValues({
        name: value("name"),
        addressLine: value("addressLine"),
        postalCode: value("postalCode"),
        city: value("city"),
        phone: value("phone"),
        defaultEggs: value("defaultEggs"),
        unitPrice: value("unitPrice"),
        note: value("note"),
        routeOrder: value("routeOrder"),
      }),
      rowNumber: index + 2,
    };
  });
}

export function findDuplicateImportRows(candidates: ImportCandidate[]) {
  const seen = new Set<string>();
  const duplicates = new Set<number>();
  for (const candidate of candidates) {
    if (seen.has(candidate.addressKey)) duplicates.add(candidate.rowNumber);
    else seen.add(candidate.addressKey);
  }
  return duplicates;
}
