"use client";

import { useActionState } from "react";
import { savePaymentRequestAction } from "@/app/dashboard-actions";
import { whatsappPaymentRequestUrl } from "@/lib/payment-request";
import type { DeliveryStop, PaymentRequestActionState } from "@/lib/types";

export function PaymentRequestPanel({ stop }: { stop: DeliveryStop }) {
  const initialState: PaymentRequestActionState = { ok: false, message: "", paymentRequestUrl: stop.paymentRequestUrl };
  const [state, action, pending] = useActionState(savePaymentRequestAction, initialState);
  const paymentRequestUrl = state.paymentRequestUrl || stop.paymentRequestUrl;
  const whatsappUrl = paymentRequestUrl ? whatsappPaymentRequestUrl(stop, paymentRequestUrl) : null;

  return (
    <div className="payment-request-panel">
      <div className="payment-request-heading">
        <div><strong>Betaalverzoek</strong><span>Maak het verzoek in de ING-app en plak de deelbare link.</span></div>
        {whatsappUrl ? <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer">Open WhatsApp</a> : null}
      </div>
      <form action={action} className="payment-request-form">
        <input name="stopId" type="hidden" value={stop.id} />
        <label><span className="sr-only">ING-betaallink voor {stop.customerName}</span><input name="paymentRequestUrl" type="url" defaultValue={paymentRequestUrl} placeholder="https://…" required /></label>
        <button className="secondary-button" type="submit" disabled={pending}>{pending ? "Opslaan…" : paymentRequestUrl ? "Link wijzigen" : "Link opslaan"}</button>
      </form>
      {state.message ? <p className={`payment-request-message${state.ok ? " is-success" : " is-error"}`} role="status">{state.message}</p> : null}
      {!stop.phone ? <p className="payment-request-message is-error">Geen telefoonnummer: vul dit eerst aan bij de klant en maak daarna een nieuwe ronde.</p> : paymentRequestUrl && !whatsappUrl ? <p className="payment-request-message is-error">Het telefoonnummer is niet geschikt voor WhatsApp.</p> : null}
    </div>
  );
}
