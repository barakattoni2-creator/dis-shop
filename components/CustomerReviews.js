import StarRating from "@/components/StarRating";
import { CheckIcon } from "@/components/icons";
import styles from "@/styles/CustomerReviews.module.css";

// Placeholder testimonials, shown only until the store has real reviews —
// once fetchTopReviews() (services/db/reviews.ts) returns actual 4+ star,
// commented reviews, those replace this list entirely rather than mixing
// real and sample data together.
const FALLBACK_REVIEWS = [
  {
    id: "sample-james",
    name: "James A.",
    location: "Juba",
    rating: 5,
    text: "Bought a split AC before the hot season and the delivery was fast. Works great and the price was fair compared to other shops in town.",
    verified: false,
  },
  {
    id: "sample-grace",
    name: "Grace M.",
    location: "Juba",
    rating: 4.5,
    text: "Got my solar panel and inverter set from DIS Shop. The staff explained everything clearly and helped me pick the right size for my home.",
    verified: false,
  },
  {
    id: "sample-peter",
    name: "Peter D.",
    location: "Juba",
    rating: 5,
    text: "Ordered tools for my workshop through WhatsApp and they had everything ready the same day. Will definitely order again.",
    verified: false,
  },
];

export default function CustomerReviews({ reviews = [] }) {
  const realReviews = reviews.map((r) => ({
    id: r.id,
    name: r.customerName,
    location: r.productName,
    rating: r.rating,
    text: r.comment,
    verified: r.verified,
  }));
  const displayReviews = realReviews.length > 0 ? realReviews : FALLBACK_REVIEWS;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>What Our Customers Say</h2>
      <div className={styles.grid}>
        {displayReviews.map((review) => (
          <div key={review.id} className={styles.card}>
            <StarRating rating={review.rating} />
            <p className={styles.text}>&ldquo;{review.text}&rdquo;</p>
            <div className={styles.author}>
              <span className={styles.avatar}>{review.name.charAt(0)}</span>
              <div>
                <span className={styles.name}>
                  {review.name}
                  {review.verified && (
                    <span className={styles.verifiedBadge}>
                      <CheckIcon width="11" height="11" /> Verified Purchase
                    </span>
                  )}
                </span>
                <span className={styles.location}>{review.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
