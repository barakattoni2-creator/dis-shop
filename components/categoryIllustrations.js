// Clean line-art illustrations, one per real category — used whenever a
// category has no representative product photo yet. Deliberately not
// emoji: simple geometric vector shapes in the DIS brand stroke style,
// consistent with components/icons.js but larger and more detailed since
// these render at ~90px inside a category card, not as small UI icons.

function AcIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <rect x="8" y="20" width="48" height="20" rx="4" stroke="currentColor" strokeWidth="3" />
      <path d="M16 28h6M26 28h6M36 28h6M46 28h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 40v6M32 40v8M44 40v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SolarIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <circle cx="32" cy="16" r="7" stroke="currentColor" strokeWidth="3" />
      <path
        d="M32 4v4M20 8l3 3M44 8l-3 3M14 16h4M46 16h4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="10" y="32" width="44" height="24" rx="2" stroke="currentColor" strokeWidth="3" />
      <path d="M10 44h44M21.5 32v24M32 32v24M42.5 32v24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ElectricalIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M24 6h16v14a8 8 0 0 1-16 0V6Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 6V2M36 6V2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 28v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 40 24 54h8l-2 8 12-16h-8l2-6Z" fill="currentColor" />
    </svg>
  );
}

function HomeKitchenIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M10 30 32 10l22 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 26v28h32V26" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M26 54V40h12v14" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function ToolsIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M40 12a10 10 0 0 0-13.9 11L10 39.1a4 4 0 0 0 5.7 5.7L31.9 28a10 10 0 0 0 11-13.9l-6.4 6.4-5.3-1.3-1.3-5.3L40 12Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="50" r="3" fill="currentColor" />
    </svg>
  );
}

function HouseholdIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M12 26h40l-4 28H16l-4-28Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 26v-4a10 10 0 0 1 20 0v4" stroke="currentColor" strokeWidth="3" />
      <path d="M12 34h40" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CleaningIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M26 10h8v8h4l2 6v30a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V24l2-6h4v-8Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M20 32h20" stroke="currentColor" strokeWidth="2" />
      <circle cx="46" cy="14" r="2" fill="currentColor" />
      <circle cx="52" cy="22" r="2.4" fill="currentColor" />
      <circle cx="46" cy="30" r="1.6" fill="currentColor" />
    </svg>
  );
}

function LightingIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M32 8a16 16 0 0 0-9 29c2 1.4 3 3.6 3 6v1h12v-1c0-2.4 1-4.6 3-6a16 16 0 0 0-9-29Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M27 50h10M28 56h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function WaterPumpIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M32 8s14 16 14 27a14 14 0 1 1-28 0C18 24 32 8 32 8Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M24 38a8 8 0 0 0 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function GeneratorIllustration(props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <rect x="10" y="16" width="44" height="32" rx="3" stroke="currentColor" strokeWidth="3" />
      <circle cx="22" cy="32" r="6" stroke="currentColor" strokeWidth="3" />
      <path d="M36 24 30 34h6l-4 8 10-12h-6l2-6Z" fill="currentColor" />
      <path d="M10 24h4M10 40h4M50 24h4M50 40h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const CATEGORY_ILLUSTRATIONS = {
  "air-conditioners": AcIllustration,
  solar: SolarIllustration,
  electrical: ElectricalIllustration,
  "home-kitchen": HomeKitchenIllustration,
  tools: ToolsIllustration,
  "household-supplies": HouseholdIllustration,
  "cleaning-laundry": CleaningIllustration,
  lighting: LightingIllustration,
  "water-pumps": WaterPumpIllustration,
  generators: GeneratorIllustration,
};
