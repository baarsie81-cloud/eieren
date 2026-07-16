"use server";

import { revalidatePath } from "next/cache";
import { assertTrustedOrigin, requireSession } from "@/lib/auth/guards";
import { customerInputFromForm, validateCustomerInput } from "@/lib/customer-input";
import { getSql } from "@/lib/db";
import { applyImport, classifyImport } from "@/lib/import-server";
import type { ImportCandidate, ImportPreviewRow } from "@/lib/import";
import type { ActionState } from "@/lib/types";

async function guardMutation() {
  await requireSession();
  await assertTrustedOrigin();
}

export async function saveCustomerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await guardMutation();
  const input = customerInputFromForm(formData);
  const errors = validateCustomerInput(input);
  if (errors.length) return { ok: false, message: errors.join(" ") };

  const sql = getSql();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await sql`
      UPDATE customers SET
        name = ${input.name}, address_line = ${input.addressLine}, postal_code = ${input.postalCode},
        city = ${input.city}, phone = ${input.phone || null}, default_eggs = ${input.defaultEggs},
        unit_price_cents = ${input.unitPriceCents}, note = ${input.note || null},
        route_order = ${input.routeOrder}, address_key = ${input.addressKey}, updated_at = now()
      WHERE id = ${id}
    `;
  } else {
    const orderRows = (await sql`SELECT COALESCE(max(route_order), 0)::int + 1 AS value FROM customers`) as { value: number }[];
    const order = input.routeOrder || Number(orderRows[0]?.value ?? 1);
    await sql`
      INSERT INTO customers (
        name, address_line, postal_code, city, phone, default_eggs, unit_price_cents,
        note, route_order, address_key
      ) VALUES (
        ${input.name}, ${input.addressLine}, ${input.postalCode}, ${input.city},
        ${input.phone || null}, ${input.defaultEggs}, ${input.unitPriceCents},
        ${input.note || null}, ${order}, ${input.addressKey}
      )
    `;
  }
  revalidatePath("/");
  revalidatePath("/beheer/klanten");
  return { ok: true, message: id ? "Klant is bijgewerkt." : "Klant is toegevoegd." };
}

export async function setCustomerActiveAction(formData: FormData) {
  await guardMutation();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active")) === "true";
  const sql = getSql();
  await sql`UPDATE customers SET is_active = ${active}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/beheer/klanten");
}

export async function moveCustomerAction(formData: FormData) {
  await guardMutation();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction")) === "up" ? "up" : "down";
  const sql = getSql();
  const currentRows = (await sql`SELECT id::text, route_order FROM customers WHERE id = ${id}`) as { id: string; route_order: number }[];
  const current = currentRows[0];
  if (!current) return;
  const neighbors = direction === "up"
    ? await sql`SELECT id::text, route_order FROM customers WHERE is_active AND (route_order < ${current.route_order} OR (route_order = ${current.route_order} AND id < ${id})) ORDER BY route_order DESC, id DESC LIMIT 1`
    : await sql`SELECT id::text, route_order FROM customers WHERE is_active AND (route_order > ${current.route_order} OR (route_order = ${current.route_order} AND id > ${id})) ORDER BY route_order, id LIMIT 1`;
  const neighbor = (neighbors as { id: string; route_order: number }[])[0];
  if (!neighbor) return;
  await sql.transaction([
    sql`UPDATE customers SET route_order = ${neighbor.route_order}, updated_at = now() WHERE id = ${id}`,
    sql`UPDATE customers SET route_order = ${current.route_order}, updated_at = now() WHERE id = ${neighbor.id}`,
  ]);
  revalidatePath("/beheer/klanten");
}

export async function previewImportAction(candidates: ImportCandidate[]): Promise<ImportPreviewRow[]> {
  await guardMutation();
  if (!Array.isArray(candidates) || candidates.length > 1000) throw new Error("Ongeldige import.");
  return classifyImport(candidates);
}

export async function confirmImportAction(candidates: ImportCandidate[]): Promise<ActionState> {
  await guardMutation();
  if (!Array.isArray(candidates) || candidates.length > 1000) return { ok: false, message: "Ongeldige import." };
  const result = await applyImport(candidates);
  revalidatePath("/");
  revalidatePath("/beheer/klanten");
  return { ok: true, message: `${result.imported} klant${result.imported === 1 ? "" : "en"} toegevoegd of bijgewerkt; ${result.skipped} overgeslagen.` };
}
