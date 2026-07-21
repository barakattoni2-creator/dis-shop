import Link from "next/link";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import WishlistGrid from "@/features/wishlist/WishlistGrid";
import styles from "@/styles/Wishlist.module.css";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  return (
    <Layout title="Your Wishlist">
      <div className={styles.main}>
        <h1 className={styles.heading}>Your Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className={styles.empty}>
            <p>Your wishlist is empty.</p>
            <Link href="/" className={styles.continueLink}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <WishlistGrid
            items={wishlist}
            onAddToCart={addToCart}
            onRemove={toggleWishlist}
          />
        )}
      </div>
    </Layout>
  );
}
