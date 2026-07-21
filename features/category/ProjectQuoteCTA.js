import Link from "next/link";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import { buildQuoteRequestLink } from "@/utils/whatsapp";
import styles from "@/styles/ProjectQuoteCTA.module.css";

// Shown on Prefab & Projects category pages — these are mostly services
// (site camps, installations, maintenance) rather than stocked, priced
// SKUs, so a product grid with "Add to Cart" doesn't fit. This gives
// visitors the actual next step: request a quotation, no invented pricing.
export default function ProjectQuoteCTA({ categoryName }) {
  const { whatsappNumber } = useCompanyInfo();

  return (
    <section className={styles.cta}>
      <div className={styles.text}>
        <h2 className={styles.heading}>Request a Quotation for {categoryName}</h2>
        <p className={styles.subtext}>
          This is a project-based service — pricing depends on scope, site and materials. Tell us
          what you need and our team will follow up with a real quote.
        </p>
      </div>
      <div className={styles.actions}>
        <a
          className={styles.whatsappBtn}
          href={buildQuoteRequestLink(categoryName, whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Request via WhatsApp
        </a>
        <Link href="/contact" className={styles.contactBtn}>
          Contact Our Team
        </Link>
      </div>
    </section>
  );
}
