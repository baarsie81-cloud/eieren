"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { completeDashboardRoundAction, startDashboardRoundAction, toggleDeliveryAction } from "@/app/dashboard-actions";
import { CheckIcon, ListIcon, RouteIcon, SearchIcon } from "./icons";
import { formatAddress, formatEuro, googleMapsAddressUrl, googleMapsWalkingUrl } from "@/lib/format";
import type { AppSettings, RoundWithStops } from "@/lib/types";

export function DeliveryDashboard({ round, settings }: { round: RoundWithStops | null; settings: AppSettings }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"list" | "route">("list");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredStops = useMemo(() => {
    if (!round) return [];
    const normalized = query.trim().toLocaleLowerCase("nl-NL");
    if (!normalized) return round.stops;
    return round.stops.filter((stop) => `${stop.customerName} ${stop.addressLine} ${stop.postalCode} ${stop.city}`.toLocaleLowerCase("nl-NL").includes(normalized));
  }, [round, query]);

  if (!round) {
    return <div className="dashboard-content empty-dashboard"><div className="empty-state"><h1>Geen bezorgronde gepland</h1><p>Maak een ronde aan zodra de klantenlijst klaarstaat.</p><Link className="primary-button" href="/beheer/rondes">Nieuwe ronde maken</Link></div></div>;
  }

  const currentRound = round;

  const deliveredCount = round.stops.filter((stop) => stop.deliveredAt).length;
  const totalEggs = round.stops.reduce((total, stop) => total + stop.eggs, 0);
  const totalAmountCents = round.stops.reduce((total, stop) => total + stop.eggs * stop.unitPriceCents, 0);
  const progress = round.stops.length === 0 ? 0 : deliveredCount / round.stops.length * 100;
  const nextStop = round.stops.find((stop) => !stop.deliveredAt);
  const firstRouteUrl = nextStop ? googleMapsWalkingUrl(nextStop.addressLine, nextStop.postalCode, nextStop.city) : null;
  const returnUrl = settings.returnToStart ? googleMapsAddressUrl(settings.startAddress) : null;
  const readOnly = round.status === "completed";

  function toggle(stopId: string, delivered: boolean) {
    startTransition(async () => {
      await toggleDeliveryAction(stopId, delivered);
      router.refresh();
    });
  }

  function startRoute() {
    if (firstRouteUrl) window.open(firstRouteUrl, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      await startDashboardRoundAction(currentRound.id);
      router.refresh();
    });
  }

  function completeRound() {
    startTransition(async () => {
      await completeDashboardRoundAction(currentRound.id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="dashboard-content">
        <div className="round-heading"><div><h1 id="round-title">{round.title}</h1><p>{round.stops.length} adressen <span aria-hidden="true">·</span> {totalEggs} eieren</p></div><span className={`status-label status-${round.status}`}>{round.status === "planned" ? "Gepland" : round.status === "active" ? "Actief" : "Afgerond"}</span></div>
        <div className="progress-block" aria-label={`${deliveredCount} van ${round.stops.length} bezorgd`}><div className="progress-label"><strong>{deliveredCount} van {round.stops.length} bezorgd</strong><span>{Math.round(progress)}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        {round.status === "planned" ? <p className="info-banner">Start de route om bezorgingen te kunnen afvinken.</p> : null}
        <div className="toolbar">
          <div className="view-switch" aria-label="Weergave kiezen"><button type="button" className={activeView === "list" ? "is-active" : ""} aria-pressed={activeView === "list"} onClick={() => setActiveView("list")}><ListIcon className="icon" /> Lijst</button><button type="button" className={activeView === "route" ? "is-active" : ""} aria-pressed={activeView === "route"} onClick={() => setActiveView("route")}><RouteIcon className="icon" /> Route</button></div>
          <label className="search-field"><span className="sr-only">Zoek op naam of adres</span><SearchIcon className="icon" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam of adres" /></label>
        </div>
        {activeView === "route" ? (
          <div className="route-list" aria-live="polite">
            {filteredStops.map((stop) => {
              const routeUrl = googleMapsWalkingUrl(stop.addressLine, stop.postalCode, stop.city);
              const isNext = nextStop?.id === stop.id && round.status === "active";
              return <article className={`route-row${isNext ? " is-next" : ""}${stop.deliveredAt ? " is-delivered" : ""}`} key={stop.id}><span className="route-number">{stop.routeOrder}</span><div><h2>{stop.customerName}</h2><p>{formatAddress(stop.addressLine, stop.postalCode, stop.city)}</p>{isNext ? <strong className="next-label">Volgende stop</strong> : null}</div>{routeUrl ? <a className="secondary-button" href={routeUrl} target="_blank" rel="noreferrer">Navigeer</a> : <span className="address-warning">Adres onvolledig</span>}</article>;
            })}
            {!nextStop && returnUrl ? <div className="return-route"><div><h2>Ronde klaar</h2><p>Navigeer terug naar het ingestelde startadres.</p></div><a className="primary-button" href={returnUrl} target="_blank" rel="noreferrer">Terug naar start</a></div> : null}
          </div>
        ) : (
          <div className="delivery-list" aria-live="polite">
            {filteredStops.length === 0 ? <div className="empty-state"><h2>Geen adres gevonden</h2><p>Probeer een andere naam of straat.</p></div> : filteredStops.map((stop) => {
              const delivered = Boolean(stop.deliveredAt);
              const isNext = nextStop?.id === stop.id && round.status === "active";
              return <article className={`delivery-row${delivered ? " is-delivered" : ""}${isNext ? " is-next" : ""}`} key={stop.id}><span className="route-number" aria-label={`Stop ${stop.routeOrder}`}>{stop.routeOrder}</span><div className="customer"><h2>{stop.customerName}</h2><p>{formatAddress(stop.addressLine, stop.postalCode, stop.city)}</p>{stop.note ? <p className="note">{stop.note}</p> : null}{isNext ? <strong className="next-label">Volgende stop</strong> : null}</div><p className="eggs">{stop.eggs} eieren</p><p className="amount">{formatEuro(stop.eggs * stop.unitPriceCents)}</p><button className="delivered-button" type="button" aria-pressed={delivered} onClick={() => toggle(stop.id, !delivered)} disabled={pending || round.status !== "active"}>{delivered ? <><CheckIcon className="icon" /> Ongedaan</> : "Bezorgd"}</button></article>;
            })}
          </div>
        )}
      </div>
      <footer className="round-summary"><div><strong>Totaal deze ronde</strong><span>{round.stops.length} adressen · {totalEggs} eieren</span></div><p><strong>{totalEggs}</strong><span>eieren</span></p><p><strong>{formatEuro(totalAmountCents)}</strong><span>waarde</span></p>{round.status === "planned" ? <button type="button" onClick={startRoute} disabled={pending || round.stops.length === 0}>{pending ? "Starten…" : "Route starten"}</button> : round.status === "active" && deliveredCount === round.stops.length ? <button type="button" onClick={completeRound} disabled={pending}>{pending ? "Afronden…" : "Ronde afronden"}</button> : nextStop && firstRouteUrl ? <a className="primary-button" href={firstRouteUrl} target="_blank" rel="noreferrer">Volgende stop</a> : <Link className="secondary-button" href="/beheer/rondes">Bekijk historie</Link>}</footer>
      {readOnly ? <p className="read-only-note">Deze afgeronde ronde is alleen-lezen.</p> : null}
    </>
  );
}
