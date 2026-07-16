"use client";

import { useActionState } from "react";
import type { AppSettings } from "@/lib/types";
import { saveSettingsAction } from "./actions";

const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, { ok: false, message: "" });
  return (
    <form className="settings-form" action={action}>
      <div className="form-grid">
        <label>Vaste rondedag<select name="roundDay" defaultValue={settings.roundDay}>{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
        <label>Standaardprijs per ei<input name="defaultUnitPrice" inputMode="decimal" defaultValue={(settings.defaultUnitPriceCents / 100).toFixed(2).replace(".", ",")} required /></label>
        <label className="span-2">Rondetitel<input name="roundTitle" defaultValue={settings.roundTitle} required /></label>
        <label className="span-2">Startadres<input name="startAddress" defaultValue={settings.startAddress} placeholder="Straat 1, postcode plaats" /></label>
        <label className="check-field span-2"><input name="returnToStart" type="checkbox" defaultChecked={settings.returnToStart} /><span>Na de laatste bezorging navigeren naar het startadres</span></label>
      </div>
      {state.message ? <p className={`form-message${state.ok ? " is-success" : " is-error"}`} role="status">{state.message}</p> : null}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? "Opslaan…" : "Instellingen opslaan"}</button>
    </form>
  );
}

