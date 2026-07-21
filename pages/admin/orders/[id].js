import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/features/admin/AdminLayout";
import DeliveryLocationPreview from "@/features/track/DeliveryLocationPreview";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { formatPrice, formatCurrency } from "@/utils/format";
import { buildWhatsAppLink, buildTelLink } from "@/utils/phone";
import { ORDER_STATUSES, PAYMENT_STATUSES, STATUS_BADGE_VARIANT, displayStatus } from "@/data/orderStatuses";
import styles from "@/styles/AdminOrders.module.css";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const BADGE_CLASS = {
  blue: styles.badgeBlue,
  navy: styles.badgeNavy,
  amber: styles.badgeAmber,
  purple: styles.badgePurple,
  orange: styles.badgeOrange,
  green: styles.badgeGreen,
  red: styles.badgeRed,
  gray: styles.badgeGray,
};

// order.address is built at checkout as [street, "Building/House: X",
// "Landmark: Y"].filter(Boolean).join("\n") (see CheckoutForm.js) — street
// is always first when present, since it's a required field.
function parseAddress(address) {
  const lines = String(address || "").split("\n").filter(Boolean);
  const landmarkLine = lines.find((l) => l.startsWith("Landmark: "));
  const buildingLine = lines.find((l) => l.startsWith("Building/House: "));
  return {
    street: lines[0] && !lines[0].startsWith("Landmark: ") && !lines[0].startsWith("Building/House: ") ? lines[0] : "",
    landmark: landmarkLine ? landmarkLine.replace("Landmark: ", "") : "",
    buildingHouse: buildingLine ? buildingLine.replace("Building/House: ", "") : "",
  };
}

function openPrintWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=760,height=920");
  if (!win) return;
  win.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title><style>
      body { font-family: Arial, sans-serif; padding: 28px; color: #16233f; }
      h1 { font-size: 20px; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
      .meta { font-size: 13px; margin: 2px 0; }
      .total { font-weight: bold; font-size: 15px; margin-top: 12px; }
    </style></head><body>${bodyHtml}</body></html>`
  );
  win.document.close();
  win.focus();
  win.print();
}

export default function AdminOrderDetailPage({ email, role, dbConfigured }) {
  const router = useRouter();
  const { id } = router.query;
  const { rate } = useExchangeRate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [feeDraft, setFeeDraft] = useState("");
  const [savingFee, setSavingFee] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const load = () => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setStatusDraft(data.order.status);
          setFeeDraft(data.order.deliveryFee != null ? String(data.order.deliveryFee) : "");
        } else {
          setError(data.error || "Order not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load order.");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!id || !dbConfigured) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dbConfigured]);

  // Always re-fetches the full detail after a write so orderNumber/activities
  // (only computed by fetchOrderDetail, not by the plain updateOrder patch
  // response) stay correct instead of going stale in local state.
  const patch = async (data) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) load();
    return res.ok;
  };

  const logActivity = (type, message) => {
    fetch(`/api/admin/orders/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message }),
    }).catch(() => {});
  };

  if (!dbConfigured) {
    return (
      <AdminLayout title="Order Details" email={email} role={role}>
        <p className={styles.note}>No database connected yet.</p>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Order Details" email={email} role={role}>
        <p className={styles.empty}>Loading…</p>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout title="Order Details" email={email} role={role}>
        <p className={styles.error}>{error || "Order not found."}</p>
        <Link href="/admin/orders" className={styles.backLink}>
          ← Back to Orders
        </Link>
      </AdminLayout>
    );
  }

  const { street, landmark, buildingHouse } = parseAddress(order.address);
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const hasLocation = order.deliveryLatitude != null && order.deliveryLongitude != null;

  const statusMessage = (status) =>
    `Hi ${order.customerName}, your DIS Shop order ${order.orderNumber} is now "${displayStatus(status)}".`;
  const whatsappMsgLink = buildWhatsAppLink(order.phone, statusMessage(order.status));
  const telLink = buildTelLink(order.phone);

  const handleQuickStatus = async (status) => {
    setSavingStatus(true);
    const ok = await patch({ status });
    setSavingStatus(false);
    if (ok) {
      setStatusDraft(status);
      if (notifyWhatsapp) {
        const link = buildWhatsAppLink(order.phone, statusMessage(status));
        if (link) {
          window.open(link, "_blank", "noopener,noreferrer");
          logActivity("whatsapp_sent", `Status-update WhatsApp message opened for "${status}".`);
        }
      }
    }
  };

  const handleUpdateStatus = () => {
    if (statusDraft === order.status) return;
    handleQuickStatus(statusDraft);
  };

  const handleCancelOrder = () => {
    if (!window.confirm("Cancel this order? The customer will see it as Cancelled.")) return;
    handleQuickStatus("Cancelled");
  };

  const handlePaymentStatusChange = (paymentStatus) => patch({ paymentStatus });

  const handleSaveFee = async () => {
    setSavingFee(true);
    await patch({ deliveryFee: feeDraft.trim() === "" ? null : Number(feeDraft) });
    setSavingFee(false);
  };

  const handlePrintInvoice = () => {
    const html = `
      <h1>DIS Shop — Invoice</h1>
      <p class="meta">Order Number: ${order.orderNumber}</p>
      <p class="meta">Date: ${new Date(order.createdAt).toLocaleString()}</p>
      <p class="meta">Customer: ${order.customerName} — ${order.phone || "-"}</p>
      <p class="meta">Delivery Area: ${order.deliveryZone || "-"}</p>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
        <tbody>${order.items
          .map(
            (i) =>
              `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatPrice(i.price)}</td><td>${formatPrice(
                i.price * i.qty
              )}</td></tr>`
          )
          .join("")}</tbody>
      </table>
      <p class="total">Total: ${formatPrice(order.total)}</p>
    `;
    openPrintWindow(`Invoice ${order.orderNumber}`, html);
    logActivity("invoice_generated", "Invoice printed.");
  };

  const handleDownloadInvoice = () => {
    const lines = [
      "DIS Shop — Order Invoice",
      `Order Number: ${order.orderNumber}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      "",
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone || "-"}`,
      order.email ? `Email: ${order.email}` : null,
      `Delivery Area: ${order.deliveryZone || "-"}`,
      order.address ? `Delivery Address: ${order.address.replace(/\n/g, ", ")}` : null,
      order.deliveryMapUrl ? `Pinned Location: ${order.deliveryMapUrl}` : null,
      `Payment Method: ${order.payment || "-"}`,
      `Payment Status: ${order.paymentStatus}`,
      "",
      "Items:",
      ...order.items.map(
        (i) => `  ${i.name}${i.sku ? ` (${i.sku})` : ""} x${i.qty} — ${formatPrice(i.price * i.qty)}`
      ),
      "",
      order.discount ? `Discount: -${formatPrice(order.discount)}` : null,
      order.deliveryFee != null ? `Delivery Fee: ${formatPrice(order.deliveryFee)}` : null,
      `Total: ${formatPrice(order.total)}`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.orderNumber}-invoice.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    logActivity("invoice_generated", "Invoice downloaded.");
  };

  const handlePrintDeliveryNote = () => {
    const html = `
      <h1>DIS Shop — Delivery Note</h1>
      <p class="meta">Order Number: ${order.orderNumber}</p>
      <p class="meta">Customer: ${order.customerName} — ${order.phone || "-"}</p>
      <p class="meta">Delivery Area: ${order.deliveryZone || "-"}</p>
      <p class="meta">Street: ${street || "-"}</p>
      ${buildingHouse ? `<p class="meta">Building/House: ${buildingHouse}</p>` : ""}
      ${landmark ? `<p class="meta">Landmark: ${landmark}</p>` : ""}
      ${order.deliveryMapUrl ? `<p class="meta">Map: ${order.deliveryMapUrl}</p>` : ""}
      <table>
        <thead><tr><th>Item</th><th>Qty</th></tr></thead>
        <tbody>${order.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td></tr>`).join("")}</tbody>
      </table>
    `;
    openPrintWindow(`Delivery Note ${order.orderNumber}`, html);
    logActivity("note", "Delivery note printed.");
  };

  const handleCopyMapLink = async () => {
    if (!order.deliveryMapUrl) return;
    try {
      await navigator.clipboard.writeText(order.deliveryMapUrl);
      setActionMessage("Google Maps link copied.");
    } catch {
      setActionMessage("Couldn't copy automatically — copy the link above manually.");
    }
  };

  return (
    <AdminLayout title={`Order ${order.orderNumber}`} email={email} role={role}>
      <div className={styles.main}>
        <Link href="/admin/orders" className={`${styles.backLink} ${styles.noPrint}`}>
          ← Back to Orders
        </Link>

        <div className={styles.headerRow}>
          <h2 className={adminStyles.heading}>{order.orderNumber}</h2>
          <span className={`${styles.badge} ${BADGE_CLASS[STATUS_BADGE_VARIANT[order.status] || "gray"]}`}>
            {displayStatus(order.status)}
          </span>
        </div>

        {actionMessage && (
          <p className={`${styles.note} ${styles.noPrint}`}>{actionMessage}</p>
        )}

        <div className={styles.detailGrid}>
          <div>
            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Customer</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>{order.customerName}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{order.phone || "-"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <span className={styles.infoValue}>{order.phone || "-"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{order.email || "-"}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Delivery</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Area</span>
                  <span className={styles.infoValue}>{order.deliveryZone || "-"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Street</span>
                  <span className={styles.infoValue}>{street || "-"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Landmark</span>
                  <span className={styles.infoValue}>{landmark || "-"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Building / House</span>
                  <span className={styles.infoValue}>{buildingHouse || "-"}</span>
                </div>
                <div className={`${styles.infoItem} ${styles.infoItemFull}`}>
                  <span className={styles.infoLabel}>Directions / Delivery Notes</span>
                  <span className={styles.infoValue}>{order.notes || "-"}</span>
                </div>
                {hasLocation && (
                  <>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Latitude</span>
                      <span className={styles.infoValue}>{order.deliveryLatitude.toFixed(6)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Longitude</span>
                      <span className={styles.infoValue}>{order.deliveryLongitude.toFixed(6)}</span>
                    </div>
                  </>
                )}
              </div>

              {hasLocation && (
                <>
                  <DeliveryLocationPreview
                    lat={order.deliveryLatitude}
                    lng={order.deliveryLongitude}
                    mapUrl={order.deliveryMapUrl}
                    label={order.deliveryLocationLabel}
                  />
                  <div className={`${styles.mapActions} ${styles.noPrint}`}>
                    <button type="button" className={styles.actionBtn} onClick={handleCopyMapLink}>
                      Copy Google Maps Link
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Order Items</h3>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={44}
                            height={44}
                            className={styles.itemThumb}
                          />
                        ) : (
                          <span className={styles.itemThumbEmpty}>📦</span>
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.sku || "-"}</td>
                      <td>{item.qty}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{formatPrice(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Financial</h3>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Subtotal</span>
                <span className={styles.financialValue}>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Discount</span>
                <span className={styles.financialValue}>
                  {order.discount ? `-${formatPrice(order.discount)}` : "—"}
                </span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Delivery Fee</span>
                <span className={`${styles.editableField} ${styles.noPrint}`}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.smallInput}
                    value={feeDraft}
                    onChange={(e) => setFeeDraft(e.target.value)}
                    placeholder="Not set"
                  />
                  <button type="button" className={styles.smallSaveBtn} onClick={handleSaveFee} disabled={savingFee}>
                    {savingFee ? "…" : "Save"}
                  </button>
                </span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Total (USD)</span>
                <span className={`${styles.financialValue} ${styles.financialTotal}`}>
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Total (SSP)</span>
                <span className={styles.financialValue}>{formatCurrency(order.total, "SSP", rate)}</span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Exchange Rate</span>
                <span className={styles.financialValue}>1 USD = {rate.toLocaleString("en-US")} SSP</span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Payment Method</span>
                <span className={styles.financialValue}>{order.payment || "-"}</span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Payment Status</span>
                <select
                  className={`${styles.statusSelect} ${styles.noPrint}`}
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className={`${styles.card} ${styles.noPrint}`}>
              <h3 className={styles.cardHeading}>Order Status</h3>
              <div className={styles.editableField} style={{ marginBottom: "0.8rem", width: "100%" }}>
                <select
                  className={styles.select}
                  style={{ width: "100%" }}
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                >
                  {!ORDER_STATUSES.includes(order.status) && (
                    <option value={order.status}>{displayStatus(order.status)}</option>
                  )}
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <label
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.7rem" }}
                className={styles.financialLabel}
              >
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                />
                Notify customer via WhatsApp
              </label>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={handleUpdateStatus}
                disabled={savingStatus || statusDraft === order.status}
                style={{ width: "100%" }}
              >
                {savingStatus ? "Saving…" : "Update Status"}
              </button>
            </div>

            <div className={`${styles.card} ${styles.noPrint}`}>
              <h3 className={styles.cardHeading}>Admin Actions</h3>
              <div className={styles.actionsGrid}>
                <button type="button" className={styles.actionBtn} onClick={() => handleQuickStatus("Confirmed")}>
                  Confirm Order
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handlePaymentStatusChange("Paid")}
                >
                  Mark as Paid
                </button>
                <button type="button" className={styles.actionBtn} onClick={handlePrintInvoice}>
                  Print Invoice
                </button>
                <button type="button" className={styles.actionBtn} onClick={handleDownloadInvoice}>
                  Download Invoice
                </button>
                <button type="button" className={styles.actionBtn} onClick={handlePrintDeliveryNote}>
                  Print Delivery Note
                </button>
                {whatsappMsgLink && (
                  <a
                    className={`${styles.actionBtn} ${styles.actionBtnGreen}`}
                    href={whatsappMsgLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => logActivity("whatsapp_sent", "WhatsApp message opened from order detail.")}
                  >
                    Send WhatsApp Message
                  </a>
                )}
                {telLink && (
                  <a className={styles.actionBtn} href={telLink}>
                    Call Customer
                  </a>
                )}
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardHeading}>Order History</h3>
              {order.activities.length === 0 ? (
                <p className={styles.empty}>No activity yet.</p>
              ) : (
                <ul className={styles.timelineList}>
                  {order.activities.map((a) => (
                    <li key={a.id} className={styles.timelineItem}>
                      <span className={styles.timelineDot} />
                      <div className={styles.timelineBody}>
                        <p className={styles.timelineMessage}>{a.message}</p>
                        <p className={styles.timelineMeta}>
                          {new Date(a.createdAt).toLocaleString()}
                          {a.actor ? ` — ${a.actor}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
