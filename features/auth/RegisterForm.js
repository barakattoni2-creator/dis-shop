import Link from "next/link";
import { useState } from "react";
import styles from "@/styles/Login.module.css";

export default function RegisterForm({ onSubmit, submitting, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, password });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Full Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </label>
        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength={6}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <p className={styles.subtext}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
