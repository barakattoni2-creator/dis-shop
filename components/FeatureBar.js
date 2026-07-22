import { TruckIcon, LockIcon, ShieldIcon, SupportIcon } from "@/components/icons";
import styles from "@/styles/FeatureBar.module.css";

const FEATURES = [
  { icon: TruckIcon, title: "Fast Delivery", subtitle: "Across Juba, on time" },
  { icon: LockIcon, title: "Secure Payment", subtitle: "Safe & trusted checkout" },
  { icon: ShieldIcon, title: "Warranty", subtitle: "On genuine products" },
  { icon: SupportIcon, title: "24/7 Support", subtitle: "WhatsApp & phone" },
];

// Thin trust-badge strip, distinct from the fuller WhyChooseUs section
// further down the page — this sits directly under the hero for immediate
// above-the-fold reassurance, not as its own content section.
export default function FeatureBar() {
  return (
    <section className={styles.bar} aria-label="Why shop with DIS Shop">
      <div className={styles.inner}>
        {FEATURES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className={styles.item}>
            <span className={styles.iconWrap}>
              <Icon width="20" height="20" />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{title}</span>
              <span className={styles.subtitle}>{subtitle}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
