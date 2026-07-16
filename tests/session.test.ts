import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createSessionToken, verifyPassword, verifySessionToken } from "../src/lib/auth/session";

describe("sessies", () => {
  it("accepteert een geldige sessie en weigert aanpassen of verlopen", () => {
    const now = Date.UTC(2026, 6, 16);
    const token = createSessionToken("pim", "heel-geheim", now);
    expect(verifySessionToken(token, "heel-geheim", now + 1000)).toBe(true);
    expect(verifySessionToken(`${token}x`, "heel-geheim", now + 1000)).toBe(false);
    expect(verifySessionToken(token, "verkeerd", now + 1000)).toBe(false);
    expect(verifySessionToken(token, "heel-geheim", now + 8 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it("controleert een scrypt-wachtwoordhash", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const digest = scryptSync("goed-wachtwoord", salt, 64);
    const hash = `scrypt:${salt.toString("base64url")}:${digest.toString("base64url")}`;
    await expect(verifyPassword("goed-wachtwoord", hash)).resolves.toBe(true);
    await expect(verifyPassword("fout-wachtwoord", hash)).resolves.toBe(false);
  });
});
