import Link from "next/link";
import Layout from "@/components/Layout";
import styles from "@/styles/NotFound.module.css";

export default function NotFoundPage() {
  return (
    <Layout title="Page Not Found" description="The page you're looking for doesn't exist.">
      <div className={styles.wrap}>
        <span className={styles.code}>404</span>
        <h1 className={styles.heading}>We couldn&apos;t find that page</h1>
        <p className={styles.text}>
          The page you&apos;re looking for may have been moved or no longer exists.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Back to Home
          </Link>
          <Link href="/shop" className={styles.secondaryBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </Layout>
  );
}
