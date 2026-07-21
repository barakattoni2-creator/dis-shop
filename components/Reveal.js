import { useInView } from "@/hooks/useInView";
import styles from "@/styles/Reveal.module.css";

export default function Reveal({ children, className = "", delay = 0, id }) {
  const [ref, inView] = useInView();

  return (
    <div
      id={id}
      ref={ref}
      className={`${styles.reveal} ${inView ? styles.inView : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
