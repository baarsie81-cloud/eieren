"use server";

import { redirect } from "next/navigation";
import { assertTrustedOrigin, setSessionCookie } from "@/lib/auth/guards";
import { verifyPassword } from "@/lib/auth/session";
import type { ActionState } from "@/lib/types";

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await assertTrustedOrigin();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const expectedUsername = process.env.APP_USERNAME ?? "";
  const passwordHash = process.env.APP_PASSWORD_HASH ?? "";

  const passwordOk = await verifyPassword(password, passwordHash);
  if (!expectedUsername || username !== expectedUsername || !passwordOk) {
    return { ok: false, message: "Gebruikersnaam of wachtwoord is onjuist." };
  }

  await setSessionCookie(username);
  const nextPath = String(formData.get("next") ?? "/");
  redirect(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/");
}

