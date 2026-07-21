// Demo/placeholder promo codes — there is no backend coupon system (no
// database table, no admin management) yet. This is a client-side-only
// discount applied to the displayed total and included in the order notes
// so staff can see it; treat as a starting point for a real coupon feature.
interface Coupon {
  type: "percent" | "fixed";
  value: number;
  label: string;
}

const COUPONS: Record<string, Coupon> = {
  WELCOME10: { type: "percent", value: 10, label: "10% off your order" },
  SAVE20: { type: "fixed", value: 20, label: "$20 off your order" },
};

export interface AppliedCoupon {
  code: string;
  amount: number;
  label: string;
}

export function getCouponDiscount(code: string | null | undefined, subtotal: number): AppliedCoupon | null {
  if (!code || !subtotal || subtotal <= 0) return null;
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) return null;
  const amount =
    coupon.type === "percent"
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);
  return { code: code.trim().toUpperCase(), amount, label: coupon.label };
}
