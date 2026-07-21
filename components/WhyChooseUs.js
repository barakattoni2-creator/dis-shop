import { CheckIcon } from "@/components/icons";
import styles from "@/styles/WhyChooseUs.module.css";

const REASONS = [
  "High Quality Products",
  "Competitive Prices",
  "Fast Delivery",
  "Professional Support",
  "Trusted Supplier",
  "Secure Shopping",
];

export default function WhyChooseUs({ heading = "Why Choose Us" }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>{heading}</h2>
      <div className={styles.grid}>
        {REASONS.map((item) => (
          <div key={item} className={styles.card}>
            <span className={styles.checkIcon}>
              <CheckIcon />
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
