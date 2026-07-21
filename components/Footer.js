import Link from "next/link";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import styles from "@/styles/Footer.module.css";

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.14C15.87 4.06 15 4 13.97 4c-2.24 0-3.77 1.37-3.77 3.88v2.16H7.6v3h2.6V21h3.3Z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

// Same path as the floating WhatsApp button, for brand consistency.
function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.702 4.61 1.912 6.474L4 29l7.72-1.876A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.77 9.77 0 0 1-4.98-1.362l-.357-.212-4.583 1.114 1.128-4.463-.234-.366A9.78 9.78 0 0 1 5.2 15c0-5.96 4.845-10.818 10.804-10.818C21.964 4.182 26.8 9.04 26.8 15s-4.836 10.818-10.796 10.818Zm5.938-8.09c-.325-.163-1.923-.95-2.221-1.058-.298-.108-.514-.163-.73.163-.216.325-.838 1.057-1.028 1.274-.19.217-.379.244-.703.082-.325-.163-1.373-.506-2.616-1.612-.967-.862-1.62-1.927-1.81-2.252-.19-.325-.02-.5.143-.663.147-.146.325-.38.487-.57.163-.19.217-.325.325-.542.108-.217.054-.407-.027-.57-.082-.163-.73-1.76-1-2.41-.264-.634-.532-.548-.73-.559l-.622-.011c-.217 0-.57.081-.868.407-.298.325-1.136 1.11-1.136 2.706s1.163 3.137 1.325 3.353c.163.217 2.29 3.497 5.548 4.905.775.334 1.38.534 1.851.684.778.247 1.486.212 2.046.129.624-.093 1.923-.786 2.194-1.545.271-.76.271-1.41.19-1.546-.081-.135-.297-.216-.622-.38Z" />
    </svg>
  );
}

// Reflects what checkout actually accepts (see CheckoutForm) — no card
// logos, since DIS Shop doesn't process card payments.
const PAYMENT_METHODS = [
  { label: "Cash on Delivery", icon: "💵" },
  { label: "Bank Transfer", icon: "🏦" },
  { label: "Mobile Money", icon: "📱" },
];

export default function Footer() {
  const { addressLines, email, phoneDisplay, phoneTel, whatsappNumber, whatsappDisplay } =
    useCompanyInfo();

  // Facebook and Instagram profile URLs aren't set up yet — real
  // placeholders until they exist, same as before. WhatsApp is real: it
  // uses the same live number as the floating button and the Visit Us link.
  const socialLinks = [
    { label: "Facebook", Icon: FacebookIcon, href: "#" },
    { label: "Instagram", Icon: InstagramIcon, href: "#" },
    { label: "WhatsApp", Icon: WhatsAppIcon, href: `https://wa.me/${whatsappNumber}` },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoBadge}>DIS</span>
            <span className={styles.logoText}>Shop</span>
          </Link>
          <p className={styles.about}>
            Quality products and complete solutions for homes, businesses and
            projects in Juba.
          </p>
          <h3>About DIS</h3>
          <Link href="/about">About DIS Shop</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/categories">All Categories</Link>
        </div>
        <div className={styles.column}>
          <h3>Quick Links</h3>
          <Link href="/shop">Shop</Link>
          <Link href="/category/household">Household</Link>
          <Link href="/category/prefab-projects">Prefab &amp; Projects</Link>
          <Link href="/brands">Brands</Link>
          <Link href="/#flash-deals">Deals</Link>
        </div>
        <div className={styles.column}>
          <h3>Customer Service</h3>
          <Link href="/track-order">Track Order</Link>
          <Link href="/login">Your Account</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/contact">Help &amp; Support</Link>
        </div>
        <div className={styles.column}>
          <h3>Visit Us</h3>
          <address className={styles.address}>
            {addressLines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </address>
          <a href={`tel:${phoneTel}`}>{phoneDisplay}</a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappLink}
          >
            WhatsApp: {whatsappDisplay}
          </a>
          <a href={`mailto:${email}`}>{email}</a>
        </div>
      </div>

      <div className={styles.paymentRow}>
        <span className={styles.paymentLabel}>We Accept</span>
        <div className={styles.paymentPills}>
          {PAYMENT_METHODS.map((method) => (
            <span key={method.label} className={styles.paymentPill}>
              <span aria-hidden="true">{method.icon}</span> {method.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.socialRow}>
          {socialLinks.map(({ label, Icon, href }) => (
            <a
              key={label}
              href={href}
              className={styles.socialIcon}
              aria-label={label}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              <Icon />
            </a>
          ))}
        </div>
        <p>&copy; {new Date().getFullYear()} DIS Shop. All rights reserved.</p>
        <Link href="/admin" className={styles.adminLink}>
          Staff Login
        </Link>
      </div>
    </footer>
  );
}
