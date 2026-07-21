import StarRating from "@/components/StarRating";
import styles from "@/styles/CustomerReviews.module.css";

// Sample testimonials for layout purposes — replace with real customer
// reviews before this site goes live.
const REVIEWS = [
  {
    name: "James A.",
    location: "Juba",
    rating: 5,
    text: "Bought a split AC before the hot season and the delivery was fast. Works great and the price was fair compared to other shops in town.",
  },
  {
    name: "Grace M.",
    location: "Juba",
    rating: 4.5,
    text: "Got my solar panel and inverter set from DIS Shop. The staff explained everything clearly and helped me pick the right size for my home.",
  },
  {
    name: "Peter D.",
    location: "Juba",
    rating: 5,
    text: "Ordered tools for my workshop through WhatsApp and they had everything ready the same day. Will definitely order again.",
  },
];

export default function CustomerReviews() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>What Our Customers Say</h2>
      <div className={styles.grid}>
        {REVIEWS.map((review) => (
          <div key={review.name} className={styles.card}>
            <StarRating rating={review.rating} />
            <p className={styles.text}>&ldquo;{review.text}&rdquo;</p>
            <div className={styles.author}>
              <span className={styles.avatar}>{review.name.charAt(0)}</span>
              <div>
                <span className={styles.name}>{review.name}</span>
                <span className={styles.location}>{review.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
