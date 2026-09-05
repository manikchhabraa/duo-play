export function buzz(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

export function joinUrl(roomCode: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomCode);
  url.hash = "";
  return url.toString();
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
