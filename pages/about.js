import Layout from "@/components/Layout";
import WhyChooseUs from "@/components/WhyChooseUs";
import {
  ADDRESS_LINES,
  COMPANY_LEGAL_NAME,
  EMAIL,
  PHONE_NUMBERS,
  WHATSAPP_NUMBER,
} from "@/data/contact";
import styles from "@/styles/About.module.css";

const STATS = [
  { value: "10,000+", label: "Products" },
  { value: "5,000+", label: "Customers" },
  { value: "100+", label: "Brands" },
  { value: "24/7", label: "Customer Support" },
];

export default function AboutPage() {
  return (
    <Layout
      title="About Us"
      description="Destiny Investment & Supplies (DIS) is a trusted supplier in South Sudan providing household products, electrical equipment, solar energy solutions, air conditioners, lighting, power tools and general supplies."
    >
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🇸🇸 Proudly South Sudanese</span>
          <h1 className={styles.title}>About {COMPANY_LEGAL_NAME}</h1>
          <p className={styles.subtitle}>
            Your trusted supplier for household products, electrical
            equipment, solar energy solutions, air conditioners, lighting,
            power tools and general supplies in South Sudan.
          </p>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.storyGrid}>
          <div className={styles.storyLabelCol}>
            <span className={styles.eyebrow}>Our Story</span>
            <div className={styles.accentBar} />
          </div>
          <p className={styles.storyText}>
            Destiny Investment &amp; Supplies (DIS) is a trusted supplier
            based in Juba, South Sudan. We provide high-quality products for
            homes, businesses, contractors and institutions. Our goal is to
            deliver reliable products with competitive prices and excellent
            customer service.
          </p>
        </div>
      </section>

      <section className={styles.mvSection}>
        <div className={styles.mvGrid}>
          <div className={`${styles.mvCard} ${styles.mvCardBlue}`}>
            <span className={styles.mvIcon}>🎯</span>
            <h2>Our Mission</h2>
            <p>
              To provide quality products, affordable prices and outstanding
              customer satisfaction.
            </p>
          </div>
          <div className={`${styles.mvCard} ${styles.mvCardOrange}`}>
            <span className={styles.mvIcon}>🚀</span>
            <h2>Our Vision</h2>
            <p>
              To become the leading supplier and e-commerce company in South
              Sudan.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <WhyChooseUs />

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Contact Information</h2>
        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <span className={styles.contactIcon}>📍</span>
            <h3>Location</h3>
            <address className={styles.address}>
              {ADDRESS_LINES.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactIcon}>✉️</span>
            <h3>Email</h3>
            <a className={styles.contactLine} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactIcon}>📞</span>
            <h3>Phone</h3>
            {PHONE_NUMBERS.map((phone) => (
              <a
                key={phone.tel}
                className={styles.contactLine}
                href={`tel:${phone.tel}`}
              >
                {phone.display}
              </a>
            ))}
          </div>
        </div>
        <a
          className={styles.whatsappCta}
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Chat on WhatsApp
        </a>
      </section>
    </Layout>
  );
}
