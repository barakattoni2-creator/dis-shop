// Shared between the storefront hero (components/HeroBanner.tsx) and the
// admin live preview (features/admin/BannerPreview.tsx) so both render the
// exact same overlay for a given opacity — one formula, not two copies that
// can drift apart.
//
// Base stops are the original fixed gradient design (opacity=100 reproduces
// it exactly); scaling every stop's alpha by opacity/100 keeps the same
// gradient shape while letting brighter photos use a lighter scrim.
const BASE_STOPS: Array<{ pos: number; r: number; g: number; b: number; a: number }> = [
  { pos: 0, r: 3, g: 14, b: 38, a: 1 },
  { pos: 22, r: 4, g: 18, b: 48, a: 0.94 },
  { pos: 34, r: 4, g: 18, b: 48, a: 0.65 },
  { pos: 46, r: 4, g: 18, b: 48, a: 0 },
];

export function buildBannerOverlayGradient(opacityPercent: number): string {
  const scale = Math.min(100, Math.max(0, opacityPercent)) / 100;
  const stops = BASE_STOPS.map(
    (s) => `rgba(${s.r}, ${s.g}, ${s.b}, ${(s.a * scale).toFixed(3)}) ${s.pos}%`
  );
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
