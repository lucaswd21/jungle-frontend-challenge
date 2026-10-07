import { useSyncExternalStore } from "react";
const breakpoint = "(max-width:767px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(breakpoint);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(breakpoint).matches,
    () => false,
  );
}
