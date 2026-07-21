// A small, consistent line-icon set replacing raw emoji in UI chrome —
// emoji render inconsistently across platforms and read as unpolished next
// to the rest of the interface.

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20.5 8H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.4" fill="currentColor" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <path
        d="M12 20.3s-7.5-4.6-10-9.3C.5 7.6 2.4 4 6 4c2 0 3.6 1 4.9 2.6L12 7.9l1.1-1.3C14.4 5 16 4 18 4c3.6 0 5.5 3.6 4 7-2.5 4.7-10 9.3-10 9.3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ fill = "currentColor", ...props }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...props}>
      <path
        d="M12 2.7l2.9 6 6.6.9-4.8 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.8-4.6 6.6-.9Z"
        fill={fill}
      />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ZoomIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.5 8v5M8 10.5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function TagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 12.6 12.6 20a2 2 0 0 1-2.83 0l-6.77-6.77a2 2 0 0 1 0-2.83L10.4 3H19a1 1 0 0 1 1 1v8.6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="14.5" cy="8.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function PowerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3 5 6v5.5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 6h11v10H2zM13 10h4l4 3.2V16h-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="1.6" fill="currentColor" />
      <circle cx="17" cy="18" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function AwardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 13.5 7.5 21l4.5-2.4 4.5 2.4-1.5-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompareIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path d="M8 3v18M8 4l-3 3M8 4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21V3M16 20l3-3M16 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8.2 10.7 15.8 6.3M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SupportIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6.3 6.3l3.2 3.2M17.7 6.3l-3.2 3.2M6.3 17.7l3.2-3.2M17.7 17.7l-3.2-3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H10l-4.2 3.4a.6.6 0 0 1-1-.5V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 10.6l2.1 2.1 4.3-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4v11m0 0-4-4m4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
