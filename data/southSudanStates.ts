// DIS Shop is based in Juba (Central Equatoria) and that's the overwhelming
// majority of deliveries, hence it's listed first / used as the default.
export const SOUTH_SUDAN_STATES = [
  "Central Equatoria",
  "Eastern Equatoria",
  "Western Equatoria",
  "Jonglei",
  "Unity",
  "Upper Nile",
  "Northern Bahr el Ghazal",
  "Western Bahr el Ghazal",
  "Warrap",
  "Lakes",
  "Other / Outside South Sudan",
] as const;

export type SouthSudanState = (typeof SOUTH_SUDAN_STATES)[number];
