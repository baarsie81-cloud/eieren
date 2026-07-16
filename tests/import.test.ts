import { describe, expect, it } from "vitest";
import { detectImportMapping, findDuplicateImportRows, mapWorksheetRows } from "../src/lib/import";

describe("Excel-koppeling", () => {
  it("herkent gangbare Nederlandse kolomnamen", () => {
    const mapping = detectImportMapping(["Klantnaam", "Adres", "Postcode", "Woonplaats", "Aantal eieren", "Prijs per ei"]);
    expect(mapping).toMatchObject({ name: 0, addressLine: 1, postalCode: 2, city: 3, defaultEggs: 4, unitPrice: 5 });
  });

  it("zet gekoppelde regels om naar klanten", () => {
    const mapping = detectImportMapping(["Naam", "Adres", "Postcode", "Plaats", "Eieren", "Prijs"]);
    const rows = mapWorksheetRows([["Familie Test", "Dorpsweg 1", "1234ab", "Testdorp", "12", "0,30"]], mapping);
    expect(rows[0]).toMatchObject({ name: "Familie Test", postalCode: "1234 AB", defaultEggs: 12, unitPriceCents: 30, rowNumber: 2 });
  });

  it("markeert een tweede identiek adres als dubbel", () => {
    const mapping = detectImportMapping(["Naam", "Adres", "Postcode", "Plaats", "Eieren"]);
    const rows = mapWorksheetRows([
      ["Klant 1", "Dorpsweg 1", "1234 AB", "Testdorp", "10"],
      ["Klant 2", "Dorpsweg 1", "1234AB", "Testdorp", "6"],
    ], mapping);
    expect([...findDuplicateImportRows(rows)]).toEqual([3]);
  });
});
