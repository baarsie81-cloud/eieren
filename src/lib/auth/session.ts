import { createHmac, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE = "ei_pim_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, digestValue] = storedHash.includes(":") ? storedHash.split(":") : storedHash.split("$");
  if (algorithm !== "scrypt" || !saltValue || !digestValue) return false;

  try {
    const expected = Buffer.from(digestValue, "base64url");
    const derived = await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length);
    const actual = Buffer.from(derived as Buffer);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createSessionToken(username: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ username, exp: now + SESSION_MAX_AGE_SECONDS * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return false;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number; username?: string };
    return typeof value.exp === "number" && value.exp > now && typeof value.username === "string";
  } catch {
    return false;
  }
}
