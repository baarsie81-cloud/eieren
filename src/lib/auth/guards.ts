import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySessionToken } from "./session";

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}

export async function requireSession() {
  if (!(await isAuthenticated())) redirect("/login");
}

export async function setSessionCookie(username: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET ontbreekt.");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(username, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function assertTrustedOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const fetchSite = requestHeaders.get("sec-fetch-site");

  if (!origin) {
    if (fetchSite === "same-origin" || fetchSite === "none") return;
    throw new Error("Ongeldige aanvraag.");
  }
  if (!host || new URL(origin).host !== host) throw new Error("Ongeldige herkomst.");
}

