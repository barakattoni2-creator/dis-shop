import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { UserIcon, ChevronDownIcon, PackageIcon, HeartIcon, LogOutIcon } from "@/components/icons";
import styles from "@/styles/Header.module.css";

export default function UserMenu() {
  const { user, logout } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSignOut = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className={styles.dropdownRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.actionLink}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className={styles.actionIcon}>
          <UserIcon />
        </span>
        <span className={styles.actionText}>
          {user ? `Hi, ${user.name}` : "Sign In"}
          <ChevronDownIcon className={styles.actionChevron} />
        </span>
      </button>

      {open && (
        <div className={styles.dropdownPanel}>
          {user ? (
            <>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownHeaderName}>{user.name}</span>
                {user.email && <span className={styles.dropdownHeaderSub}>{user.email}</span>}
              </div>
              <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                <UserIcon width="16" height="16" /> My Account
              </Link>
              <Link href="/orders" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                <PackageIcon /> My Orders
              </Link>
              <Link href="/wishlist" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                <HeartIcon filled={false} width="16" height="16" /> Wishlist
              </Link>
              <button type="button" className={styles.dropdownItemBtn} onClick={handleSignOut}>
                <LogOutIcon /> Sign Out
              </button>
            </>
          ) : (
            <>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownHeaderSub}>Sign in for faster checkout and order tracking.</span>
              </div>
              <Link href="/login" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                <UserIcon width="16" height="16" /> Sign In
              </Link>
              <Link href="/register" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                <UserIcon width="16" height="16" /> Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
