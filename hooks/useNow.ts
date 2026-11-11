import { useEffect, useState } from 'react';

/** Re-renders every `ms` (aligned to the minute by default) so relative times stay fresh. */
export const useNow = (ms = 60000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), ms);
    }, ms - (Date.now() % ms));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [ms]);
  return now;
};
