"use client";

import Link from "next/link";
import { formatAddress } from "@/lib/format";
import { useActionState } from "react";
import type { DeliveryRound, RoundWithStops } from "@/lib/types";
import { completeRoundAction, createRoundAction, startRoundAction } from "./actions";

const dateFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const statusLabels = { planned: "Gepland", active: "Actief", completed: "Afgerond" };

export function RoundManager({ rounds, selectedRound, suggestedDate, suggestedTitle }: { rounds: DeliveryRound[]; selectedRound: RoundWithStops | null; suggestedDate: string; suggestedTitle: string }) {
  const [state, action, pending] = useActionState(createRoundAction, { ok: false, message: "" });
  const activeRound = rounds.find((round) => round.status === "active");
  return (
    <>
      <section className="admin-section">
        <div className="section-heading"><div><h1>Bezorgrondes</h1><p>Maak handmatig een nieuwe ronde en bewaar eerdere rondes als historie.</p></div></div>
        <form className="round-create-form" action={action}>
          <label>Datum<input type="date" name="roundDate" defaultValue={suggestedDate} required /></label>
          <label>Rondetitel<input name="title" defaultValue={suggestedTitle} required /></label>
          <button className="primary-button" type="submit" disabled={pending || Boolean(activeRound)}>{pending ? "Aanmaken…" : "Nieuwe ronde maken"}</button>
        </form>
        {activeRound ? <p className="form-message">Rond eerst <strong>{activeRound.title}</strong> af voordat je een nieuwe ronde maakt.</p> : null}
        {state.message ? <p className={`form-message${state.ok ? " is-success" : " is-error"}`} role="status">{state.message}</p> : null}
      </section>
      <section className="admin-section">
        <div className="section-heading compact"><div><h2>Rondehistorie</h2><p>{rounds.length} rondes bewaard</p></div></div>
        <div className="round-list">
          {rounds.length === 0 ? <div className="empty-state"><h2>Nog geen rondes</h2><p>Maak hierboven de eerste bezorgronde.</p></div> : rounds.map((round) => (
            <article className="round-row" key={round.id}>
              <div><span className={`status-label status-${round.status}`}>{statusLabels[round.status]}</span><h3>{round.title}</h3><p>{dateFormat.format(new Date(`${round.roundDate}T12:00:00Z`))}</p></div>
              <div className="round-progress"><strong>{round.deliveredCount}/{round.stopCount}</strong><span>bezorgd</span></div>
              <div className="row-actions"><Link className="secondary-button" href={`/beheer/rondes?round=${round.id}`}>Bekijken</Link>{round.status === "planned" ? <form action={startRoundAction}><input type="hidden" name="id" value={round.id} /><button className="primary-button small" type="submit" disabled={Boolean(activeRound)}>Starten</button></form> : null}{round.status === "active" ? <form action={completeRoundAction} onSubmit={(event) => { if (!window.confirm("Deze ronde afronden? Daarna is de historie alleen-lezen.")) event.preventDefault(); }}><input type="hidden" name="id" value={round.id} /><button className="primary-button small" type="submit">Afronden</button></form> : null}</div>
            </article>
          ))}
        </div>
      </section>
      {selectedRound ? <section className="admin-section"><div className="section-heading compact"><div><h2>{selectedRound.title}</h2><p>{selectedRound.deliveredCount} van {selectedRound.stopCount} bezorgd</p></div><span className={`status-label status-${selectedRound.status}`}>{statusLabels[selectedRound.status]}</span></div><div className="history-stops">{selectedRound.stops.map((stop) => <div key={stop.id}><strong>{stop.routeOrder}. {stop.customerName}</strong><span>{formatAddress(stop.addressLine, stop.postalCode, stop.city)}</span><span>{stop.deliveredAt ? "Bezorgd" : "Niet bezorgd"}</span></div>)}</div></section> : null}
    </>
  );
}

