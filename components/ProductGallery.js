import { useEffect, useState } from "react";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import { ZoomIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import styles from "@/styles/ProductGallery.module.css";

function getYouTubeEmbedUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// images[] should be real product photos — future-ready for a 360° viewer:
// swap the same array for sequential rotation frames and this component's
// thumbnail-driven "active frame" state already does the rest.
export default function ProductGallery({ images, icon, background, alt, badge, videoUrl }) {
  const [active, setActive] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, px: 0, py: 0 });
  const [zooming, setZooming] = useState(false);
  const hasPhotos = images.length > 0;
  const activeSrc = hasPhotos ? images[active] : null;
  const youTubeEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, images.length]);

  const goTo = (i) => {
    setShowVideo(false);
    setActive((i + images.length) % images.length);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setZoomPos({
      x: (px / rect.width) * 100,
      y: (py / rect.height) * 100,
      px,
      py,
    });
  };

  return (
    <div className={styles.gallery}>
      {(images.length > 1 || videoUrl) && (
        <div className={styles.thumbRow}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`${styles.thumb} ${!showVideo && i === active ? styles.thumbActive : ""}`}
              onClick={() => {
                setShowVideo(false);
                setActive(i);
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={!showVideo && i === active}
            >
              <Image src={src} alt="" fill sizes="72px" className={styles.thumbImage} />
            </button>
          ))}
          {videoUrl && (
            <button
              type="button"
              className={`${styles.thumb} ${styles.videoThumb} ${showVideo ? styles.thumbActive : ""}`}
              onClick={() => setShowVideo(true)}
              aria-label="Play product video"
              aria-current={showVideo}
            >
              <span className={styles.playIcon}>▶</span>
            </button>
          )}
        </div>
      )}

      <div className={styles.mainWrap}>
        {badge && <span className={styles.badge}>{badge}</span>}

        {showVideo && youTubeEmbed ? (
          <iframe
            className={styles.videoFrame}
            src={youTubeEmbed}
            title={`${alt} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : showVideo && videoUrl ? (
          <video className={styles.videoFrame} src={videoUrl} controls autoPlay />
        ) : (
          <button
            type="button"
            className={styles.mainStage}
            onClick={() => hasPhotos && setLightboxOpen(true)}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            aria-label={hasPhotos ? "Open image zoom" : alt}
          >
            <ProductImage
              src={activeSrc}
              icon={icon}
              background={background}
              alt={alt}
              className={styles.mainImage}
              sizes="(max-width: 800px) 90vw, 40vw"
              priority
            />
            {zooming && hasPhotos && (
              <span
                className={styles.zoomLens}
                style={{
                  left: zoomPos.px,
                  top: zoomPos.py,
                  backgroundImage: `url(${activeSrc})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              />
            )}
          </button>
        )}

        {hasPhotos && !showVideo && (
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => setLightboxOpen(true)}
            aria-label="Zoom image"
          >
            <ZoomIcon />
          </button>
        )}
      </div>

      {lightboxOpen && hasPhotos && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom"
          >
            <CloseIcon />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxArrow} ${styles.lightboxArrowPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(active - 1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <div className={styles.lightboxImageWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={activeSrc}
              alt={alt}
              fill
              sizes="90vw"
              className={styles.lightboxImage}
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxArrow} ${styles.lightboxArrowNext}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(active + 1);
              }}
              aria-label="Next image"
            >
              <ChevronRightIcon />
            </button>
          )}

          {images.length > 1 && (
            <div className={styles.lightboxCounter}>
              {active + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
