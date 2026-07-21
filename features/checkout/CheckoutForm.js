import { useRef, useState } from "react";
import { DELIVERY_ZONES } from "@/data/delivery";
import { SOUTH_SUDAN_STATES } from "@/data/southSudanStates";
import { buildCartOrderLink } from "@/utils/whatsapp";
import { useCompanyInfo } from "@/components/CompanyInfoProvider";
import { CheckIcon } from "@/components/icons";
import DeliveryMap from "@/features/checkout/DeliveryMap";
import styles from "@/styles/Checkout.module.css";

// The button, Terms checkbox and Place Order live in OrderSummaryPanel now
// (see that file) but must still submit *this* form — the HTML `form`
// attribute lets an element outside the <form> tree trigger it natively.
export const CHECKOUT_FORM_ID = "checkout-form";

// Real zone names only — "Custom Zone" is the site's existing catch-all for
// an unlisted area (see data/delivery.js), reused here as the trigger for
// the free-text field rather than inventing a separate "Other" option.
const ZONE_NAMES = DELIVERY_ZONES.map((z) => z.split("(")[0].trim());
const CUSTOM_ZONE = "Custom Zone";

function CashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true" {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M5.5 9v6M18.5 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BankIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 9 12 3.5 21.5 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M4 9v10M9 9v10M15 9v10M20 9v10M2.5 19.5h19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MobileMoneyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true" {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M6 5.5h12M6 18h12" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" />
    </svg>
  );
}

const PAYMENT_METHODS = [
  {
    value: "Cash on Delivery",
    Icon: CashIcon,
    description: "Pay in cash when your order arrives.",
    recommended: true,
  },
  {
    value: "Bank Transfer",
    Icon: BankIcon,
    description: "Transfer to our bank account before dispatch.",
    instructions:
      "Our team will send you our bank account details by WhatsApp right after you place this order.",
  },
  {
    value: "Mobile Money",
    Icon: MobileMoneyIcon,
    description: "Pay using your mobile money wallet.",
    instructions:
      "Our team will send you Mobile Money payment details by WhatsApp right after you place this order.",
  },
];

export default function CheckoutForm({
  initialName = "",
  initialEmail = "",
  initialPhone = "",
  items,
  total,
  submitting,
  error,
  termsAccepted,
  termsTouched,
  onTermsBlur,
  onSubmit,
}) {
  const { whatsappNumber } = useCompanyInfo();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState(initialPhone);
  const [state, setState] = useState(SOUTH_SUDAN_STATES[0]);
  const [zone, setZone] = useState(ZONE_NAMES[0]);
  const [customZone, setCustomZone] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [buildingHouse, setBuildingHouse] = useState("");
  const [directions, setDirections] = useState("");
  const [notes, setNotes] = useState("");
  const [mapLocation, setMapLocation] = useState(null);
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].value);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const submitGuardRef = useRef(false);

  const effectiveWhatsapp = sameAsPhone ? phone : whatsapp;
  const isCustomZone = zone === CUSTOM_ZONE || zone === "Other";

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Full name is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    else if (!/^[\d+\s-]{7,}$/.test(phone.trim())) errors.phone = "Enter a valid phone number.";
    if (!sameAsPhone && !whatsapp.trim()) errors.whatsapp = "Enter your WhatsApp number.";
    if (!zone) errors.zone = "Select a delivery area.";
    if (isCustomZone && !customZone.trim()) {
      errors.customZone = "Tell us your delivery area.";
    }
    if (isCustomZone && !mapLocation) {
      errors.mapLocation = "Please pin your delivery location on the map for a custom area.";
    }
    if (!street.trim()) errors.street = "Street / road is required.";
    if (!termsAccepted) errors.terms = "Please accept the Terms & Conditions to continue.";
    return errors;
  };

  const errors = validate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitGuardRef.current || submitting) return;

    if (Object.keys(errors).length > 0) {
      setTouched({
        name: true,
        phone: true,
        whatsapp: true,
        zone: true,
        customZone: true,
        street: true,
        mapLocation: true,
      });
      onTermsBlur?.();
      setFormError("Please fix the highlighted fields before continuing.");
      return;
    }
    setFormError("");
    submitGuardRef.current = true;

    const resolvedZone = isCustomZone && customZone.trim() ? customZone.trim() : zone;
    const addressLines = [
      street.trim(),
      buildingHouse.trim() ? `Building/House: ${buildingHouse.trim()}` : "",
      landmark.trim() ? `Landmark: ${landmark.trim()}` : "",
    ].filter(Boolean);
    const noteLines = [
      directions.trim(),
      notes.trim(),
      effectiveWhatsapp && effectiveWhatsapp !== phone ? `WhatsApp: ${effectiveWhatsapp}` : "",
    ].filter(Boolean);

    onSubmit({
      name,
      email,
      phone,
      state,
      deliveryZone: resolvedZone,
      address: addressLines.join("\n"),
      notes: noteLines.join("\n"),
      payment,
      deliveryLatitude: mapLocation?.lat ?? null,
      deliveryLongitude: mapLocation?.lng ?? null,
      deliveryMapUrl: mapLocation?.mapUrl ?? null,
      deliveryLocationLabel: mapLocation?.locationLabel ?? null,
    }).finally(() => {
      submitGuardRef.current = false;
    });
  };

  const whatsappLink = buildCartOrderLink(items, total, whatsappNumber, {
    name,
    phone,
    state,
    city: isCustomZone ? customZone || zone : zone,
    address: street,
    notes,
    mapUrl: mapLocation?.mapUrl,
  });

  const selectedPaymentInfo = PAYMENT_METHODS.find((m) => m.value === payment);

  return (
    <form id={CHECKOUT_FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>Customer Information</h2>
        <div className={styles.formRow}>
          <label className={styles.label}>
            Full Name <span className={styles.required}>*</span>
            <input
              type="text"
              className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
            {touched.name && errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </label>
          <label className={styles.label}>
            Phone Number <span className={styles.required}>*</span>
            <input
              type="tel"
              className={`${styles.input} ${touched.phone && errors.phone ? styles.inputError : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="e.g. 0923 600 599"
            />
            {touched.phone && errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>
            WhatsApp Number <span className={styles.required}>*</span>
            <input
              type="tel"
              className={`${styles.input} ${touched.whatsapp && errors.whatsapp ? styles.inputError : ""}`}
              value={effectiveWhatsapp}
              disabled={sameAsPhone}
              onChange={(e) => setWhatsapp(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
            />
            {touched.whatsapp && errors.whatsapp && (
              <span className={styles.fieldError}>{errors.whatsapp}</span>
            )}
            <span className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="sameAsPhone"
                checked={sameAsPhone}
                onChange={(e) => setSameAsPhone(e.target.checked)}
              />
              <label htmlFor="sameAsPhone">Same as phone number</label>
            </span>
          </label>
          <label className={styles.label}>
            Email Address (optional)
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>Delivery Information</h2>
        <div className={styles.formRow}>
          <label className={styles.label}>
            Delivery Area <span className={styles.required}>*</span>
            <select
              className={`${styles.input} ${touched.zone && errors.zone ? styles.inputError : ""}`}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, zone: true }))}
            >
              {ZONE_NAMES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>
          <label className={styles.label}>
            State
            <select className={styles.input} value={state} onChange={(e) => setState(e.target.value)}>
              {SOUTH_SUDAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isCustomZone && (
          <label className={styles.label}>
            Tell us your delivery area <span className={styles.required}>*</span>
            <input
              type="text"
              className={`${styles.input} ${touched.customZone && errors.customZone ? styles.inputError : ""}`}
              value={customZone}
              onChange={(e) => setCustomZone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, customZone: true }))}
              placeholder="e.g. Gudele, block 3"
            />
            {touched.customZone && errors.customZone && (
              <span className={styles.fieldError}>{errors.customZone}</span>
            )}
          </label>
        )}

        <label className={styles.label}>
          Street / Road <span className={styles.required}>*</span>
          <input
            type="text"
            className={`${styles.input} ${touched.street && errors.street ? styles.inputError : ""}`}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, street: true }))}
            placeholder="Street or residential area"
          />
          {touched.street && errors.street && <span className={styles.fieldError}>{errors.street}</span>}
        </label>

        <div className={styles.formRow}>
          <label className={styles.label}>
            Nearest Landmark (optional)
            <input
              type="text"
              className={styles.input}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Konyo Konyo market"
            />
          </label>
          <label className={styles.label}>
            Building or House (optional)
            <input
              type="text"
              className={styles.input}
              value={buildingHouse}
              onChange={(e) => setBuildingHouse(e.target.value)}
              placeholder="e.g. House 12, blue gate"
            />
          </label>
        </div>

        <label className={styles.label}>
          Additional Directions (optional)
          <input
            type="text"
            className={styles.input}
            value={directions}
            onChange={(e) => setDirections(e.target.value)}
            placeholder="e.g. Second floor, ask for the shop"
          />
        </label>

        <label className={styles.label}>
          Delivery Notes (optional)
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Call on arrival, best time to deliver"
          />
        </label>

        <p className={styles.deliveryNote}>
          Same-day dispatch — delivery fee confirmed by WhatsApp before dispatch.
        </p>
      </div>

      <DeliveryMap
        zone={isCustomZone ? customZone : zone}
        landmark={landmark}
        onLocationChange={setMapLocation}
        errorMessage={
          isCustomZone && touched.mapLocation && errors.mapLocation ? errors.mapLocation : null
        }
      />

      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>Payment Method</h2>
        <div className={styles.paymentGrid}>
          {PAYMENT_METHODS.map((method) => {
            const selected = payment === method.value;
            return (
              <label
                key={method.value}
                className={`${styles.paymentCard} ${selected ? styles.paymentCardActive : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.value}
                  checked={selected}
                  onChange={() => setPayment(method.value)}
                />
                {selected && (
                  <span className={styles.paymentCheck}>
                    <CheckIcon width="12" height="12" />
                  </span>
                )}
                <span className={styles.paymentIcon} aria-hidden="true">
                  <method.Icon />
                </span>
                <span className={styles.paymentLabel}>{method.value}</span>
                <span className={styles.paymentDescription}>{method.description}</span>
                {method.recommended && <span className={styles.recommendedTag}>Recommended</span>}
              </label>
            );
          })}
        </div>
        {selectedPaymentInfo?.instructions && (
          <p className={styles.paymentInstructions}>{selectedPaymentInfo.instructions}</p>
        )}

        <a
          className={styles.whatsappCheckoutBtn}
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Confirm Order via WhatsApp
        </a>
      </div>

      {(formError || error) && <p className={styles.error}>{formError || error}</p>}
    </form>
  );
}
