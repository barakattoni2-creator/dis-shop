// Server-only. Merges admin-editable company info (stored as key/value rows
// in the Setting table) with the static defaults in data/contact.js, so the
// site keeps working with sensible values even before an admin edits anything.
import { isDbConfigured } from "@/lib/db";
import { fetchSettings } from "@/services/db/settings";
import {
  COMPANY_NAME,
  ADDRESS_LINES,
  EMAIL,
  PHONE_NUMBERS,
  WHATSAPP_NUMBER,
} from "@/data/contact";
import { SSP_PER_USD } from "@/data/currency";

function toDigits(raw: string | null | undefined): string {
  return (raw || "").replace(/[^\d]/g, "");
}

// Best-effort "+CCC XXX XXX XXX" grouping for South Sudan-style numbers;
// falls back to the raw digits (prefixed with +) for any other shape.
function formatPhoneDisplay(raw: string | null | undefined): string {
  const digits = toDigits(raw);
  if (digits.startsWith("211") && digits.length === 12) {
    return `+211 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }
  return `+${digits}`;
}

export interface CompanyInfo {
  companyName: string;
  addressLines: string[];
  email: string;
  phoneNumbers: Array<{ tel: string; display: string }>;
  phoneDisplay: string;
  phoneTel: string;
  whatsappNumber: string;
  whatsappDisplay: string;
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  const settings = isDbConfigured() ? await fetchSettings() : {};

  const companyName = settings.companyName?.trim() || COMPANY_NAME;
  const addressLines = settings.address
    ? settings.address.split("\n").map((line) => line.trim()).filter(Boolean)
    : ADDRESS_LINES;
  const email = settings.email?.trim() || EMAIL;

  const phone1 = settings.phone1?.trim() || PHONE_NUMBERS[0].tel;
  const phone2 = settings.phone2?.trim() || PHONE_NUMBERS[1]?.tel || "";
  const phoneNumbers = [phone1, phone2]
    .filter(Boolean)
    .map((raw) => ({ tel: `+${toDigits(raw)}`, display: formatPhoneDisplay(raw) }));

  const whatsappRaw = settings.whatsappNumber?.trim() || WHATSAPP_NUMBER;
  const whatsappNumber = toDigits(whatsappRaw);

  return {
    companyName,
    addressLines,
    email,
    phoneNumbers,
    phoneDisplay: phoneNumbers[0]?.display ?? "",
    phoneTel: phoneNumbers[0]?.tel ?? "",
    whatsappNumber,
    whatsappDisplay: formatPhoneDisplay(whatsappNumber),
  };
}

// The USD→SSP exchange rate, admin-editable from /admin/settings. Falls back
// to the static SSP_PER_USD default when no database is configured or no
// admin has set a rate yet — product prices themselves always stay in USD
// (see services/db/products.js); this only affects the SSP display conversion.
export async function fetchExchangeRate(): Promise<{ rate: number; updatedAt: string | null }> {
  const settings = isDbConfigured() ? await fetchSettings() : {};
  const parsed = Number(settings.exchangeRate);
  const rate = Number.isFinite(parsed) && parsed > 0 ? parsed : SSP_PER_USD;
  return {
    rate,
    updatedAt: settings.exchangeRateUpdatedAt || null,
  };
}
