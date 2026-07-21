import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import { registerCustomer } from "@/services/odoo/auth";
import RegisterForm from "@/features/auth/RegisterForm";
import styles from "@/styles/Login.module.css";

export default function RegisterPage() {
  const { login } = useStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async ({ name, email, password }) => {
    setError("");
    setSubmitting(true);
    try {
      const account = await registerCustomer({ name, email, password });
      login(account);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Create Account"
      description="Register for a DIS Shop account."
    >
      <div className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.heading}>Create Account</h1>
          <p className={styles.subtext}>
            Register to track orders and check out faster.
          </p>
          <RegisterForm
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        </div>
      </div>
    </Layout>
  );
}
