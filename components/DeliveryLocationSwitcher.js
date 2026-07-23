import { useEffect, useRef, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { DELIVERY_ZONES } from "@/data/delivery";
import styles from "@/styles/LanguageSwitcher.module.css";

// Real zone names only — "Custom Zone (specify below)" is the checkout
// form's own catch-all for anything outside the known list, and doesn't
// make sense as a top-bar preference. Matches the same ZONE_NAMES
// derivation features/checkout/CheckoutForm.js already uses.
const ZONE_NAMES = DELIVERY_ZONES.map((z) => z.split("(")[0].trim()).filter(
  (z) => z !== "Custom Zone"
);

// Purely a remembered preference (localStorage via StoreContext, same as
// currency) that pre-fills the zone field at checkout — it never changes
// pricing or is sent anywhere on its own; delivery fees are still always
// confirmed manually over WhatsApp, same as everywhere else in the app.
export default function DeliveryLocationSwitcher() {
  const { deliveryZone, setDeliveryZone } = useStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        📍 {deliveryZone || "Delivering to Juba"}
      </button>
      {open && (
        <div className={styles.menu}>
          {ZONE_NAMES.map((zone) => (
            <button
              key={zone}
              className={styles.option}
              onClick={() => {
                setDeliveryZone(zone);
                setOpen(false);
              }}
            >
              {zone}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
