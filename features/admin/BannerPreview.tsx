import { useState } from "react";
import Image from "next/image";
import adminStyles from "@/styles/Admin.module.css";
import heroStyles from "@/styles/HeroBanner.module.css";
import styles from "@/styles/BannerPreview.module.css";

export interface BannerPreviewData {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
  mobileImageUrl: string;
}

interface BannerPreviewProps {
  banner: BannerPreviewData;
  onClose: () => void;
}

// Renders the banner using HeroBanner.module.css's own classes (not a
// separate mockup) so what an admin sees here is the real homepage look,
// just scaled into a fixed preview frame instead of the full-bleed
// viewport-width section — a re-styled copy would drift out of sync with
// the actual hero the moment either one changes.
export default function BannerPreview({ banner, onClose }: BannerPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const image = device === "mobile" ? banner.mobileImageUrl || banner.imageUrl : banner.imageUrl;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={adminStyles.modalHeading}>Banner Preview</h2>
          <button type="button" className={adminStyles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.deviceToggle}>
          <button
            type="button"
            className={`${styles.deviceBtn} ${device === "desktop" ? styles.deviceBtnActive : ""}`}
            onClick={() => setDevice("desktop")}
          >
            🖥️ Desktop
          </button>
          <button
            type="button"
            className={`${styles.deviceBtn} ${device === "mobile" ? styles.deviceBtnActive : ""}`}
            onClick={() => setDevice("mobile")}
          >
            📱 Mobile
          </button>
        </div>

        <div className={`${styles.frame} ${device === "mobile" ? styles.frameMobile : styles.frameDesktop}`}>
          {image ? (
            <section className={heroStyles.bannerHero} style={{ height: "100%" }}>
              <div className={heroStyles.bannerSlideImage}>
                <Image src={image} alt={banner.title || "Banner preview"} fill sizes="900px" className={heroStyles.bannerImage} />
              </div>
              <div className={heroStyles.bannerOverlay} />
              <div className={heroStyles.bannerContentWrap}>
                <div className={heroStyles.bannerContent}>
                  {banner.eyebrow && <span className={heroStyles.eyebrow}>{banner.eyebrow}</span>}
                  <h2 className={heroStyles.bannerTitle}>{banner.title || "Banner Title"}</h2>
                  {banner.subtitle && <p className={heroStyles.bannerSubtitle}>{banner.subtitle}</p>}
                  <div className={heroStyles.ctaRow}>
                    <span className={heroStyles.ctaPrimary}>{banner.ctaLabel || "Shop Now"}</span>
                    <span className={heroStyles.ctaSecondary}>View Products</span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <p className={styles.emptyNotice}>Upload a {device} image to see a preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
