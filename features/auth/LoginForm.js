import Link from "next/link";
import { useState } from "react";
import styles from "@/styles/Login.module.css";

export default function LoginForm({ onSubmit, submitting, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
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
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <p className={styles.subtext}>
        New to DIS Shop? <Link href="/register">Create an account</Link>
      </p>
    </>
  );
}
