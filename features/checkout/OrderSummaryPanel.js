import Link from "next/link";
import { getCategoryIcon } from "@/utils/category";
import { getCouponDiscount } from "@/utils/coupons";
import { useStore } from "@/context/StoreContext";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { formatCurrency } from "@/utils/format";
import { CHECKOUT_FORM_ID } from "@/features/checkout/CheckoutForm";
import ProductImage from "@/components/ProductImage";
import { TagIcon } from "@/components/icons";
import Price from "@/components/Price";
import styles from "@/styles/Checkout.module.css";

export default function OrderSummaryPanel({
  items,
  total,
  submitting,
  termsAccepted,
  termsTouched,
  onTermsChange,
}) {
  const { couponCode, removeCoupon } = useStore();
  const { rate } = useExchangeRate();
  const discount = couponCode ? getCouponDiscount(couponCode, total) : null;
  const finalTotal = total - (discount?.amount || 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const showTermsError = termsTouched && !termsAccepted;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryHead}>
        <h2>Order Summary</h2>
        <span className={styles.itemCount}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>
      <ul className={styles.itemList}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <ProductImage
              src={item.imageUrl || item.images?.[0]}
              icon={getCategoryIcon(item.category)}
              background={item.color}
              alt={item.name}
              className={styles.itemThumb}
              sizes="64px"
            />
            <div className={styles.itemDetails}>
              <span className={styles.itemDetailsName}>{item.name}</span>
              <span className={styles.itemDetailsQty}>
                Qty: {item.qty} × <Price amount={item.price} />
              </span>
            </div>
            <Price amount={item.price * item.qty} />
          </li>
        ))}
      </ul>
      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <Price amount={total} />
      </div>
      {discount && (
        <div className={styles.summaryRow}>
          <span>
            <TagIcon /> {discount.code}
          </span>
          <span className={styles.discountRight}>
            <span className={styles.discountValue}>
              -<Price amount={discount.amount} />
            </span>
            <button type="button" className={styles.removeCouponBtn} onClick={removeCoupon}>
              Remove
            </button>
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

      <label className={`${styles.termsRow} ${showTermsError ? styles.termsRowError : ""}`}>
        <input
          type="checkbox"
          form={CHECKOUT_FORM_ID}
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
        />
        I agree to the Terms &amp; Conditions for orders and delivery.
      </label>
      {showTermsError && (
        <p className={styles.fieldError}>Please accept the Terms &amp; Conditions to continue.</p>
      )}

      <button
        type="submit"
        form={CHECKOUT_FORM_ID}
        className={styles.placeOrderBtn}
        disabled={submitting}
      >
        {submitting ? (
          "Placing Order…"
        ) : (
          <>
            Place Order — <Price amount={finalTotal} />
          </>
        )}
      </button>

      <div className={styles.secondaryActionsRow}>
        <Link href="/cart" className={styles.backToCartBtn}>
          ← Back to Cart
        </Link>
      </div>
    </div>
  );
}
