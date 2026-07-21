import styles from "@/styles/TrackOrder.module.css";

// Small non-interactive preview using OpenStreetMap's free embed endpoint —
// no API key, consistent with the checkout page's map (features/checkout/DeliveryMap.js).
export default function DeliveryLocationPreview({ lat, lng, mapUrl, label }) {
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lng}&layer=mapnik`;

  return (
    <div className={styles.mapPreviewWrap}>
      <iframe
        className={styles.mapPreviewFrame}
        src={embedSrc}
        title={label ? `Map preview of ${label}` : "Delivery location preview"}
        loading="lazy"
      />
      <a
        className={styles.openLocationBtn}
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Delivery Location
      </a>
    </div>
  );
}
