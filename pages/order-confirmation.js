import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import { useCompanyInfo, useExchangeRate } from "@/components/CompanyInfoProvider";
import { buildCartOrderLink } from "@/utils/whatsapp";
import { formatPrice, formatCurrency } from "@/utils/format";
import { getCategoryIcon } from "@/utils/category";
import { CheckIcon, DownloadIcon, TruckIcon } from "@/components/icons";
import ProductImage from "@/components/ProductImage";
import Price from "@/components/Price";
import DeliveryLocationPreview from "@/features/track/DeliveryLocationPreview";
import styles from "@/styles/OrderConfirmation.module.css";

// Real admin-settable statuses — see data/orderStatuses.js for the current
// canonical list, kept identical to features/track/OrderStatusResult.js so
// the Track Order page and this page agree. Orders placed before that
// vocabulary existed may still carry the old values ("Pending", "Shipped");
// those map to their closest new-vocabulary label/step. "Preparing" and
// "Ready for Delivery" have no legacy equivalent — a legacy "Shipped" order
// is inferred as already past them, so nothing is fabricated.
const STATUS_LABELS = {
  Pending: "Order Received",
  Shipped: "Out for Delivery",
};

const TRACKING_STEPS = [
  "Order Received",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
];
const STATUS_STEP_INDEX = {
  "Order Received": 0,
  Pending: 0,
  Confirmed: 1,
  Preparing: 2,
  "Ready for Delivery": 3,
  "Out for Delivery": 4,
  Shipped: 4,
  Delivered: 5,
};

function downloadInvoice(order) {
  const lines = [
    "DIS Shop — Order Invoice",
    `Order Number: ${order.orderNumber || order.id}`,
    `Date: ${new Date(order.date).toLocaleString()}`,
    "",
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    order.customer.email ? `Email: ${order.customer.email}` : null,
    `Delivery Area: ${order.customer.deliveryZone || "-"}`,
    order.customer.address ? `Delivery Address: ${order.customer.address}` : null,
    order.deliveryMapUrl ? `Pinned Location: ${order.deliveryMapUrl}` : null,
    `Payment Method: ${order.customer.payment || "-"}`,
    "",
    "Items:",
    ...order.items.map((i) => `  ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`),
    "",
    `Total: ${formatPrice(order.total)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const blob = new Blob([lines], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.orderNumber || order.id}-invoice.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { orders } = useStore();
  const { whatsappNumber } = useCompanyInfo();
  const { rate } = useExchangeRate();
  const { order: orderId } = router.query;

  const order = orderId ? orders.find((o) => o.id === orderId) : orders[0];

  // This page's `order` is a local snapshot saved once at checkout — it
  // never sees later admin status changes on its own. Reusing the same
  // public lookup the Track Order page calls keeps it current without a
  // full re-architecture: silently refresh the status in the background,
  // degrading to the snapshot if the lookup fails for any reason (no DB,
  // no match, local-only order, offline).
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (!order?.orderNumber || !order?.customer?.phone) return;
    let cancelled = false;
    fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: order.orderNumber, phone: order.customer.phone }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.order?.status) setLiveStatus(data.order.status);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [order?.orderNumber, order?.customer?.phone]);

  if (!order) {
    return (
      <Layout title="Order Confirmation">
        <div className={styles.notFound}>
          <p>We couldn&apos;t find that order.</p>
          <Link href="/track-order" className={styles.link}>
            View your orders
          </Link>
        </div>
      </Layout>
    );
  }

  const status = liveStatus || order.status || "Pending";
  const statusLabel = STATUS_LABELS[status] || status;
  const currentStep = STATUS_STEP_INDEX[status];
  const isCancelled = status === "Cancelled";
  const isTerminalOutcome = status === "Cancelled" || status === "Returned";

  const whatsappLink = buildCartOrderLink(order.items, order.total, whatsappNumber, {
    name: order.customer.name,
    phone: order.customer.phone,
    orderNumber: order.orderNumber || order.id,
    mapUrl: order.deliveryMapUrl,
  });

  return (
    <Layout title="Order Confirmed" description="Your DIS Shop order has been placed.">
      <div className={styles.main}>
        <div className={styles.successHeader}>
          <div className={styles.badge}>
            <CheckIcon width="42" height="42" />
          </div>
          <h1 className={styles.heading}>Order Confirmed</h1>
          <p className={styles.subtext}>Thank you, {order.customer.name}!</p>
          <span className={styles.orderNumberPill}>
            Order {order.orderNumber || order.id}
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.highlightRow}>
            <div className={styles.highlightItem}>
              <span className={styles.label}>Order Number</span>
              <span className={styles.highlightValue}>{order.orderNumber || order.id}</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.label}>Total (USD)</span>
              <span className={styles.highlightValue}>{formatPrice(order.total)}</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.label}>Total (SSP)</span>
              <span className={styles.highlightValue}>
                ≈ {formatCurrency(order.total, "SSP", rate)}
              </span>
              <span className={styles.rateNote}>1 USD = {rate.toLocaleString("en-US")} SSP</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.label}>Current Status</span>
              <span className={`${styles.statusPill} ${isTerminalOutcome ? styles.statusPillCancelled : ""}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.row}>
              <span className={styles.label}>Order Date</span>
              <span className={styles.value}>{new Date(order.date).toLocaleString()}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Customer Name</span>
              <span className={styles.value}>{order.customer.name}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Payment Method</span>
              <span className={styles.value}>{order.customer.payment || "-"}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Delivery Area</span>
              <span className={styles.value}>{order.customer.deliveryZone || "-"}</span>
            </div>
            <div className={`${styles.row} ${styles.rowFull}`}>
              <span className={styles.label}>Delivery Address</span>
              <span className={styles.value}>{order.customer.address || "-"}</span>
            </div>
          </div>

          {order.deliveryLatitude != null && order.deliveryLongitude != null && (
            <div className={styles.mapSection}>
              <span className={styles.label}>Delivery Location</span>
              <DeliveryLocationPreview
                lat={order.deliveryLatitude}
                lng={order.deliveryLongitude}
                mapUrl={order.deliveryMapUrl}
                label={order.deliveryLocationLabel}
              />
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Order Items</h2>
          <ul className={styles.itemList}>
            {order.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <ProductImage
                  src={item.imageUrl || item.images?.[0]}
                  icon={getCategoryIcon(item.category)}
                  background={item.color}
                  alt={item.name}
                  className={styles.itemThumb}
                  sizes="72px"
                />
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemMeta}>
                    Qty: {item.qty} × <Price amount={item.price} />
                  </span>
                </div>
                <Price amount={item.price * item.qty} className={styles.itemSubtotal} />
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Order Tracking</h2>
          {isTerminalOutcome ? (
            <p className={styles.cancelledNote}>
              {isCancelled
                ? "This order was cancelled. Contact us by WhatsApp if you have questions."
                : "This order was returned. Contact us by WhatsApp if you have questions."}
            </p>
          ) : (
            <div className={styles.timeline}>
              {TRACKING_STEPS.map((step, i) => (
                <div key={step} className={styles.timelineStep}>
                  <div className={styles.timelineStepHead}>
                    <span
                      className={`${styles.timelineDot} ${
                        i < currentStep
                          ? styles.timelineDotDone
                          : i === currentStep
                          ? styles.timelineDotActive
                          : ""
                      }`}
                    >
                      {i < currentStep ? <CheckIcon width="12" height="12" /> : i + 1}
                    </span>
                    <span
                      className={`${styles.timelineLabel} ${
                        i === currentStep ? styles.timelineLabelActive : ""
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < TRACKING_STEPS.length - 1 && (
                    <span
                      className={`${styles.timelineLine} ${
                        i < currentStep ? styles.timelineLineDone : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.infoBox}>
          <p>Keep your order number for tracking.</p>
          <p>Delivery details will be confirmed by WhatsApp or phone.</p>
          <p>Delivery fee is confirmed before dispatch.</p>
          {order.customer.payment === "Cash on Delivery" && <p>Payment method: Cash on Delivery.</p>}
        </div>

        <div className={styles.actions}>
          <Link href="/track-order" className={styles.trackBtn}>
            <TruckIcon width="16" height="16" /> Track Order
          </Link>
          <a
            className={styles.whatsappBtn}
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Confirm via WhatsApp
          </a>
          <button type="button" className={styles.invoiceBtn} onClick={() => downloadInvoice(order)}>
            <DownloadIcon width="16" height="16" /> Download Invoice
          </button>
          <Link href="/shop" className={styles.shopBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </Layout>
  );
}
