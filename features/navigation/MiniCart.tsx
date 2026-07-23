import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import Price from "@/components/Price";
import { CartIcon } from "@/components/icons";
import styles from "@/styles/Header.module.css";

const PREVIEW_LIMIT = 4;

export default function MiniCart() {
  const { cart, cartCount, cartTotal, removeFromCart } = useStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.dropdownRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.actionLink}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className={styles.actionIcon}>
          <CartIcon />
          {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </span>
        <span className={styles.actionText}>Cart</span>
      </button>

      {open && (
        <div className={`${styles.dropdownPanel} ${styles.dropdownPanelWide}`}>
          {cart.length === 0 ? (
            <div className={styles.miniCartEmpty}>
              <CartIcon width="28" height="28" />
              <p>Your cart is empty.</p>
              <Link href="/shop" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.miniCartList}>
                {cart.slice(0, PREVIEW_LIMIT).map((item) => (
                  <div key={item.id} className={styles.miniCartRow}>
                    <span className={styles.searchSuggestThumb}>
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt="" fill sizes="36px" className={styles.searchSuggestImg} />
                      )}
                    </span>
                    <span className={styles.miniCartInfo}>
                      <span className={styles.searchSuggestName}>{item.name}</span>
                      <span className={styles.miniCartQty}>Qty {item.qty}</span>
                    </span>
                    <Price amount={item.price * item.qty} className={styles.searchSuggestPrice} />
                    <button
                      type="button"
                      className={styles.miniCartRemove}
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {cart.length > PREVIEW_LIMIT && (
                <p className={styles.miniCartMore}>+{cart.length - PREVIEW_LIMIT} more item(s) in cart</p>
              )}

              <div className={styles.miniCartFooter}>
                <div className={styles.miniCartSubtotal}>
                  <span>Subtotal</span>
                  <Price amount={cartTotal} className={styles.miniCartSubtotalAmount} />
                </div>
                <div className={styles.miniCartActions}>
                  <Link href="/cart" className={styles.miniCartViewBtn} onClick={() => setOpen(false)}>
                    View Cart
                  </Link>
                  <Link href="/checkout" className={styles.miniCartCheckoutBtn} onClick={() => setOpen(false)}>
                    Checkout
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
