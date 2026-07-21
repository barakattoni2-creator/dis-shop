import { useState } from "react";
import Link from "next/link";
import { buildCartOrderLink } from "@/utils/whatsapp";
import { getCouponDiscount } from "@/utils/coupons";
import { useCompanyInfo, useExchangeRate } from "@/components/CompanyInfoProvider";
import { useStore } from "@/context/StoreContext";
import { TagIcon } from "@/components/icons";
import { formatCurrency } from "@/utils/format";
import Price from "@/components/Price";
import styles from "@/styles/Cart.module.css";

export default function CartSummary({ items, total }) {
  const { whatsappNumber } = useCompanyInfo();
  const { rate } = useExchangeRate();
  const { couponCode, applyCoupon, removeCoupon } = useStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const discount = couponCode ? getCouponDiscount(couponCode, total) : null;
  const finalTotal = total - (discount?.amount || 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleApply = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setError("Enter a coupon code.");
      return;
    }
    const result = getCouponDiscount(input, total);
    if (!result) {
      setError("That code isn't valid.");
      return;
    }
    setError("");
    applyCoupon(input);
    setInput("");
  };

  return (
    <div className={styles.summary}>
      <div className={styles.summaryHead}>
        <h2>Order Summary</h2>
        <span className={styles.itemCount}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {couponCode && discount ? (
        <div className={styles.couponApplied}>
          <span>
            <TagIcon /> {discount.code} applied
          </span>
          <button type="button" onClick={removeCoupon}>
            Remove
          </button>
        </div>
      ) : (
        <form className={styles.couponForm} onSubmit={handleApply}>
          <input
            className={styles.couponInput}
            placeholder="Coupon code (try WELCOME10)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className={styles.couponApplyBtn}>
            Apply
          </button>
        </form>
      )}
      {error && <p className={styles.couponError}>{error}</p>}

      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <Price amount={total} />
      </div>
      {discount && (
        <div className={styles.summaryRow}>
          <span>Discount ({discount.code})</span>
          <span className={styles.discountValue}>
            -<Price amount={discount.amount} />
          </span>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span>Delivery Fee</span>
        <span className={styles.deliveryFeeNote}>Confirmed via WhatsApp</span>
      </div>
      <div className={styles.summaryTotal}>
        <span>Total</span>
        <Price amount={finalTotal} />
      </div>
      <div className={styles.summarySsp}>
        <span>≈ {formatCurrency(finalTotal, "SSP", rate)}</span>
        <span className={styles.rateNote}>1 USD = {rate.toLocaleString("en-US")} SSP</span>
      </div>

      <Link href="/checkout" className={styles.checkoutBtn}>
        Proceed to Checkout
      </Link>
      <a
        className={styles.whatsappOrderBtn}
        href={buildCartOrderLink(items, finalTotal, whatsappNumber)}
        target="_blank"
        rel="noopener noreferrer"
      >
        💬 Order via WhatsApp
      </a>
      <Link href="/shop" className={styles.continueShoppingLink}>
        ← Continue Shopping
      </Link>
    </div>
  );
}
