import { useState } from "react";
import StarRating from "@/components/StarRating";
import { CheckIcon } from "@/components/icons";
import styles from "@/styles/ProductReviews.module.css";

export default function ProductReviews({ productId, rating, reviews, onReviewSubmitted }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Real counts from the actual review rows — never an estimated/fabricated
  // distribution.
  const starCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length
  );
  const maxCount = Math.max(1, ...starCounts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: name,
          email: email || undefined,
          rating: formRating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review.");
      setName("");
      setEmail("");
      setComment("");
      setFormRating(5);
      setShowForm(false);
      onReviewSubmitted?.(data.review);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <div className={styles.overall}>
          <span className={styles.overallScore}>{rating.toFixed(1)}</span>
          <StarRating rating={rating} />
          <span className={styles.overallCount}>{reviews.length} reviews</span>
        </div>
        <div className={styles.breakdown}>
          {starCounts.map((count, i) => {
            const star = 5 - i;
            return (
              <div key={star} className={styles.breakdownRow}>
                <span>{star}★</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className={styles.breakdownCount}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" className={styles.writeBtn} onClick={() => setShowForm((v) => !v)}>
        {showForm ? "Cancel" : "Write a Review"}
      </button>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Your Name
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Email (optional — verifies your purchase)
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>
          <label className={styles.label}>
            Rating
            <select
              className={styles.input}
              value={formRating}
              onChange={(e) => setFormRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Your Review
            <textarea
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this product?"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}

      <div className={styles.list}>
        {reviews.length === 0 ? (
          <p className={styles.empty}>No reviews yet — be the first to review this product.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHead}>
                <StarRating rating={r.rating} />
                <span className={styles.reviewName}>{r.customerName}</span>
                {r.verified && (
                  <span className={styles.verifiedBadge}>
                    <CheckIcon /> Verified Purchase
                  </span>
                )}
                <span className={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
