import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/RouteProgress.module.css";

// Vercel/Amazon-style top progress bar for page navigations — Pages Router
// gives no built-in loading affordance between `routeChangeStart` and the
// new page's paint, so a slow connection (or a getStaticProps page that
// needs to fetch) currently just looks frozen. Eases toward 90% while
// waiting (real duration is unknown), then snaps to 100% and fades out on
// completion. Skipped for same-page hash links (`routeChangeStart` still
// fires for those) since there's no actual page load to indicate.
export default function RouteProgress() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };

    const handleStart = (url: string) => {
      // Same-page hash navigation (e.g. "/#flash-deals") fires
      // routeChangeStart too, but there's no actual page load to show
      // progress for.
      const [currentPath] = router.asPath.split("#");
      const [nextPath] = url.split("#");
      if (nextPath === currentPath) return;
      clearTimers();
      setVisible(true);
      setProgress(12);
      timerRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.12));
      }, 200);
    };

    const handleDone = () => {
      clearTimers();
      setProgress(100);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.bar} style={{ width: `${progress}%` }} />
    </div>
  );
}
