let enabled = true;
export const setHaptics = (on: boolean) => {
  enabled = on;
};

/** Short, subtle vibration on supporting devices (Android). No-op elsewhere. */
export const tap = (pattern: number | number[] = 8) => {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
};
