"use server";

import { revalidatePath } from "next/cache";
import { assertTrustedOrigin, requireSession } from "@/lib/auth/guards";
import { getSql } from "@/lib/db";
import { validPaymentRequestUrl } from "@/lib/payment-request";
import type { PaymentRequestActionState } from "@/lib/types";

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

export async function savePaymentRequestAction(
  _previous: PaymentRequestActionState,
  formData: FormData,
): Promise<PaymentRequestActionState> {
  await guardMutation();
  const stopId = String(formData.get("stopId") ?? "");
  const paymentRequestUrl = validPaymentRequestUrl(String(formData.get("paymentRequestUrl") ?? ""));
  if (!/^\d+$/.test(stopId)) return { ok: false, message: "Ongeldige bezorgstop.", paymentRequestUrl: "" };
  if (!paymentRequestUrl) return { ok: false, message: "Plak een geldige https-betaallink uit de ING-app.", paymentRequestUrl: "" };

  const sql = getSql();
  const rows = (await sql`
    UPDATE delivery_stops s SET payment_request_url = ${paymentRequestUrl}
    FROM delivery_rounds r
    WHERE s.id = ${stopId} AND r.id = s.round_id
      AND r.status = 'active' AND s.delivered_at IS NOT NULL
    RETURNING s.id
  `) as { id: string }[];
  if (rows.length === 0) return { ok: false, message: "Markeer deze stop eerst als bezorgd.", paymentRequestUrl: "" };
  revalidatePath("/");
  return { ok: true, message: "Betaallink opgeslagen. WhatsApp staat klaar.", paymentRequestUrl };
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
