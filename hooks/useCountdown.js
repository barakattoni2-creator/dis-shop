import { useSyncExternalStore } from "react";

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function subscribe(callback) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return formatDuration(msUntilMidnight());
}

// The real countdown is a client-only concept (depends on the visitor's
// clock) — render a fixed placeholder on the server and on the first client
// pass so they match exactly, then swap to the live value right after mount.
function getServerSnapshot() {
  return "00:00:00";
}

export function useCountdownToMidnight() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
