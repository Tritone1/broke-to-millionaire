const AD_RETURN_GRACE_MS = 2_500;

let visibleAdCount = 0;
let lastAdClosedAt = 0;

/** Marks a native full-screen ad as the reason the app may become inactive. */
export function beginAdPresentation(): void {
  visibleAdCount += 1;
}

/** Keeps a short grace window because native CLOSED and AppState active events can arrive in either order. */
export function endAdPresentation(now = Date.now()): void {
  visibleAdCount = Math.max(0, visibleAdCount - 1);
  lastAdClosedAt = now;
}

export function isAdAppStateTransition(now = Date.now()): boolean {
  return visibleAdCount > 0 || (lastAdClosedAt > 0 && now - lastAdClosedAt <= AD_RETURN_GRACE_MS);
}

export function resetAdLifecycleForTests(): void {
  visibleAdCount = 0;
  lastAdClosedAt = 0;
}

