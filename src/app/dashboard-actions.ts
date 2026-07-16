"use server";

import { revalidatePath } from "next/cache";
import { assertTrustedOrigin, requireSession } from "@/lib/auth/guards";
import { getSql } from "@/lib/db";

async function guardMutation() {
  await requireSession();
  await assertTrustedOrigin();
}

export async function toggleDeliveryAction(stopId: string, delivered: boolean) {
  await guardMutation();
  const sql = getSql();
  await sql`
    UPDATE delivery_stops s SET delivered_at = ${delivered ? new Date().toISOString() : null}
    FROM delivery_rounds r
    WHERE s.id = ${stopId} AND r.id = s.round_id AND r.status = 'active'
  `;
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
}

export async function startDashboardRoundAction(roundId: string) {
  await guardMutation();
  const sql = getSql();
  await sql`
    UPDATE delivery_rounds SET status = 'active', started_at = now()
    WHERE id = ${roundId} AND status = 'planned'
      AND NOT EXISTS (SELECT 1 FROM delivery_rounds WHERE status = 'active')
  `;
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
}

export async function completeDashboardRoundAction(roundId: string) {
  await guardMutation();
  const sql = getSql();
  await sql`
    UPDATE delivery_rounds r SET status = 'completed', completed_at = now()
    WHERE r.id = ${roundId} AND r.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM delivery_stops s WHERE s.round_id = r.id AND s.delivered_at IS NULL)
  `;
  revalidatePath("/");
  revalidatePath("/beheer/rondes");
}

