import { describe, expect, it } from "vitest";
import { customerInputFromValues, validateCustomerInput } from "../src/lib/customer-input";
import { formatAddress, googleMapsWalkingUrl, makeAddressKey, normalizePostalCode, parseMoneyToCents } from "../src/lib/format";

describe("klantvalidatie en bedragen", () => {
  it("normaliseert adressen en postcodes", () => {
    expect(normalizePostalCode("1234ab")).toBe("1234 AB");
    expect(makeAddressKey(" Molen-straat 12 ", "1234 AB")).toBe("molenstraat12|1234ab");
  });

  it("zet Nederlandse geldbedragen om naar centen", () => {
    expect(parseMoneyToCents("€ 0,35")).toBe(35);
    expect(parseMoneyToCents("1.234,56")).toBe(123456);
    expect(parseMoneyToCents("onbekend")).toBeNull();
  });

  it("meldt ontbrekende velden en een ongeldige prijs", () => {
    const input = customerInputFromValues({ name: "A", addressLine: "", postalCode: "", city: "", defaultEggs: "0", unitPrice: "abc" });
    expect(validateCustomerInput(input)).toContain("Prijs is ongeldig.");
    expect(validateCustomerInput(input).length).toBeGreaterThan(3);
  });

  it("maakt alleen een route voor een volledig adres", () => {
    expect(googleMapsWalkingUrl("Molenstraat 12", "1234 AB", "Voorbeeldstad")).toContain("travelmode=walking");
    expect(googleMapsWalkingUrl("Molenstraat 12", "", "Voorbeeldstad")).toContain("travelmode=walking");
    expect(googleMapsWalkingUrl("Molenstraat", "", "Voorbeeldstad")).toBeNull();
  });

  it("toont een adres zonder dubbele spaties als de postcode ontbreekt", () => {
    expect(formatAddress("Molenstraat 12", "", "Apeldoorn")).toBe("Molenstraat 12, Apeldoorn");
  });
});
