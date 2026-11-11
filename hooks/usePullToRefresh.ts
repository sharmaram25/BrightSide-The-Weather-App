import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { tap } from '../lib/haptics';

const THRESHOLD = 72;
const MAX = 130;

/**
 * Custom pull-to-refresh with rubber-band resistance.
 * The blocking (non-passive) touchmove listener is only attached for gestures that
 * start at the very top of the page, so normal scrolling stays fully asynchronous.
 */
export const usePullToRefresh = (onRefresh: () => Promise<unknown>, enabled = true) => {
  const pull = useMotionValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;
    let startY = 0;
    let startX = 0;
    let decided = false;
    let armed = false;
    let tracking = false;

    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        decided = true;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) {
          detach();
          return;
        }
      }
      if (dy <= 0) {
        pull.set(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      const d = Math.min(MAX, dy * 0.5 * (1 - Math.min(dy, 400) / 1200));
      pull.set(d);
      if (d >= THRESHOLD && !armed) {
        armed = true;
        tap(12);
      } else if (d < THRESHOLD && armed) {
        armed = false;
      }
    };

    const onEnd = async () => {
      detach();
      if (armed && !busy.current) {
        busy.current = true;
        setRefreshing(true);
        animate(pull, 60, { type: 'spring', stiffness: 420, damping: 36 });
        try {
          await Promise.all([cb.current(), new Promise((r) => setTimeout(r, 600))]);
        } finally {
          busy.current = false;
          setRefreshing(false);
          animate(pull, 0, { type: 'spring', stiffness: 380, damping: 34 });
        }
      } else if (pull.get() !== 0) {
        animate(pull, 0, { type: 'spring', stiffness: 500, damping: 38 });
      }
      armed = false;
    };

    const attach = () => {
      if (tracking) return;
      tracking = true;
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    };
    const detach = () => {
      if (!tracking) return;
      tracking = false;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };

    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0 || document.body.style.overflow === 'hidden') return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      decided = false;
      armed = false;
      attach();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      detach();
    };
  }, [enabled, pull]);

  return { pull, refreshing, threshold: THRESHOLD };
};
