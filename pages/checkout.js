import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import { getCouponDiscount } from "@/utils/coupons";
import { formatPrice } from "@/utils/format";
import { CheckIcon } from "@/components/icons";
import CheckoutForm from "@/features/checkout/CheckoutForm";
import OrderSummaryPanel from "@/features/checkout/OrderSummaryPanel";
import styles from "@/styles/Checkout.module.css";

const STEPS = ["Cart", "Delivery", "Review", "Confirmation"];
const CURRENT_STEP_INDEX = 1; // "Delivery" — this single-page form covers
// delivery + payment entry; review happens in the summary panel beside it.

function CheckoutProgress() {
  return (
    <div className={styles.progress}>
      {STEPS.map((step, i) => (
        <div key={step} className={styles.progressStep}>
          <span
            className={`${styles.progressDot} ${
              i < CURRENT_STEP_INDEX
                ? styles.progressDotDone
                : i === CURRENT_STEP_INDEX
                ? styles.progressDotActive
                : ""
            }`}
          >
            {i < CURRENT_STEP_INDEX ? <CheckIcon width="12" height="12" /> : i + 1}
          </span>
          <span
            className={`${styles.progressLabel} ${
              i === CURRENT_STEP_INDEX ? styles.progressLabelActive : ""
            }`}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <span
              className={`${styles.progressLine} ${
                i < CURRENT_STEP_INDEX ? styles.progressLineDone : ""
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, cartTotal, user, addOrder, clearCart, couponCode, removeCoupon } = useStore();
  const { phoneTel } = useCompanyInfo();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  // Lifted up from CheckoutForm so the Terms checkbox can render inside
  // OrderSummaryPanel (next to Place Order) while still gating that same
  // form's submission.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  const discount = couponCode ? getCouponDiscount(couponCode, cartTotal) : null;
  const finalTotal = cartTotal - (discount?.amount || 0);

  const handlePlaceOrder = async (fields) => {
    setError("");
    setPlacing(true);
    try {
      const notes = discount
        ? `${fields.notes ? fields.notes + "\n" : ""}Coupon: ${discount.code} (-${formatPrice(
            discount.amount
          )})`
        : fields.notes;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { id: user?.id || "guest", ...fields, notes, discount: discount?.amount ?? null },
          items: cart,
          total: finalTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order.");
      addOrder(data.order);
      clearCart();
      removeCoupon();
      router.push(`/order-confirmation?order=${encodeURIComponent(data.order.id)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Layout title="Checkout">
        <div className={styles.empty}>
          <p>Your cart is empty.</p>
          <Link href="/" className={styles.continueLink}>
            Continue shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout" description="Complete your DIS Shop order.">
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>Checkout</h1>
          <Link href="/cart" className={styles.continueShoppingTop}>
            ← Back to Cart
          </Link>
        </div>
        <CheckoutProgress />
        <div className={styles.layout}>
          <CheckoutForm
            initialName={user?.name}
            initialEmail={user?.email}
            initialPhone={phoneTel}
            items={cart}
            total={finalTotal}
            submitting={placing}
            error={error}
            termsAccepted={termsAccepted}
            termsTouched={termsTouched}
            onTermsBlur={() => setTermsTouched(true)}
            onSubmit={handlePlaceOrder}
          />
          <OrderSummaryPanel
            items={cart}
            total={cartTotal}
            submitting={placing}
            termsAccepted={termsAccepted}
            termsTouched={termsTouched}
            onTermsChange={(checked) => {
              setTermsAccepted(checked);
              setTermsTouched(true);
            }}
          />
        </div>
      </div>
    </Layout>
  );
}
