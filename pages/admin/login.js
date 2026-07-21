import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getAdminSession } from "@/lib/adminAuth";
import styles from "@/styles/AdminLogin.module.css";

export async function getServerSideProps({ req }) {
  const session = getAdminSession(req);
  if (session) {
    return { redirect: { destination: "/admin/dashboard", permanent: false } };
  }
  return { props: {} };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Sign In — DIS Shop</title>
      </Head>
      <div className={styles.wrap}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <span className={styles.logoBadge}>DIS</span>
          <h1 className={styles.heading}>Admin Sign In</h1>
          <p className={styles.subtext}>
            Staff access only. Sign in with your administrator account.
          </p>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </>
  );
}
