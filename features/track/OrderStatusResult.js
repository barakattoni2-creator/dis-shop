import Link from "next/link";
import Price from "@/components/Price";
import ProductImage from "@/components/ProductImage";
import DeliveryLocationPreview from "@/features/track/DeliveryLocationPreview";
import { useCompanyInfo, useExchangeRate } from "@/components/CompanyInfoProvider";
import { buildCartOrderLink } from "@/utils/whatsapp";
import { formatPrice, formatCurrency } from "@/utils/format";
import { getCategoryIcon } from "@/utils/category";
import { DELIVERY_ZONES } from "@/data/delivery";
import { CheckIcon, DownloadIcon, StarIcon, ChevronLeftIcon } from "@/components/icons";
import ocStyles from "@/styles/OrderConfirmation.module.css";
import styles from "@/styles/TrackOrder.module.css";

// Real admin-settable statuses — see data/orderStatuses.js for the current
// canonical list. Orders placed before that vocabulary existed may still
// carry the old values ("Pending", "Shipped"); those map to their closest
// new-vocabulary label/step. "Preparing" and "Ready for Delivery" have no
// legacy equivalent — a legacy "Shipped" order is inferred as already past
// them (never shown as the *current* step), so nothing is fabricated.
const STATUS_LABELS = {
  Pending: "Order Received",
  Shipped: "Out for Delivery",
};

const STATUS_DESCRIPTIONS = {
  "Order Received": "We've received your order and will confirm it shortly.",
  Pending: "We've received your order and will confirm it shortly.",
  Confirmed: "Your order is confirmed and being prepared.",
  Preparing: "Your order is being prepared.",
  "Ready for Delivery": "Your order is packed and ready to go out for delivery.",
  "Out for Delivery": "Your order is on its way to you.",
  Shipped: "Your order is on its way to you.",
  Delivered: "Your order has been delivered. Thank you for shopping with DIS Shop!",
  Cancelled: "This order was cancelled.",
  Returned: "This order was returned.",
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

const KNOWN_ZONES = new Set(DELIVERY_ZONES.filter((z) => !z.startsWith("Custom")));

function downloadInvoice(order) {
  const lines = [
    "DIS Shop — Order Invoice",
    `Order Number: ${order.orderNumber || order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    "",
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone || "-"}`,
    `Delivery Area: ${order.deliveryZone || "-"}`,
    order.address ? `Delivery Address: ${order.address}` : null,
    order.deliveryMapUrl ? `Pinned Location: ${order.deliveryMapUrl}` : null,
    `Payment Method: ${order.payment || "-"}`,
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

export default function OrderStatusResult({ order, onTrackAnother }) {
  const { whatsappNumber } = useCompanyInfo();
  const { rate } = useExchangeRate();

  const status = order.status || "Pending";
  const statusLabel = STATUS_LABELS[status] || status;
  const statusDescription = STATUS_DESCRIPTIONS[status] || "";
  const currentStep = STATUS_STEP_INDEX[status];
  const isCancelled = status === "Cancelled";
  const isTerminalOutcome = status === "Cancelled" || status === "Returned";
  const showTimeline = !isTerminalOutcome && currentStep !== undefined;
  const hasLocation = order.deliveryLatitude != null && order.deliveryLongitude != null;

  const estimatedDelivery = KNOWN_ZONES.has(order.deliveryZone)
    ? "Same-day dispatch"
    : "Delivery fee and time confirmed by WhatsApp";

  const whatsappLink = buildCartOrderLink(order.items, order.total, whatsappNumber, {
    name: order.customerName,
    phone: order.phone,
    orderNumber: order.orderNumber || order.id,
    mapUrl: order.deliveryMapUrl,
  });

  const feedbackLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi DIS Shop, I'd like to share feedback on my order ${order.orderNumber || order.id}.`
  )}`;

  return (
    <div className={styles.resultWrap}>
      <button type="button" className={styles.trackAnother} onClick={onTrackAnother}>
        <ChevronLeftIcon width="16" height="16" /> Track another order
      </button>

      <div className={ocStyles.card}>
        <div className={ocStyles.highlightRow}>
          <div className={ocStyles.highlightItem}>
            <span className={ocStyles.label}>Order Number</span>
            <span className={ocStyles.highlightValue}>{order.orderNumber || order.id}</span>
          </div>
          <div className={ocStyles.highlightItem}>
            <span className={ocStyles.label}>Total (USD)</span>
            <span className={ocStyles.highlightValue}>{formatPrice(order.total)}</span>
          </div>
          <div className={ocStyles.highlightItem}>
            <span className={ocStyles.label}>Total (SSP)</span>
            <span className={ocStyles.highlightValue}>
              ≈ {formatCurrency(order.total, "SSP", rate)}
            </span>
            <span className={ocStyles.rateNote}>1 USD = {rate.toLocaleString("en-US")} SSP</span>
          </div>
          <div className={ocStyles.highlightItem}>
            <span className={ocStyles.label}>Current Status</span>
            <span
              className={`${ocStyles.statusPill} ${
                isTerminalOutcome ? ocStyles.statusPillCancelled : ""
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className={ocStyles.detailsGrid}>
          <div className={ocStyles.row}>
            <span className={ocStyles.label}>Customer Name</span>
            <span className={ocStyles.value}>{order.customerName}</span>
          </div>
          <div className={ocStyles.row}>
            <span className={ocStyles.label}>Order Date</span>
            <span className={ocStyles.value}>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className={ocStyles.row}>
            <span className={ocStyles.label}>Payment Method</span>
            <span className={ocStyles.value}>{order.payment || "-"}</span>
          </div>
          <div className={ocStyles.row}>
            <span className={ocStyles.label}>Delivery Area</span>
            <span className={ocStyles.value}>{order.deliveryZone || "-"}</span>
          </div>
          <div className={ocStyles.row}>
            <span className={ocStyles.label}>Estimated Delivery</span>
            <span className={ocStyles.value}>{estimatedDelivery}</span>
          </div>
        </div>
      </div>

      <div className={ocStyles.card}>
        <h2 className={ocStyles.cardHeading}>Order Items</h2>
        <ul className={ocStyles.itemList}>
          {order.items.map((item) => (
            <li key={item.id} className={ocStyles.item}>
              <ProductImage
                src={item.imageUrl || item.images?.[0]}
                icon={getCategoryIcon(item.category)}
                background={item.color}
                alt={item.name}
                className={ocStyles.itemThumb}
                sizes="64px"
              />
              <div className={ocStyles.itemDetails}>
                <span className={ocStyles.itemName}>{item.name}</span>
                <span className={ocStyles.itemMeta}>
                  Qty: {item.qty} × <Price amount={item.price} />
                </span>
              </div>
              <Price amount={item.price * item.qty} className={ocStyles.itemSubtotal} />
            </li>
          ))}
        </ul>
      </div>

      <div className={ocStyles.card}>
        <h2 className={ocStyles.cardHeading}>Order Tracking</h2>
        {isTerminalOutcome ? (
          <p className={ocStyles.cancelledNote}>
            {isCancelled
              ? "This order was cancelled. Contact us by WhatsApp if you have questions."
              : "This order was returned. Contact us by WhatsApp if you have questions."}
          </p>
        ) : showTimeline ? (
          <div className={ocStyles.timeline}>
            {TRACKING_STEPS.map((step, i) => (
              <div key={step} className={ocStyles.timelineStep}>
                <div className={ocStyles.timelineStepHead}>
                  <span
                    className={`${ocStyles.timelineDot} ${
                      i < currentStep
                        ? ocStyles.timelineDotDone
                        : i === currentStep
                        ? ocStyles.timelineDotActive
                        : ""
                    }`}
                  >
                    {i < currentStep ? <CheckIcon width="12" height="12" /> : i + 1}
                  </span>
                  <span
                    className={`${ocStyles.timelineLabel} ${
                      i === currentStep ? ocStyles.timelineLabelActive : ""
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < TRACKING_STEPS.length - 1 && (
                  <span
                    className={`${ocStyles.timelineLine} ${
                      i < currentStep ? ocStyles.timelineLineDone : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={ocStyles.cancelledNote}>Status: {statusLabel}</p>
        )}
        {statusDescription && <p className={styles.statusDescription}>{statusDescription}</p>}
        {order.updatedAt && (
          <p className={styles.statusUpdated}>
            Status last updated: {new Date(order.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {hasLocation && (
        <div className={ocStyles.card}>
          <h2 className={ocStyles.cardHeading}>Delivery Location</h2>
          <div className={ocStyles.detailsGrid} style={{ marginBottom: "1rem" }}>
            <div className={ocStyles.row}>
              <span className={ocStyles.label}>Delivery Area</span>
              <span className={ocStyles.value}>{order.deliveryZone || "-"}</span>
            </div>
            <div className={ocStyles.row}>
              <span className={ocStyles.label}>Street / Landmark</span>
              <span className={ocStyles.value}>{order.address || "-"}</span>
            </div>
          </div>
          <DeliveryLocationPreview
            lat={order.deliveryLatitude}
            lng={order.deliveryLongitude}
            mapUrl={order.deliveryMapUrl}
            label={order.deliveryLocationLabel}
          />
        </div>
      )}

      <div className={ocStyles.actions}>
        <a
          className={ocStyles.whatsappBtn}
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Contact DIS on WhatsApp
        </a>
        <button type="button" className={ocStyles.invoiceBtn} onClick={() => downloadInvoice(order)}>
          <DownloadIcon width="16" height="16" /> Download Invoice
        </button>
        <Link href="/shop" className={ocStyles.shopBtn}>
          Continue Shopping
        </Link>
        {status === "Delivered" && (
          <a
            className={styles.rateBtn}
            href={feedbackLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StarIcon width="16" height="16" /> Rate Your Order
          </a>
        )}
      </div>
    </div>
  );
}
