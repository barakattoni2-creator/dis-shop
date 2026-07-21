import { SSP_PER_USD } from "@/data/currency";

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// amount is always stored in USD; SSP is converted for display only, using
// the live admin-editable rate when the caller has one (see Price.js) and
// falling back to the static default otherwise.
export function formatCurrency(amount: number, currency: "USD" | "SSP" = "USD", rate: number = SSP_PER_USD): string {
  if (currency === "SSP") {
    const ssp = amount * rate;
    return `SSP ${ssp.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return formatPrice(amount);
}

export function calcDiscount(price: number, originalPrice: number | null | undefined): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
