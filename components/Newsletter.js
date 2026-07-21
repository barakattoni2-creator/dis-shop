import { useState } from "react";
import styles from "@/styles/Newsletter.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Stay in the Loop</h2>
        <p className={styles.subtext}>
          Get new arrivals, special offers and restock alerts.
        </p>
        {status === "success" ? (
          <p className={styles.success}>
            🎉 Thanks for subscribing — we&apos;ll keep you updated!
          </p>
        ) : (
          <>
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={handleChange}
                required
              />
              <button type="submit" className={styles.submitBtn}>
                Subscribe
              </button>
            </form>
            {status === "error" && (
              <p className={styles.error}>Please enter a valid email address.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
