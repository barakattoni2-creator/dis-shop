export const DELIVERY_ZONES = [
  "Munuki",
  "Juba Town",
  "Tongping",
  "Hai Cinema",
  "Custom Zone (specify below)",
] as const;

export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

// Approximate reference points only, for centering the checkout map when a
// zone is picked — not surveyed neighborhood boundaries or precise
// addresses. The customer's own pin (click/drag/current location/search)
// is always the authoritative delivery point; these just give the map a
// sensible starting view per zone.
export const JUBA_CENTER = { lat: 4.8517, lng: 31.5825 };

export const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Munuki: { lat: 4.865, lng: 31.555 },
  "Juba Town": { lat: 4.8472, lng: 31.582 },
  Tongping: { lat: 4.865, lng: 31.605 },
  "Hai Cinema": { lat: 4.838, lng: 31.59 },
};
