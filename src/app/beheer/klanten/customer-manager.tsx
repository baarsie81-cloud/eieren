"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SearchIcon, UploadIcon } from "@/components/icons";
import { formatAddress, formatEuro } from "@/lib/format";
import {
  detectImportMapping,
  importFieldLabels,
  importFields,
  mapWorksheetRows,
  type ImportMapping,
  type ImportPreviewRow,
  type WorksheetPreview,
} from "@/lib/import";
import type { Customer } from "@/lib/types";
import {
  confirmImportAction,
  deleteCustomerAction,
  moveCustomerAction,
  previewImportAction,
  saveCustomerAction,
  setCustomerActiveAction,
} from "./actions";

function priceInput(customer: Customer | null) {
  return customer?.unitPriceCents == null ? "" : (customer.unitPriceCents / 100).toFixed(2).replace(".", ",");
}

function CustomerForm({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveCustomerAction, { ok: false, message: "" });
  useEffect(() => { if (state.ok) onClose(); }, [state.ok, onClose]);
  return (
    <form className="customer-form" action={action}>
      <div className="section-heading compact">
        <div><h2>{customer ? "Klant wijzigen" : "Klant toevoegen"}</h2><p>Vul minimaal naam, adres, postcode, plaats en eieren in.</p></div>
        {customer ? <button className="text-button" type="button" onClick={onClose}>Annuleren</button> : null}
      </div>
      <input type="hidden" name="id" value={customer?.id ?? ""} />
      <div className="form-grid">
        <label className="span-2">Naam<input name="name" defaultValue={customer?.name} required /></label>
        <label className="span-2">Adres<input name="addressLine" defaultValue={customer?.addressLine} placeholder="Straat en huisnummer" required /></label>
        <label>Postcode<input name="postalCode" defaultValue={customer?.postalCode} required /></label>
        <label>Plaats<input name="city" defaultValue={customer?.city} required /></label>
        <label>Telefoon (optioneel)<input name="phone" type="tel" defaultValue={customer?.phone} /></label>
        <label>Aantal eieren<input name="defaultEggs" type="number" min="1" max="999" defaultValue={customer?.defaultEggs ?? 10} required /></label>
        <label>Prijs per ei (optioneel)<input name="unitPrice" inputMode="decimal" defaultValue={priceInput(customer)} placeholder="Bijv. 0,35" /></label>
        <label>Routevolgorde<input name="routeOrder" type="number" min="0" defaultValue={customer?.routeOrder ?? 0} /></label>
        <label className="span-2">Notitie<textarea name="note" rows={2} defaultValue={customer?.note} /></label>
      </div>
      {state.message ? <p className={`form-message${state.ok ? " is-success" : " is-error"}`} role="status">{state.message}</p> : null}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? "Opslaan…" : customer ? "Wijzigingen opslaan" : "Klant toevoegen"}</button>
    </form>
  );
}

function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [worksheets, setWorksheets] = useState<WorksheetPreview[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [defaultCity, setDefaultCity] = useState("");
  const [defaultPostalCode, setDefaultPostalCode] = useState("");
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, startTransition] = useTransition();
  const sheet = worksheets[sheetIndex];

  async function readFile(file?: File) {
    if (!file) return;
    setMessage("Bestand lezen…");
    setPreview([]);
    setWorksheets([]);
    setMapping(null);
    setDefaultCity("");
    setDefaultPostalCode("");
    const formData = new FormData();
    formData.set("file", file);
    try {
      const response = await fetch("/api/import/preview", { method: "POST", body: formData });
      const result = await response.json() as { worksheets?: WorksheetPreview[]; error?: string };
      if (!response.ok || !result.worksheets) {
        setMessage(result.error ?? "Importeren is niet gelukt.");
        return;
      }
      setWorksheets(result.worksheets);
      setSheetIndex(0);
      setMapping(detectImportMapping(result.worksheets[0].headers));
      setDefaultCity(result.worksheets[0].suggestedCity ?? "");
      setMessage(`${result.worksheets.length} werkblad${result.worksheets.length === 1 ? "" : "en"} gevonden. Kies het juiste werkblad en controleer de kolommen.`);
    } catch {
      setMessage("Het bestand kon niet worden gelezen. Probeer het opnieuw.");
    }
  }

  function chooseSheet(index: number) {
    setSheetIndex(index);
    setMapping(detectImportMapping(worksheets[index].headers));
    setDefaultCity(worksheets[index].suggestedCity ?? "");
    setDefaultPostalCode("");
    setPreview([]);
  }

  function candidates() {
    return sheet && mapping ? mapWorksheetRows(sheet.rows, mapping, {
      city: defaultCity,
      postalCode: defaultPostalCode,
      allowMissingPostalCode: sheet.source === "ei-pim-legacy",
      headerRowNumber: sheet.headerRowNumber,
      rowNumbers: sheet.rowNumbers,
    }) : [];
  }

  function makePreview() {
    startTransition(async () => {
      try {
        const result = await previewImportAction(candidates());
        setPreview(result);
        setMessage("Controlevoorbeeld gereed. Er is nog niets opgeslagen.");
      } catch {
        setMessage("Het controlevoorbeeld kon niet worden gemaakt.");
      }
    });
  }

  function confirmImport() {
    startTransition(async () => {
      const result = await confirmImportAction(candidates());
      setMessage(result.message);
      if (result.ok) {
        setPreview([]);
        setWorksheets([]);
        setMapping(null);
        setDefaultCity("");
        setDefaultPostalCode("");
      }
    });
  }

  const counts = preview.reduce<Record<string, number>>((total, row) => ({ ...total, [row.status]: (total[row.status] ?? 0) + 1 }), {});
  return (
    <section className="import-panel" aria-labelledby="import-title">
      <div className="section-heading compact"><div><h2 id="import-title">Importeren uit Excel</h2><p>Het bestand wordt alleen tijdelijk gelezen en nergens opgeslagen.</p></div></div>
      <div
        className="drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); void readFile(event.dataTransfer.files[0]); }}
      >
        <UploadIcon className="drop-icon" />
        <strong>Sleep een .xlsx- of .csv-bestand hierheen</strong>
        <span>Maximaal 5 MB en 1.000 regels</span>
        <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Bestand kiezen</button>
        <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.csv" onChange={(event) => void readFile(event.target.files?.[0])} />
      </div>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      {sheet && mapping ? (
        <div className="mapping-panel">
          {worksheets.length > 1 ? <label>Werkblad<select value={sheetIndex} onChange={(event) => chooseSheet(Number(event.target.value))}>{worksheets.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}</select></label> : null}
          {sheet.notice ? <p className="import-notice">{sheet.notice}</p> : null}
          {sheet.rowLimitExceeded ? <p className="form-message is-error">Dit werkblad bevat meer dan 1.000 regels. Maak het werkblad kleiner voordat je importeert.</p> : null}
          <div className="mapping-grid">
            {importFields.map((field) => (
              <label key={field}>{importFieldLabels[field]}
                <select value={mapping[field] ?? ""} onChange={(event) => { setMapping({ ...mapping, [field]: event.target.value === "" ? null : Number(event.target.value) }); setPreview([]); }}>
                  <option value="">Niet gebruiken</option>
                  {sheet.headers.map((header, index) => <option value={index} key={`${header}-${index}`}>{header || `Kolom ${index + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>
          {mapping.city == null || mapping.postalCode == null ? (
            <div className="import-defaults">
              <h3>Ontbrekende adresgegevens aanvullen</h3>
              <p>Deze waarden worden alleen gebruikt wanneer het gekozen werkblad geen eigen kolom heeft.</p>
              <div className="mapping-grid">
                {mapping.city == null ? <label>Plaats<input value={defaultCity} onChange={(event) => { setDefaultCity(event.target.value); setPreview([]); }} placeholder="Bijv. Apeldoorn" /></label> : null}
                {mapping.postalCode == null ? <label>Postcode (optioneel)<input value={defaultPostalCode} onChange={(event) => { setDefaultPostalCode(event.target.value); setPreview([]); }} placeholder="Later per klant aan te vullen" /></label> : null}
              </div>
            </div>
          ) : null}
          <button
            className="secondary-button"
            type="button"
            onClick={makePreview}
            disabled={loading
              || sheet.rowLimitExceeded
              || mapping.name == null
              || mapping.addressLine == null
              || (mapping.city == null && defaultCity.trim().length < 2)
              || (sheet.source !== "ei-pim-legacy" && mapping.postalCode == null && defaultPostalCode.trim().length < 4)}
          >{loading ? "Controleren…" : "Controlevoorbeeld maken"}</button>
        </div>
      ) : null}
      {preview.length ? (
        <div className="import-preview">
          <div className="import-counts"><span className="status-new">{counts.new ?? 0} nieuw</span><span className="status-update">{counts.update ?? 0} bijwerken</span><span>{counts.skip ?? 0} overslaan</span><span className="status-error">{counts.error ?? 0} fout</span></div>
          <div className="table-scroll"><table><thead><tr><th>Regel</th><th>Status</th><th>Naam</th><th>Adres</th><th>Toelichting</th></tr></thead><tbody>{preview.slice(0, 100).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td><span className={`status-label status-${row.status}`}>{row.status === "new" ? "nieuw" : row.status === "update" ? "bijwerken" : row.status === "skip" ? "overslaan" : "fout"}</span></td><td>{row.customer.name || "—"}</td><td>{formatAddress(row.customer.addressLine, row.customer.postalCode, row.customer.city)}</td><td>{row.reason}</td></tr>)}</tbody></table></div>
          {preview.length > 100 ? <p className="muted-text">De eerste 100 regels worden getoond; alle regels worden verwerkt.</p> : null}
          <button className="primary-button" type="button" onClick={confirmImport} disabled={loading || (counts.new ?? 0) + (counts.update ?? 0) === 0}>{loading ? "Importeren…" : "Goedgekeurde regels importeren"}</button>
        </div>
      ) : null}
    </section>
  );
}

export function CustomerManager({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("nl-NL");
    return customers.filter((customer) => customer.isActive !== showArchived && (!normalized || `${customer.name} ${customer.addressLine} ${customer.postalCode} ${customer.city}`.toLocaleLowerCase("nl-NL").includes(normalized)));
  }, [customers, query, showArchived]);

  return (
    <>
      <section className="admin-section">
        <div className="section-heading"><div><h1>Klantenbeheer</h1><p>{customers.filter((customer) => customer.isActive).length} actieve klanten</p></div><button className="primary-button" type="button" onClick={() => setEditing(null)}>Nieuwe klant</button></div>
        <CustomerForm key={editing?.id ?? "new"} customer={editing} onClose={() => setEditing(null)} />
      </section>
      <section className="admin-section">
        <div className="list-toolbar">
          <label className="search-field"><SearchIcon className="icon" /><span className="sr-only">Klanten zoeken</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam of adres" /></label>
          <div className="small-tabs"><button className={!showArchived ? "is-active" : ""} type="button" onClick={() => setShowArchived(false)}>Actief</button><button className={showArchived ? "is-active" : ""} type="button" onClick={() => setShowArchived(true)}>Archief</button></div>
        </div>
        <div className="customer-list">
          {visible.length === 0 ? <div className="empty-state"><h2>Geen klanten gevonden</h2><p>{showArchived ? "Het archief is leeg." : "Voeg een klant toe of pas de zoekopdracht aan."}</p></div> : visible.map((customer, index) => (
            <article className="customer-row" key={customer.id}>
              <div className="order-controls"><form action={moveCustomerAction}><input type="hidden" name="id" value={customer.id} /><input type="hidden" name="direction" value="up" /><button type="submit" aria-label={`${customer.name} omhoog`} disabled={index === 0}>↑</button></form><strong>{customer.routeOrder}</strong><form action={moveCustomerAction}><input type="hidden" name="id" value={customer.id} /><input type="hidden" name="direction" value="down" /><button type="submit" aria-label={`${customer.name} omlaag`} disabled={index === visible.length - 1}>↓</button></form></div>
              <div><h2>{customer.name}</h2><p>{formatAddress(customer.addressLine, customer.postalCode, customer.city)}</p>{customer.note ? <p className="note">{customer.note}</p> : null}</div>
              <div className="customer-meta"><span>{customer.defaultEggs} eieren</span><span>{customer.unitPriceCents == null ? "standaardprijs" : formatEuro(customer.unitPriceCents)}</span></div>
              <div className="row-actions"><button className="text-button" type="button" onClick={() => setEditing(customer)}>Wijzigen</button><form action={setCustomerActiveAction} onSubmit={(event) => { if (!showArchived && !window.confirm(`${customer.name} archiveren?`)) event.preventDefault(); }}><input type="hidden" name="id" value={customer.id} /><input type="hidden" name="active" value={showArchived ? "true" : "false"} /><button className={showArchived ? "secondary-button" : "danger-button"} type="submit">{showArchived ? "Herstellen" : "Archiveren"}</button></form>{showArchived ? <form action={deleteCustomerAction} onSubmit={(event) => { if (!window.confirm(`${customer.name} definitief verwijderen? Persoonsgegevens en betaallinks worden ook uit rondes verwijderd. Dit kan niet ongedaan worden gemaakt.`)) event.preventDefault(); }}><input type="hidden" name="id" value={customer.id} /><button className="danger-button" type="submit">Definitief verwijderen</button></form> : null}</div>
            </article>
          ))}
        </div>
      </section>
      <ImportPanel />
    </>
  );
}
