const PREFIX = 'bs:';

export const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: non-fatal */
  }
};

export const remove = (key: string) => {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
};
