import "server-only";

import { getSql } from "./db";
import { validateCustomerInput } from "./customer-input";
import { normalizeText } from "./format";
import { findDuplicateImportRows, type ImportCandidate, type ImportPreviewRow } from "./import";

type ExistingCustomer = {
  id: string;
  name: string;
  address_key: string;
  address_line: string;
  postal_code: string;
  city: string;
  phone: string | null;
  default_eggs: number;
  unit_price_cents: number | null;
  note: string | null;
  route_order: number;
  is_active: boolean;
};

function sameCustomer(candidate: ImportCandidate, existing: ExistingCustomer) {
  return candidate.name === existing.name
    && candidate.addressLine === existing.address_line
    && (!candidate.postalCode || candidate.postalCode === existing.postal_code)
    && candidate.city === existing.city
    && candidate.phone === (existing.phone ?? "")
    && candidate.defaultEggs === existing.default_eggs
    && candidate.unitPriceCents === existing.unit_price_cents
    && candidate.note === (existing.note ?? "")
    && (candidate.routeOrder === 0 || candidate.routeOrder === existing.route_order)
    && existing.is_active;
}

function addressAndCityKey(addressLine: string, city: string) {
  return `${normalizeText(addressLine)}|${normalizeText(city)}`;
}

export async function classifyImport(candidates: ImportCandidate[]): Promise<ImportPreviewRow[]> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id::text, name, address_key, address_line, postal_code, city, phone,
      default_eggs, unit_price_cents, note, route_order, is_active
    FROM customers
  `) as ExistingCustomer[];

  const byAddress = new Map<string, ExistingCustomer[]>();
  const byAddressLine = new Map<string, ExistingCustomer[]>();
  for (const customer of existing) {
    const matches = byAddress.get(customer.address_key) ?? [];
    matches.push(customer);
    byAddress.set(customer.address_key, matches);
    const addressLineKey = addressAndCityKey(customer.address_line, customer.city);
    const addressMatches = byAddressLine.get(addressLineKey) ?? [];
    addressMatches.push(customer);
    byAddressLine.set(addressLineKey, addressMatches);
  }

  const duplicateRows = findDuplicateImportRows(candidates);
  return candidates.slice(0, 1000).map((candidate) => {
    const errors = validateCustomerInput(candidate, { postalCodeRequired: !candidate.allowMissingPostalCode });
    if (errors.length) return { rowNumber: candidate.rowNumber, status: "error", reason: errors.join(" "), customer: candidate };
    if (duplicateRows.has(candidate.rowNumber)) {
      return { rowNumber: candidate.rowNumber, status: "error", reason: "Dubbel adres in dit bestand.", customer: candidate };
    }

    const exactMatches = byAddress.get(candidate.addressKey) ?? [];
    const matches = exactMatches.length
      ? exactMatches
      : byAddressLine.get(addressAndCityKey(candidate.addressLine, candidate.city)) ?? [];
    if (matches.length > 1) {
      return { rowNumber: candidate.rowNumber, status: "error", reason: "Meerdere bestaande klanten hebben dit adres; controleer handmatig.", customer: candidate };
    }
    if (matches.length === 0) return { rowNumber: candidate.rowNumber, status: "new", reason: "Nieuwe klant", customer: candidate };
    const match = matches[0];
    if (sameCustomer(candidate, match)) {
      return { rowNumber: candidate.rowNumber, status: "skip", reason: "Geen wijzigingen", customer: candidate, existingId: match.id };
    }
    return { rowNumber: candidate.rowNumber, status: "update", reason: match.is_active ? "Bestaande klant bijwerken" : "Gearchiveerde klant bijwerken en herstellen", customer: candidate, existingId: match.id };
  });
}

export async function applyImport(candidates: ImportCandidate[]) {
  const preview = await classifyImport(candidates);
  const applicable = preview.filter((row) => row.status === "new" || row.status === "update");
  if (applicable.length === 0) return { imported: 0, skipped: preview.length };

  const sql = getSql();
  const maxRows = (await sql`SELECT COALESCE(max(route_order), 0)::int AS value FROM customers`) as { value: number }[];
  let nextOrder = Number(maxRows[0]?.value ?? 0) + 1;

  const queries = applicable.map((row) => {
    const customer = row.customer;
    const routeOrder = customer.routeOrder || nextOrder++;
    if (row.status === "update" && row.existingId) {
      return sql`
        UPDATE customers SET
          name = ${customer.name}, address_line = ${customer.addressLine},
          postal_code = CASE WHEN ${customer.postalCode} = '' THEN postal_code ELSE ${customer.postalCode} END,
          city = ${customer.city}, phone = ${customer.phone || null}, default_eggs = ${customer.defaultEggs},
          unit_price_cents = ${customer.unitPriceCents}, note = ${customer.note || null},
          route_order = ${routeOrder}, is_active = true,
          address_key = CASE WHEN ${customer.postalCode} = '' THEN address_key ELSE ${customer.addressKey} END,
          updated_at = now()
        WHERE id = ${row.existingId}
      `;
    }
    return sql`
      INSERT INTO customers (
        name, address_line, postal_code, city, phone, default_eggs, unit_price_cents,
        note, route_order, is_active, address_key
      ) VALUES (
        ${customer.name}, ${customer.addressLine}, ${customer.postalCode}, ${customer.city},
        ${customer.phone || null}, ${customer.defaultEggs}, ${customer.unitPriceCents},
        ${customer.note || null}, ${routeOrder}, true, ${customer.addressKey}
      )
    `;
  });
  await sql.transaction(queries);
  return { imported: applicable.length, skipped: preview.length - applicable.length };
}
