import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DeliveryLocationSwitcher from "@/components/DeliveryLocationSwitcher";
import styles from "@/styles/TopBar.module.css";

const MESSAGES = [
  "✨ Genuine products from Gree, Sonifer, EMTOP & more",
  "🚚 Fast delivery across Juba",
  "💬 Order easily by WhatsApp or online",
];

export default function TopBar() {
  const { phoneNumbers } = useCompanyInfo();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span key={index} className={styles.message}>
            {MESSAGES[index]}
          </span>
          <a className={styles.item} href={`tel:${phoneNumbers[0]?.tel}`}>
            📞 {phoneNumbers[0]?.display}
          </a>
        </div>

        <div className={styles.right}>
          <Link href="/track-order" className={styles.item}>
            Track Order
          </Link>
          <Link href="/contact" className={styles.item}>
            Help &amp; Support
          </Link>
          <DeliveryLocationSwitcher />
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </div>
    </div>
  );
}
