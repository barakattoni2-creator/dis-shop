import { useState } from "react";
import Layout from "@/components/Layout";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import styles from "@/styles/Contact.module.css";

export default function ContactPage() {
  const { addressLines, email, phoneNumbers, whatsappNumber } = useCompanyInfo();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Layout
      title="Contact Us"
      description="Get in touch with Destiny Investment & Supplies (DIS) in Juba, South Sudan."
    >
      <div className={styles.main}>
        <h1 className={styles.heading}>Contact Us</h1>
        <div className={styles.layout}>
          <div className={styles.info}>
            <h2>Visit Our Store</h2>
            <address className={styles.address}>
              {addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>

            <h2>Email Us</h2>
            <a className={styles.contactLink} href={`mailto:${email}`}>
              ✉️ {email}
            </a>

            <h2>Call or Message Us</h2>
            {phoneNumbers.map((phone) => (
              <a
                key={phone.tel}
                className={styles.contactLink}
                href={`tel:${phone.tel}`}
              >
                📞 {phone.display}
              </a>
            ))}
            <a
              className={styles.whatsappLink}
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Chat on WhatsApp
            </a>
          </div>

          <div className={styles.formCard}>
            <h2>Send Us a Message</h2>
            {sent ? (
              <p className={styles.success}>
                Thanks, {form.name || "there"}! Your message has been noted —
                for a faster reply, reach us on WhatsApp or call one of the
                numbers above.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label}>
                  Name
                  <input
                    type="text"
                    className={styles.input}
                    value={form.name}
                    onChange={handleChange("name")}
                    required
                  />
                </label>
                <label className={styles.label}>
                  Email
                  <input
                    type="email"
                    className={styles.input}
                    value={form.email}
                    onChange={handleChange("email")}
                    required
                  />
                </label>
                <label className={styles.label}>
                  Message
                  <textarea
                    className={styles.textarea}
                    value={form.message}
                    onChange={handleChange("message")}
                    required
                  />
                </label>
                <button type="submit" className={styles.submitBtn}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
