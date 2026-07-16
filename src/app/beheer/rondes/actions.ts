"use server";

import { revalidatePath } from "next/cache";
import { assertTrustedOrigin, requireSession } from "@/lib/auth/guards";
import { getSql } from "@/lib/db";
import type { ActionState } from "@/lib/types";

async function guardMutation() {
  await requireSession();
  await assertTrustedOrigin();
}

export async function createRoundAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await guardMutation();
  const date = String(formData.get("roundDate") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Kies een geldige datum." };
  if (title.length < 3) return { ok: false, message: "Vul een rondetitel in." };

  const sql = getSql();
  const activeCustomers = (await sql`SELECT count(*)::int AS value FROM customers WHERE is_active`) as { value: number }[];
  if (Number(activeCustomers[0]?.value ?? 0) === 0) return { ok: false, message: "Voeg eerst minimaal één actieve klant toe." };
  const rows = (await sql`
    WITH new_round AS (
      INSERT INTO delivery_rounds (round_date, title, status)
      SELECT ${date}::date, ${title}, 'planned'
      WHERE NOT EXISTS (SELECT 1 FROM delivery_rounds WHERE status = 'active')
      RETURNING id
    ), inserted_stops AS (
      INSERT INTO delivery_stops (
        round_id, customer_id, customer_name, address_line, postal_code, city, phone,
        eggs, unit_price_cents, note, route_order
      )
      SELECT nr.id, c.id, c.name, c.address_line, c.postal_code, c.city, c.phone,
        c.default_eggs, COALESCE(c.unit_price_cents, s.default_unit_price_cents), c.note, c.route_order
      FROM new_round nr
      CROSS JOIN customers c
      CROSS JOIN app_settings s
      WHERE c.is_active AND s.id = 1
      RETURNING round_id
    )
    SELECT id::text FROM new_round
  `) as { id: string }[];
  if (!rows[0]) return { ok: false, message: "Rond eerst de actieve bezorgronde af." };
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
  return { ok: true, message: "Nieuwe ronde is aangemaakt met een vaste kopie van de actieve klanten." };
}

export async function startRoundAction(formData: FormData) {
  await guardMutation();
  const id = String(formData.get("id") ?? "");
  const sql = getSql();
  await sql`
    UPDATE delivery_rounds SET status = 'active', started_at = now()
    WHERE id = ${id} AND status = 'planned'
      AND NOT EXISTS (SELECT 1 FROM delivery_rounds WHERE status = 'active')
  `;
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
}

export async function completeRoundAction(formData: FormData) {
  await guardMutation();
  const id = String(formData.get("id") ?? "");
  const sql = getSql();
  await sql`UPDATE delivery_rounds SET status = 'completed', completed_at = now() WHERE id = ${id} AND status = 'active'`;
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
}
