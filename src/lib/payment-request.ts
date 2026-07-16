import type { DeliveryStop } from "./types";
import { formatEuro } from "./format";

export function validPaymentRequestUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.length > 1000) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^06\d{8}$/.test(digits)) return `31${digits.slice(1)}`;
  if (/^6\d{8}$/.test(digits)) return `31${digits}`;
  if (/^00316\d{8}$/.test(digits)) return digits.slice(2);
  if (/^316\d{8}$/.test(digits)) return digits;
  if (value.trim().startsWith("+") && /^\d{8,15}$/.test(digits)) return digits;
  return null;
}

export function whatsappPaymentRequestUrl(stop: DeliveryStop, paymentRequestUrl: string) {
  const phone = normalizeWhatsAppPhone(stop.phone);
  const validUrl = validPaymentRequestUrl(paymentRequestUrl);
  if (!phone || !validUrl) return null;
  const amount = formatEuro(stop.eggs * stop.unitPriceCents);
  const message = [
    `Hoi ${stop.customerName}, de eieren zijn bezorgd 🥚`,
    "",
    `Het bedrag is ${amount}.`,
    "Betalen kan via ING:",
    validUrl,
    "",
    "Bedankt!",
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
