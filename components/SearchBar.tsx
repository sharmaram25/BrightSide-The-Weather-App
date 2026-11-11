import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { searchCities } from '../services/api';
import { GeoResult } from '../types';
import { Place } from '../lib/model';
import { countryName, flag } from '../lib/format';
import { placeId } from '../state/locations';
import { tap } from '../lib/haptics';

interface SearchBarProps {
  query: string;
  onQuery: (q: string) => void;
  onPick: (p: Place) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onQuery, onPick }) => {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchCities(q, ctrl.signal);
        const seen = new Set<string>();
        setResults(
          res.filter((r) => {
            const k = `${r.name}|${r.state}|${r.country}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
        );
        setError(null);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const pick = (r: GeoResult) => {
    tap(10);
    const name = r.local_names?.en ?? r.name;
    onPick({ id: placeId(name, r.country, r.lat, r.lon), name, region: r.state, country: r.country, lat: r.lat, lon: r.lon });
    onQuery('');
  };

  return (
    <div>
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search for a city"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pick(results[0]);
          }}
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.08] pl-10 pr-10 text-[16px] text-white placeholder-white/40 outline-none transition focus:border-white/25 focus:bg-white/[0.12]"
        />
        {query && (
          <button aria-label="Clear search" onClick={() => onQuery('')} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white/80">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {query.trim().length >= 2 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 overflow-hidden rounded-2xl bg-white/[0.05]">
            {results.map((r, i) => (
              <motion.li key={`${r.lat},${r.lon}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <button onClick={() => pick(r)} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/10 ${i ? 'border-t border-white/[0.06]' : ''}`}>
                  <span className="text-[20px] leading-none">{flag(r.country) || <MapPin size={18} />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{r.local_names?.en ?? r.name}</span>
                    <span className="block truncate text-[12px] text-white/55">{[r.state, countryName(r.country)].filter(Boolean).join(', ')}</span>
                  </span>
                </button>
              </motion.li>
            ))}
            {!loading && !error && results.length === 0 && <li className="px-4 py-4 text-center text-[14px] text-white/50">No matching cities</li>}
            {error && <li className="px-4 py-4 text-center text-[14px] text-rose-200/80">{error}</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
