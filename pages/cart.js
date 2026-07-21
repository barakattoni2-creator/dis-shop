import Link from "next/link";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import CartItemList from "@/features/cart/CartItemList";
import CartSummary from "@/features/cart/CartSummary";
import RelatedProductsCarousel from "@/components/RelatedProductsCarousel";
import { TruckIcon, ChatIcon, BoltIcon, CheckIcon } from "@/components/icons";
import { fetchProducts } from "@/lib/catalog";
import { getCouponDiscount } from "@/utils/coupons";
import Price from "@/components/Price";
import styles from "@/styles/Cart.module.css";

function EmptyCartIllustration(props) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <circle cx="48" cy="48" r="46" fill="var(--surface)" />
      <path
        d="M22 26h8l7 34a4 4 0 0 0 4 3h26a4 4 0 0 0 4-3l6-22H34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="70" r="4" stroke="currentColor" strokeWidth="3" />
      <circle cx="65" cy="70" r="4" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export async function getStaticProps() {
  const products = await fetchProducts();
  const featured = products.filter((p) => p.featured);
  const recommended = (featured.length > 0 ? featured : products).slice(0, 10);
  return { props: { recommended }, revalidate: 60 };
}

export default function CartPage({ recommended }) {
  const { cart, removeFromCart, updateQty, cartTotal, couponCode } = useStore();
  const cartIds = new Set(cart.map((item) => item.id));
  const recommendedFiltered = recommended.filter((p) => !cartIds.has(p.id));
  const discount = couponCode ? getCouponDiscount(couponCode, cartTotal) : null;
  const finalTotal = cartTotal - (discount?.amount || 0);

  return (
    <Layout title="Your Cart">
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>Your Cart</h1>
          <Link href="/shop" className={styles.continueShoppingTop}>
            ← Continue Shopping
          </Link>
        </div>
        {cart.length === 0 ? (
          <div className={styles.empty}>
            <EmptyCartIllustration className={styles.emptyIllustration} />
            <h2 className={styles.emptyHeading}>Your cart is empty</h2>
            <p className={styles.emptyText}>
              Looks like you haven&apos;t added anything yet. Start exploring our catalog.
            </p>
            <Link href="/shop" className={styles.shopNowBtn}>
              Shop Now
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <CartItemList items={cart} onUpdateQty={updateQty} onRemove={removeFromCart} />
            <div className={styles.summaryCol}>
              <CartSummary items={cart} total={cartTotal} />
              <div className={styles.deliveryInfoBox}>
                <p>
                  <TruckIcon width="16" height="16" /> Delivery across Juba
                </p>
                <p>
                  <ChatIcon width="16" height="16" /> Delivery fee confirmed before dispatch
                </p>
                <p>
                  <BoltIcon width="16" height="16" /> Same-day dispatch
                </p>
                <p>
                  <CheckIcon width="16" height="16" /> Cash on Delivery available
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {recommendedFiltered.length > 0 && (
        <RelatedProductsCarousel
          products={recommendedFiltered}
          heading={cart.length === 0 ? "Recommended Products" : "You Might Also Like"}
        />
      )}

      {cart.length > 0 && (
        <div className={styles.mobileCheckoutBar}>
          <div className={styles.mobileCheckoutTotal}>
            <span>Total</span>
            <Price amount={finalTotal} className={styles.mobileCheckoutAmount} />
          </div>
          <Link href="/checkout" className={styles.mobileCheckoutBtn}>
            Checkout
          </Link>
        </div>
      )}
    </Layout>
  );
}
