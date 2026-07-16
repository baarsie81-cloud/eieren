const DIACRITICS = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]/g;

export function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("nl-NL")
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(NON_ALPHANUMERIC, "");
}

export function normalizePostalCode(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, "").trim();
  if (/^\d{4}[A-Z]{2}$/.test(compact)) return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  return value.trim().toUpperCase();
}

export function makeAddressKey(addressLine: string, postalCode: string) {
  return `${normalizeText(addressLine)}|${normalizeText(postalCode)}`;
}

export function parsePositiveInteger(value: FormDataEntryValue | string | number, fallback = 0) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseMoneyToCents(value: string, allowEmpty = false): number | null {
  const cleaned = value.trim();
  if (!cleaned && allowEmpty) return null;
  if (!cleaned) return 0;

  const normalized = cleaned
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function formatAddress(addressLine: string, postalCode: string, city: string) {
  const locality = [postalCode.trim(), city.trim()].filter(Boolean).join(" ");
  return [addressLine.trim(), locality].filter(Boolean).join(", ");
}

export function hasCompleteAddress(addressLine: string, postalCode: string, city: string) {
  return addressLine.trim().length >= 3 && /\d/.test(addressLine) && (!postalCode || postalCode.trim().length >= 4) && city.trim().length >= 2;
}

export function googleMapsWalkingUrl(addressLine: string, postalCode: string, city: string) {
  if (!hasCompleteAddress(addressLine, postalCode, city)) return null;
  const destination = encodeURIComponent([addressLine, postalCode, city].filter(Boolean).join(", "));
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking&dir_action=navigate`;
}

export function googleMapsAddressUrl(address: string) {
  if (address.trim().length < 5) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=walking&dir_action=navigate`;
}

export function getNextWeekday(day: number, from = new Date()) {
  const result = new Date(from);
  result.setHours(12, 0, 0, 0);
  const offset = (day - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + offset);
  return result.toISOString().slice(0, 10);
}

