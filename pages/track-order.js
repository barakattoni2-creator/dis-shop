import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import TrackOrderSearch from "@/features/track/TrackOrderSearch";
import OrderStatusResult from "@/features/track/OrderStatusResult";
import { CloseIcon, SearchIcon } from "@/components/icons";
import styles from "@/styles/TrackOrder.module.css";

export default function TrackOrderPage() {
  const { orders } = useStore();
  const { whatsappNumber } = useCompanyInfo();
  // idle | loading | found | notFound | error
  const [status, setStatus] = useState("idle");
  const [order, setOrder] = useState(null);

  const lastLocalOrder = orders[0];

  async function handleSearch({ orderNumber, phone }) {
    setStatus("loading");
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      if (res.status === 404) {
        setStatus("notFound");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      setOrder(data.order);
      setStatus("found");
    } catch {
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setOrder(null);
  }

  const supportLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hi DIS Shop, I need help finding my order."
  )}`;

  return (
    <Layout title="Track Order" description="Track your DIS Shop order.">
      <div className={styles.main}>
        {status === "found" && order ? (
          <OrderStatusResult order={order} onTrackAnother={handleReset} />
        ) : (
          <>
            <TrackOrderSearch
              onSearch={handleSearch}
              loading={status === "loading"}
              defaultOrderNumber={lastLocalOrder?.orderNumber || ""}
              defaultPhone={lastLocalOrder?.customer?.phone || ""}
            />

            {status === "notFound" && (
              <div className={styles.notFoundCard}>
                <div className={styles.notFoundIcon}>
                  <SearchIcon width="24" height="24" />
                </div>
                <h2 className={styles.notFoundHeading}>Order not found</h2>
                <p className={styles.notFoundText}>
                  Check your order number and phone number, then try again.
                </p>
                <div className={styles.notFoundActions}>
                  <button type="button" className={styles.retryBtn} onClick={handleReset}>
                    Try Again
                  </button>
                  <a
                    className={styles.supportBtn}
                    href={supportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className={styles.notFoundCard}>
                <div className={styles.notFoundIcon}>
                  <CloseIcon width="24" height="24" />
                </div>
                <h2 className={styles.notFoundHeading}>Something went wrong</h2>
                <p className={styles.notFoundText}>
                  We couldn&apos;t reach our servers. Please try again in a moment.
                </p>
                <div className={styles.notFoundActions}>
                  <button type="button" className={styles.retryBtn} onClick={handleReset}>
                    Try Again
                  </button>
                  <a
                    className={styles.supportBtn}
                    href={supportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
