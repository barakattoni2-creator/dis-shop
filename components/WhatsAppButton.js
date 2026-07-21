import { useRouter } from "next/router";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import styles from "@/styles/WhatsAppButton.module.css";

export default function WhatsAppButton() {
  const { whatsappNumber } = useCompanyInfo();
  const router = useRouter();
  // Product and cart pages have their own mobile sticky action/checkout bar
  // at the same screen edge, so the floating bubble would just overlap it.
  const hasMobileBottomBar =
    router.pathname === "/product/[id]" || router.pathname === "/cart";

  return (
    <a
      className={`${styles.button} ${hasMobileBottomBar ? styles.hiddenOnMobile : ""}`}
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with DIS Shop on WhatsApp"
    >
      <svg viewBox="0 0 32 32" className={styles.icon} aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.474L4 29l7.72-1.876A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.77 9.77 0 0 1-4.98-1.362l-.357-.212-4.583 1.114 1.128-4.463-.234-.366A9.78 9.78 0 0 1 5.2 15c0-5.96 4.845-10.818 10.804-10.818C21.964 4.182 26.8 9.04 26.8 15s-4.836 10.818-10.796 10.818Zm5.938-8.09c-.325-.163-1.923-.95-2.221-1.058-.298-.108-.514-.163-.73.163-.216.325-.838 1.057-1.028 1.274-.19.217-.379.244-.703.082-.325-.163-1.373-.506-2.616-1.612-.967-.862-1.62-1.927-1.81-2.252-.19-.325-.02-.5.143-.663.147-.146.325-.38.487-.57.163-.19.217-.325.325-.542.108-.217.054-.407-.027-.57-.082-.163-.73-1.76-1-2.41-.264-.634-.532-.548-.73-.559l-.622-.011c-.217 0-.57.081-.868.407-.298.325-1.136 1.11-1.136 2.706s1.163 3.137 1.325 3.353c.163.217 2.29 3.497 5.548 4.905.775.334 1.38.534 1.851.684.778.247 1.486.212 2.046.129.624-.093 1.923-.786 2.194-1.545.271-.76.271-1.41.19-1.546-.081-.135-.297-.216-.622-.38Z"
        />
      </svg>
      <span className={styles.label}>Chat with us</span>
    </a>
  );
}
