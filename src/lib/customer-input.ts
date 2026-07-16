import { makeAddressKey, normalizePostalCode, parseMoneyToCents, parsePositiveInteger } from "./format";

export type CustomerInput = {
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  phone: string;
  defaultEggs: number;
  unitPriceCents: number | null;
  unitPriceInvalid: boolean;
  note: string;
  routeOrder: number;
  addressKey: string;
};

function clean(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function customerInputFromValues(values: Record<string, unknown>): CustomerInput {
  const addressLine = clean(values.addressLine, 180);
  const postalCode = normalizePostalCode(clean(values.postalCode, 16));
  const priceValue = clean(values.unitPrice, 30);
  const unitPriceCents = parseMoneyToCents(priceValue, true);
  return {
    name: clean(values.name, 120),
    addressLine,
    postalCode,
    city: clean(values.city, 100),
    phone: clean(values.phone, 40),
    defaultEggs: parsePositiveInteger(String(values.defaultEggs ?? "")),
    unitPriceCents,
    unitPriceInvalid: Boolean(priceValue) && unitPriceCents === null,
    note: clean(values.note, 500),
    routeOrder: Math.max(0, Number.parseInt(String(values.routeOrder ?? "0"), 10) || 0),
    addressKey: makeAddressKey(addressLine, postalCode),
  };
}

export function customerInputFromForm(formData: FormData) {
  return customerInputFromValues({
    name: formData.get("name"),
    addressLine: formData.get("addressLine"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    defaultEggs: formData.get("defaultEggs"),
    unitPrice: formData.get("unitPrice"),
    note: formData.get("note"),
    routeOrder: formData.get("routeOrder"),
  });
}

export function validateCustomerInput(input: CustomerInput) {
  const errors: string[] = [];
  if (input.name.length < 2) errors.push("Naam ontbreekt.");
  if (input.addressLine.length < 3) errors.push("Adres ontbreekt.");
  if (input.postalCode.length < 4) errors.push("Postcode ontbreekt.");
  if (input.city.length < 2) errors.push("Plaats ontbreekt.");
  if (input.defaultEggs < 1) errors.push("Aantal eieren moet minimaal 1 zijn.");
  if (input.defaultEggs > 999) errors.push("Aantal eieren mag maximaal 999 zijn.");
  if (input.unitPriceInvalid) errors.push("Prijs is ongeldig.");
  if (input.unitPriceCents != null && input.unitPriceCents < 0) errors.push("Prijs mag niet negatief zijn.");
  return errors;
}
