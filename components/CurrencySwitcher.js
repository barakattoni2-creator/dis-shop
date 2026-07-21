import { useStore } from "@/context/StoreContext";
import { CURRENCIES } from "@/data/currency";
import styles from "@/styles/CurrencySwitcher.module.css";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useStore();

  return (
    <div className={styles.switcher}>
      {CURRENCIES.map((c) => (
        <button
          key={c}
          className={`${styles.option} ${currency === c ? styles.active : ""}`}
          onClick={() => setCurrency(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
