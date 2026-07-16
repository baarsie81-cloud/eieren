import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone, validPaymentRequestUrl, whatsappPaymentRequestUrl } from "../src/lib/payment-request";
import type { DeliveryStop } from "../src/lib/types";

const stop: DeliveryStop = {
  id: "1",
  roundId: "1",
  customerName: "Familie Test",
  addressLine: "Teststraat 1",
  postalCode: "1234 AB",
  city: "Apeldoorn",
  phone: "06-12345678",
  eggs: 10,
  unitPriceCents: 35,
  note: "",
  routeOrder: 1,
  deliveredAt: "2026-07-16T12:00:00.000Z",
  paymentRequestUrl: "",
};

describe("ING-betaalverzoek via WhatsApp", () => {
  it("normaliseert Nederlandse mobiele nummers", () => {
    expect(normalizeWhatsAppPhone("06-12345678")).toBe("31612345678");
    expect(normalizeWhatsAppPhone("+31 6 12345678")).toBe("31612345678");
    expect(normalizeWhatsAppPhone("6 12345678")).toBe("31612345678");
    expect(normalizeWhatsAppPhone("055-1234567")).toBeNull();
  });

  it("accepteert alleen https-links", () => {
    expect(validPaymentRequestUrl("https://voorbeeld.nl/verzoek")).toBe("https://voorbeeld.nl/verzoek");
    expect(validPaymentRequestUrl("http://voorbeeld.nl/verzoek")).toBeNull();
    expect(validPaymentRequestUrl("geen link")).toBeNull();
  });

  it("maakt een WhatsApp-link met klant, bedrag en betaallink", () => {
    const url = whatsappPaymentRequestUrl(stop, "https://voorbeeld.nl/verzoek");
    expect(url).toContain("https://wa.me/31612345678");
    expect(decodeURIComponent(url ?? "")).toContain("Het bedrag is € 3,50.");
    expect(decodeURIComponent(url ?? "")).toContain("https://voorbeeld.nl/verzoek");
  });
});
