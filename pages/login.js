import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import { loginCustomer } from "@/services/odoo/auth";
import LoginForm from "@/features/auth/LoginForm";
import styles from "@/styles/Login.module.css";

export default function LoginPage() {
  const { user, login, logout } = useStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({ email, password }) => {
    setError("");
    setSubmitting(true);
    try {
      const account = await loginCustomer({ email, password });
      login(account);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Sign In" description="Sign in to your DIS Shop account.">
      <div className={styles.main}>
        <div className={styles.card}>
          {user ? (
            <>
              <h1 className={styles.heading}>Welcome back, {user.name}!</h1>
              <p className={styles.subtext}>You are currently signed in.</p>
              <div className={styles.form}>
                <Link href="/dashboard" className={styles.submitBtn}>
                  Go to Your Dashboard
                </Link>
                <button className={styles.logoutBtn} onClick={logout}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className={styles.heading}>Sign In</h1>
              <p className={styles.subtext}>
                Sign in for the best DIS Shop experience.
              </p>
              <LoginForm
                onSubmit={handleSubmit}
                submitting={submitting}
                error={error}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
