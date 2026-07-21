import { PinIcon, BoltIcon, ChatIcon } from "@/components/icons";
import { DELIVERY_ZONES } from "@/data/delivery";
import styles from "@/styles/DeliveryInfo.module.css";

const HIGHLIGHTS = [
  {
    Icon: PinIcon,
    tone: "blue",
    title: "Juba-Wide Coverage",
    text: "We deliver across every part of Juba.",
  },
  {
    Icon: BoltIcon,
    tone: "orange",
    title: "Fast Dispatch",
    text: "Orders packed and sent out fast.",
  },
  {
    Icon: ChatIcon,
    tone: "blue",
    title: "Fee Confirmed by WhatsApp",
    text: "Your delivery fee is confirmed before dispatch.",
  },
];

// Honest, non-committal delivery facts — no specific hour/day promises are
// made anywhere else in the app, so none are invented here either.
const DETAILS = [
  { label: "Estimated Delivery", value: "Same-day dispatch" },
  { label: "Delivery Fee", value: "Confirmed by WhatsApp" },
  { label: "Order Confirmation", value: "WhatsApp or phone call" },
];

export default function DeliveryInfo() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Delivery Information</h2>

        <div className={styles.highlightGrid}>
          {HIGHLIGHTS.map(({ Icon, tone, title, text }) => (
            <div key={title} className={styles.highlightCard}>
              <span className={`${styles.highlightIcon} ${styles[tone]}`}>
                <Icon width="26" height="26" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className={styles.zonePanel}>
          <div className={styles.zoneBlock}>
            <span className={styles.zoneLabel}>Delivery Zones</span>
            <div className={styles.zoneRow}>
              {DELIVERY_ZONES.map((zone) => (
                <span key={zone} className={styles.zoneChip}>
                  {zone.split("(")[0].trim()}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.detailRow}>
            {DETAILS.map((detail) => (
              <div key={detail.label} className={styles.detailItem}>
                <span className={styles.detailLabel}>{detail.label}</span>
                <span className={styles.detailValue}>{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
