import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { extractLegacyEiPimWorksheet, extractStandardWorksheet, parseImportWorkbook } from "../src/lib/excel-import";

describe("Excel-bestanden lezen", () => {
  it("vindt kolomkoppen onder een titelregel", () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Klantenlijst");
    sheet.addRow(["Bezorglijst voorjaar"]);
    sheet.addRow([]);
    sheet.addRow(["Naam", "Adres", "Postcode", "Plaats", "Eieren"]);
    sheet.addRow(["Familie Test", "Dorpsweg 1", "1234 AB", "Testdorp", 10]);

    const result = extractStandardWorksheet(sheet);
    expect(result).toMatchObject({ headerRowNumber: 3, headers: ["Naam", "Adres", "Postcode", "Plaats", "Eieren"] });
    expect(result?.rows[0][0]).toBe("Familie Test");
    expect(result?.rowNumbers).toEqual([4]);
  });

  it("zet het bestaande Ei Pim-formaat om naar klantenregels", () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Klanten");
    sheet.addRow([null, null, "Datum", null, "20 juni"]);
    sheet.addRow(["Rumbastraat", "Naam klant:", "Telefoonnummer:", "Frequentie:", "Gewoon", "Bio", "Betaald"]);
    sheet.addRow([71, "Familie Test", "0612345678", "Wekelijks", 1, null, 3.5]);
    sheet.addRow(["Vliegenzwam", null, null, "Frequentie:", "Gewoon", "Bio", "Betaald"]);
    sheet.addRow([8, "Familie Bio", "", "Om de week", null, 1, 4.3]);

    const result = extractLegacyEiPimWorksheet(sheet);
    expect(result).toMatchObject({ source: "ei-pim-legacy", suggestedCity: "Apeldoorn" });
    expect(result?.rows[0]).toEqual(["Familie Test", "Rumbastraat 71", "0612345678", "10", "0,35", "Wekelijks", "1"]);
    expect(result?.rows[1]).toEqual(["Familie Bio", "Vliegenzwam 8", "", "10", "0,43", "Om de week · 10 bio-eieren in de laatst ingevulde bestelling", "2"]);
    expect(result?.rowNumbers).toEqual([3, 5]);
  });

  it("behandelt de limiet per werkblad in plaats van over alle tabbladen samen", async () => {
    const workbook = new ExcelJS.Workbook();
    for (const name of ["Wijk A", "Wijk B"]) {
      const sheet = workbook.addWorksheet(name);
      sheet.addRow(["Naam", "Adres", "Postcode", "Plaats", "Eieren"]);
      for (let index = 1; index <= 600; index += 1) sheet.addRow([`Klant ${index}`, `Straat ${index}`, "1234 AB", "Testdorp", 10]);
    }
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const results = await parseImportWorkbook(buffer, "xlsx");
    expect(results).toHaveLength(2);
    expect(results.map((sheet) => sheet.rows.length)).toEqual([600, 600]);
    expect(results.every((sheet) => !sheet.rowLimitExceeded)).toBe(true);
  });
});
