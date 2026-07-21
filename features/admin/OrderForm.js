import { useState } from "react";
import { SOUTH_SUDAN_STATES } from "@/data/southSudanStates";
import { ORDER_STATUSES } from "@/data/orderStatuses";
import styles from "@/styles/Admin.module.css";

const STATUSES = ORDER_STATUSES;
const PAYMENTS = ["Cash on Delivery", "Bank Transfer", "Mobile Money"];

function emptyItem() {
  return { name: "", price: "", qty: 1 };
}

export default function OrderForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          customerName: initial.customerName || "",
          phone: initial.phone || "",
          state: initial.state || SOUTH_SUDAN_STATES[0],
          deliveryZone: initial.deliveryZone || "",
          address: initial.address || "",
          notes: initial.notes || "",
          payment: initial.payment || PAYMENTS[0],
          status: initial.status || STATUSES[0],
          items:
            initial.items?.length > 0
              ? initial.items.map((i) => ({ name: i.name, price: i.price, qty: i.qty }))
              : [emptyItem()],
        }
      : {
          customerName: "",
          phone: "",
          state: SOUTH_SUDAN_STATES[0],
          deliveryZone: "",
          address: "",
          notes: "",
          payment: PAYMENTS[0],
          status: STATUSES[0],
          items: [emptyItem()],
        }
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setItem = (index, field) => (e) => {
    const value = field === "name" ? e.target.value : Number(e.target.value);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (index) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const total = form.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      items: form.items
        .filter((item) => item.name.trim())
        .map((item) => ({ name: item.name, price: Number(item.price) || 0, qty: Number(item.qty) || 1 })),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {initial?.deliveryMapUrl && (
        <p className={styles.note}>
          Pinned delivery location: {initial.deliveryLocationLabel || "Custom pin"} (
          {initial.deliveryLatitude?.toFixed(5)}, {initial.deliveryLongitude?.toFixed(5)}) —{" "}
          <a href={initial.deliveryMapUrl} target="_blank" rel="noopener noreferrer">
            Open Delivery Location
          </a>
        </p>
      )}

      <label className={styles.label}>
        Customer Name
        <input
          className={styles.input}
          value={form.customerName}
          onChange={set("customerName")}
          required
        />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Phone
          <input className={styles.input} value={form.phone} onChange={set("phone")} />
        </label>
        <label className={styles.label}>
          State
          <select className={styles.input} value={form.state} onChange={set("state")}>
            {SOUTH_SUDAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>
          City / Delivery Area
          <input className={styles.input} value={form.deliveryZone} onChange={set("deliveryZone")} />
        </label>
        <label className={styles.label}>
          Address
          <input className={styles.input} value={form.address} onChange={set("address")} />
        </label>
      </div>

      <label className={styles.label}>
        Delivery Notes
        <textarea className={styles.textarea} value={form.notes} onChange={set("notes")} />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Payment Method
          <select className={styles.input} value={form.payment} onChange={set("payment")}>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        {initial && (
          <label className={styles.label}>
            Status
            <select className={styles.input} value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className={styles.label} style={{ marginBottom: 0 }}>Items</p>
      {form.items.map((item, i) => (
        <div key={i} className={styles.formRow} style={{ gridTemplateColumns: "2fr 1fr 1fr auto" }}>
          <input
            className={styles.input}
            placeholder="Item name"
            value={item.name}
            onChange={setItem(i, "name")}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            placeholder="Price"
            value={item.price}
            onChange={setItem(i, "price")}
          />
          <input
            type="number"
            min="1"
            className={styles.input}
            placeholder="Qty"
            value={item.qty}
            onChange={setItem(i, "qty")}
          />
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => removeItem(i)}
            disabled={form.items.length === 1}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.cancelBtn} onClick={addItem}>
        + Add Item
      </button>

      <p className={styles.uploadStatus}>Total: ${total.toFixed(2)}</p>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn}>
          {initial ? "Save Changes" : "Create Order"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
