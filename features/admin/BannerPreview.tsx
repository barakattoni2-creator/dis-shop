import { useState } from "react";
import Image from "next/image";
import { Monitor, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildBannerOverlayGradient } from "@/lib/bannerOverlay";
import heroStyles from "@/styles/HeroBanner.module.css";
import styles from "@/styles/BannerPreview.module.css";

export interface BannerPreviewData {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
  mobileImageUrl: string;
  overlayOpacity?: number;
  textAlign?: "left" | "center" | "right";
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Banner Preview</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={device === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-4" /> Desktop
          </Button>
          <Button
            type="button"
            variant={device === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-4" /> Mobile
          </Button>
        </div>

        <div className={`${styles.frame} ${device === "mobile" ? styles.frameMobile : styles.frameDesktop}`}>
          {image ? (
            <section className={heroStyles.bannerHero} style={{ height: "100%" }}>
              <div className={heroStyles.bannerSlideImage}>
                <Image src={image} alt={banner.title || "Banner preview"} fill sizes="900px" className={heroStyles.bannerImage} />
              </div>
              <div
                className={heroStyles.bannerOverlay}
                style={{ background: buildBannerOverlayGradient(banner.overlayOpacity ?? 100) }}
              />
              <div className={heroStyles.bannerContentWrap} data-align={banner.textAlign || "left"}>
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
      </DialogContent>
    </Dialog>
  );
}
