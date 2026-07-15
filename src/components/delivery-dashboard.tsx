"use client";

import { useMemo, useState } from "react";
import type { DeliveryStop } from "@/data/demo-stops";
import { CheckIcon, EggIcon, ListIcon, MapIcon, SearchIcon, SettingsIcon } from "./icons";

type DeliveryDashboardProps = {
  initialStops: DeliveryStop[];
};

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export function DeliveryDashboard({ initialStops }: DeliveryDashboardProps) {
  const [activeView, setActiveView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [deliveredIds, setDeliveredIds] = useState<number[]>([]);
  const [routeStarted, setRouteStarted] = useState(false);

  const filteredStops = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("nl-NL");
    if (!normalizedQuery) return initialStops;
    return initialStops.filter((stop) =>
      `${stop.customer} ${stop.address}`.toLocaleLowerCase("nl-NL").includes(normalizedQuery),
    );
  }, [initialStops, query]);

  const deliveredCount = deliveredIds.length;
  const totalEggs = initialStops.reduce((total, stop) => total + stop.eggs, 0);
  const totalAmount = initialStops.reduce((total, stop) => total + stop.amount, 0);
  const progress = initialStops.length === 0 ? 0 : (deliveredCount / initialStops.length) * 100;

  function toggleDelivered(stopId: number) {
    setDeliveredIds((current) =>
      current.includes(stopId) ? current.filter((id) => id !== stopId) : [...current, stopId],
    );
  }

  return (
    <section className="dashboard" aria-labelledby="round-title">
      <header className="app-header">
        <div className="brand">
          <EggIcon className="brand-mark" />
          <div>
            <p className="brand-name">Ei Pim</p>
            <p className="brand-subtitle">Bezorgronde</p>
          </div>
        </div>
        <button className="icon-button" type="button" aria-label="Instellingen openen" title="Instellingen volgen later">
          <SettingsIcon className="icon" />
        </button>
      </header>

      <div className="dashboard-content">
        <div className="round-heading">
          <h1 id="round-title">Ronde van zaterdag</h1>
          <p>{initialStops.length} adressen <span aria-hidden="true">·</span> {totalEggs} eieren</p>
        </div>

        <div className="progress-block" aria-label={`${deliveredCount} van ${initialStops.length} bezorgd`}>
          <div className="progress-label"><strong>{deliveredCount} van {initialStops.length} bezorgd</strong><span>{Math.round(progress)}%</span></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="toolbar">
          <div className="view-switch" aria-label="Weergave kiezen">
            <button type="button" className={activeView === "list" ? "is-active" : ""} aria-pressed={activeView === "list"} onClick={() => setActiveView("list")}>
              <ListIcon className="icon" /> Lijst
            </button>
            <button type="button" className={activeView === "map" ? "is-active" : ""} aria-pressed={activeView === "map"} onClick={() => setActiveView("map")}>
              <MapIcon className="icon" /> Kaart
            </button>
          </div>
          <label className="search-field">
            <span className="sr-only">Zoek op naam of adres</span>
            <SearchIcon className="icon" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam of adres" />
          </label>
        </div>

        {activeView === "map" ? (
          <div className="map-preview" role="region" aria-label="Kaartweergave">
            <div className="map-route" aria-hidden="true">
              {initialStops.slice(0, 5).map((stop) => <span key={stop.id} style={{ "--stop": stop.id } as React.CSSProperties}>{stop.id}</span>)}
            </div>
            <h2>Kaart komt in de volgende stap</h2>
            <p>Hier verschijnt later de geoptimaliseerde wandelroute.</p>
          </div>
        ) : (
          <div className="delivery-list" aria-live="polite">
            {filteredStops.length === 0 ? (
              <div className="empty-state"><h2>Geen adres gevonden</h2><p>Probeer een andere naam of straat.</p></div>
            ) : filteredStops.map((stop) => {
              const isDelivered = deliveredIds.includes(stop.id);
              return (
                <article className={`delivery-row${isDelivered ? " is-delivered" : ""}`} key={stop.id}>
                  <span className="route-number" aria-label={`Stop ${stop.id}`}>{stop.id}</span>
                  <div className="customer">
                    <h2>{stop.customer}</h2>
                    <p>{stop.address}</p>
                    {stop.note ? <p className="note">{stop.note}</p> : null}
                  </div>
                  <p className="eggs">{stop.eggs} eieren</p>
                  <p className="amount">{euro.format(stop.amount)}</p>
                  <button className="delivered-button" type="button" aria-pressed={isDelivered} onClick={() => toggleDelivered(stop.id)}>
                    {isDelivered ? <><CheckIcon className="icon" /> Bezorgd</> : "Bezorgd"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <footer className="round-summary">
        <div><strong>Totaal deze ronde</strong><span>{initialStops.length} adressen · {totalEggs} eieren</span></div>
        <p><strong>{totalEggs}</strong><span>eieren</span></p>
        <p><strong>{euro.format(totalAmount)}</strong><span>waarde</span></p>
        <button type="button" onClick={() => setRouteStarted((current) => !current)}>{routeStarted ? "Route actief" : "Route starten"}</button>
      </footer>
    </section>
  );
}
