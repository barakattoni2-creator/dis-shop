import { StarIcon } from "@/components/icons";
import styles from "@/styles/StarRating.module.css";

export default function StarRating({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const filledCount = rating - full >= 0.75 ? full + 1 : full;

  return (
    <span className={styles.stars} role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < filledCount) {
          return <StarIcon key={i} className={styles.starFilled} />;
        }
        if (i === filledCount && hasHalf) {
          return (
            <span key={i} className={styles.starHalfWrap}>
              <StarIcon className={styles.starEmpty} />
              <span className={styles.starHalfFill}>
                <StarIcon className={styles.starFilled} />
              </span>
            </span>
          );
        }
        return <StarIcon key={i} className={styles.starEmpty} />;
      })}
    </span>
  );
}
