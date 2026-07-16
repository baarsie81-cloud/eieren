"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, { ok: false, message: "" });
  return (
    <form className="login-form" action={action}>
      <input type="hidden" name="next" value={nextPath} />
      <label>
        Gebruikersnaam
        <input name="username" autoComplete="username" required autoFocus />
      </label>
      <label>
        Wachtwoord
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.message ? <p className="form-message is-error" role="alert">{state.message}</p> : null}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}

