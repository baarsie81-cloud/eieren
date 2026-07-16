"use server";

import { revalidatePath } from "next/cache";
import { assertTrustedOrigin, requireSession } from "@/lib/auth/guards";
import { getSql } from "@/lib/db";
import { parseMoneyToCents } from "@/lib/format";
import type { ActionState } from "@/lib/types";

export async function saveSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  await assertTrustedOrigin();
  const roundDay = Number(formData.get("roundDay"));
  const roundTitle = String(formData.get("roundTitle") ?? "").trim().slice(0, 120);
  const defaultPrice = parseMoneyToCents(String(formData.get("defaultUnitPrice") ?? ""));
  const startAddress = String(formData.get("startAddress") ?? "").trim().slice(0, 250);
  const returnToStart = formData.get("returnToStart") === "on";

  if (!Number.isInteger(roundDay) || roundDay < 0 || roundDay > 6) return { ok: false, message: "Kies een geldige rondedag." };
  if (roundTitle.length < 3) return { ok: false, message: "Vul een rondetitel in." };
  if (defaultPrice == null || defaultPrice < 0) return { ok: false, message: "Vul een geldige standaardprijs in." };

  const sql = getSql();
  await sql`
    UPDATE app_settings SET round_day = ${roundDay}, round_title = ${roundTitle},
      default_unit_price_cents = ${defaultPrice}, start_address = ${startAddress},
      return_to_start = ${returnToStart}, updated_at = now()
    WHERE id = 1
  `;
  revalidatePath("/");
  revalidatePath("/instellingen");
  revalidatePath("/beheer/rondes");
  return { ok: true, message: "Instellingen zijn opgeslagen." };
}

export async function resetAppAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  await assertTrustedOrigin();

  if (String(formData.get("confirmation") ?? "").trim().toLocaleUpperCase("nl-NL") !== "LEEGMAKEN") {
    return { ok: false, message: "Typ LEEGMAKEN om de volledige reset te bevestigen." };
  }

  const sql = getSql();
  await sql.transaction([
    sql`TRUNCATE TABLE delivery_stops, delivery_rounds, customers RESTART IDENTITY`,
    sql`
      UPDATE app_settings SET
        round_day = 6,
        round_title = 'Ronde van zaterdag',
        default_unit_price_cents = 30,
        start_address = '',
        return_to_start = true,
        updated_at = now()
      WHERE id = 1
    `,
  ]);

  revalidatePath("/");
  revalidatePath("/beheer/klanten");
  revalidatePath("/beheer/rondes");
  revalidatePath("/instellingen");
  return { ok: true, message: "De app is volledig leeggemaakt en klaar voor een nieuwe import." };
}
