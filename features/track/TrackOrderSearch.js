import { useState } from "react";
import { SearchIcon } from "@/components/icons";
import styles from "@/styles/TrackOrder.module.css";

export default function TrackOrderSearch({
  onSearch,
  loading,
  defaultOrderNumber = "",
  defaultPhone = "",
}) {
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [phone, setPhone] = useState(defaultPhone);
  const [touched, setTouched] = useState(false);

  const errors = {
    orderNumber: orderNumber.trim() ? "" : "Enter your order number.",
    phone: phone.trim() ? "" : "Enter the phone number used at checkout.",
  };
  const hasErrors = Boolean(errors.orderNumber || errors.phone);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors || loading) return;
    onSearch({ orderNumber: orderNumber.trim(), phone: phone.trim() });
  }

  return (
    <form className={styles.searchCard} onSubmit={handleSubmit} noValidate>
      <div className={styles.searchIconWrap}>
        <SearchIcon width="22" height="22" />
      </div>
      <h1 className={styles.searchHeading}>Track Your Order</h1>
      <p className={styles.searchSubtext}>
        Enter your order number and the phone number used at checkout.
      </p>

      <label className={styles.field}>
        <span className={styles.label}>Order Number</span>
        <input
          className={styles.input}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="e.g. DIS-WEB-2026-0001"
          disabled={loading}
        />
        {touched && errors.orderNumber && (
          <span className={styles.fieldError}>{errors.orderNumber}</span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Phone Number</span>
        <input
          className={styles.input}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0923 600 599"
          disabled={loading}
        />
        {touched && errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
      </label>

      <button type="submit" className={styles.trackBtn} disabled={loading}>
        {loading && <span className={styles.btnSpinner} />}
        {loading ? "Searching…" : "Track Order"}
      </button>
    </form>
  );
}
