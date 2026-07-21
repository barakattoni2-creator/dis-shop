import Link from "next/link";
import styles from "@/styles/SpecialOffers.module.css";

const OFFERS = [
  {
    icon: "☀️",
    title: "Solar Season Sale",
    subtitle: "Power your home and save on panels, inverters & batteries",
    href: "/category/solar",
    bg: "linear-gradient(135deg, #ff6a00, #cc5500)",
  },
  {
    icon: "❄️",
    title: "Beat the Heat Deals",
    subtitle: "Split & portable air conditioners at their best prices",
    href: "/category/air-conditioners",
    bg: "linear-gradient(135deg, #081a3a, #0a4dff)",
  },
  {
    icon: "🔧",
    title: "Tools Clearance",
    subtitle: "Top brands, everyday low prices on power tools",
    href: "/category/tools",
    bg: "linear-gradient(135deg, #0a4dff, #081a3a)",
  },
];

export default function SpecialOffers() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Special Offers</h2>
      <div className={styles.grid}>
        {OFFERS.map((offer) => (
          <Link
            key={offer.title}
            href={offer.href}
            className={styles.card}
            style={{ background: offer.bg }}
          >
            <span className={styles.icon}>{offer.icon}</span>
            <h3 className={styles.cardTitle}>{offer.title}</h3>
            <p className={styles.cardSubtitle}>{offer.subtitle}</p>
            <span className={styles.cardCta}>Shop Now →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
