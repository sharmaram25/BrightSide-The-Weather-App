import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls, useSpring, useTransform, PanInfo } from 'framer-motion';
import { tap } from '../lib/haptics';

/** Snappy spring for interactive elements (taps, toggles, indicators). */
export const spring = { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 };
/** Gentle spring for things that settle (needles, numbers). */
export const softSpring = { type: 'spring' as const, stiffness: 170, damping: 24 };
/** Entrance easing: quick start, long soft landing. Cheaper and crisper than a spring for reveals. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const reveal = (delay = 0) => ({ duration: 0.55, ease: EASE_OUT, delay });

// ------------------------------------------------------------------ Card

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  pad?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, icon, right, children, className = '', onClick, delay = 0, pad = true }) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.08 }}
    transition={reveal(delay)}
    whileTap={onClick ? { scale: 0.975, transition: spring } : undefined}
    onClick={
      onClick
        ? () => {
            tap();
            onClick();
          }
        : undefined
    }
    className={`glass relative overflow-hidden rounded-[26px] ${pad ? 'p-4' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {title && (
      <header className={`label mb-3 flex items-center gap-1.5 ${pad ? '' : 'px-4 pt-4'}`}>
        <span className="opacity-80">{icon}</span>
        <span>{title}</span>
        {right && <span className="ml-auto normal-case tracking-normal font-medium text-white/45">{right}</span>}
      </header>
    )}
    {children}
  </motion.section>
);

// ------------------------------------------------------------------ AnimatedNumber

export const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const mv = useSpring(value + (value >= 0 ? -6 : 6), { stiffness: 90, damping: 22, restDelta: 0.5 });
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
};

// ------------------------------------------------------------------ Segmented

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  layoutId,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  layoutId: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`flex rounded-full bg-black/20 p-1 ${size === 'sm' ? 'text-[12px]' : 'text-[13px]'}`} onPointerDown={(e) => e.stopPropagation()}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => {
            if (o.value !== value) tap(6);
            onChange(o.value);
          }}
          className={`relative flex-1 whitespace-nowrap rounded-full font-medium transition-colors duration-300 ${size === 'sm' ? 'px-3 py-1' : 'px-3.5 py-1.5'} ${o.value === value ? 'text-white' : 'text-white/55'}`}
        >
          {o.value === value && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} transition={spring} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Sheet

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  full?: boolean;
}

/** Bottom sheet with drag-to-dismiss from the handle/header, spring physics and backdrop. */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, children, title, headerRight, full }) => {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      tap(6);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            className={`sheet-surface absolute inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col rounded-t-[30px] will-change-transform shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)] ${full ? 'h-[92dvh]' : 'max-h-[92dvh]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div className="cursor-grab touch-none select-none px-5 pt-2.5 pb-2" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto mb-2.5 h-1.5 w-10 rounded-full bg-white/25" />
              {(title || headerRight) && (
                <div className="flex min-h-9 items-center justify-between gap-3">
                  <div className="text-[17px] font-semibold tracking-tight">{title}</div>
                  {headerRight}
                </div>
              )}
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ------------------------------------------------------------------ Toasts

interface Toast {
  id: number;
  text: string;
}
const ToastCtx = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((text: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.filter((x) => x.text !== text), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-safe">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={spring}
              className="glass-strong mt-1 max-w-[min(92vw,26rem)] rounded-2xl px-4 py-2.5 text-center text-[13px] font-medium text-white/90 shadow-xl"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
};

// ------------------------------------------------------------------ IconButton

export const IconButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; className?: string }> = ({ onClick, label, children, className = '' }) => (
  <motion.button
    whileTap={{ scale: 0.88 }}
    transition={spring}
    aria-label={label}
    onClick={() => {
      tap();
      onClick();
    }}
    className={`grid h-10 w-10 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/10 active:bg-white/15 ${className}`}
  >
    {children}
  </motion.button>
);
