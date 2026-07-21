// Best-effort formatting of a customer-entered phone number into the
// digits-only international format wa.me/tel: links need. Numbers are typed
// in mixed formats at checkout (with/without +211, with/without a leading
// 0), so this can't be perfectly certain — it's only used for admin
// "Call"/"WhatsApp" convenience links, never for matching or validation.
export function toWhatsAppDigits(phone: string | null | undefined): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("211")) return digits;
  if (digits.startsWith("0")) return `211${digits.slice(1)}`;
  if (digits.length === 9) return `211${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string | null | undefined, message = ""): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function buildTelLink(phone: string | null | undefined): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return `tel:+${digits}`;
}
