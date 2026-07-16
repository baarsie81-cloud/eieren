"use client";

import { useActionState } from "react";
import { resetAppAction } from "./actions";

export function ResetAppForm() {
  const [state, action, pending] = useActionState(resetAppAction, { ok: false, message: "" });

  return (
    <form className="reset-app-form" action={action}>
      <p>Deze actie kan niet ongedaan worden gemaakt. De login blijft behouden.</p>
      <label>
        Typ <strong>LEEGMAKEN</strong> om te bevestigen
        <input name="confirmation" autoComplete="off" required />
      </label>
      {state.message ? <p className={`form-message${state.ok ? " is-success" : " is-error"}`} role="status">{state.message}</p> : null}
      <button className="danger-button" type="submit" disabled={pending}>{pending ? "Leegmaken…" : "Alles definitief leegmaken"}</button>
    </form>
  );
}
