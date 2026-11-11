import React from 'react';
import { motion } from 'framer-motion';
import { CloudOff, KeyRound, RotateCw, LocateFixed } from 'lucide-react';

export const Skeleton: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col gap-3 pt-6">
    <div className="flex flex-col items-center gap-3 pb-6">
      <div className="skeleton h-7 w-40 rounded-full" />
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton mt-2 h-28 w-40 rounded-[32px]" />
      <div className="skeleton h-5 w-32 rounded-full" />
      {label && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
          <LocateFixed size={14} className="animate-pulse" /> {label}
        </motion.p>
      )}
    </div>
    <div className="skeleton h-44 rounded-[26px]" />
    <div className="skeleton h-80 rounded-[26px]" />
    <div className="grid grid-cols-2 gap-3">
      <div className="skeleton h-40 rounded-[26px]" />
      <div className="skeleton h-40 rounded-[26px]" />
    </div>
  </div>
);

export const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => {
  const missingKey = /api key/i.test(error);
  const Icon = missingKey ? KeyRound : CloudOff;
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} className="flex min-h-[70dvh] items-center justify-center">
      <div className="glass w-full max-w-sm rounded-[30px] p-7 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-white/10">
          <Icon size={28} className="text-white/80" />
        </div>
        <h2 className="text-[21px] font-semibold tracking-tight">{missingKey ? 'API key needed' : 'Couldn’t load the forecast'}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-white/65">
          {missingKey ? (
            <>
              Add <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">VITE_OPENWEATHER_API_KEY</code> to <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">.env.local</code> and restart the dev server.
            </>
          ) : (
            `${error}. Check your connection and try again.`
          )}
        </p>
        {!missingKey && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-900">
            <RotateCw size={15} /> Try again
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
