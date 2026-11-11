import React, { useState } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, MinusCircle, Navigation, LocateFixed } from 'lucide-react';
import { Place, Settings } from '../lib/model';
import { fmtTemp, fmtTime } from '../lib/format';
import { sceneFor } from '../lib/sky';
import { tap } from '../lib/haptics';
import { usePeek } from '../state/weatherStore';
import { CURRENT_ID, useLocations } from '../state/locations';
import { Sheet } from './ui';
import SearchBar from './SearchBar';
import CityPills from './CityPills';
import WeatherIcon from './WeatherIcon';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
}

const LocationCard: React.FC<{ place: Place; active: boolean; settings: Settings; editing: boolean; onOpen: () => void; onRemove?: () => void; handle?: React.ReactNode }> = ({
  place,
  active,
  settings,
  editing,
  onOpen,
  onRemove,
  handle,
}) => {
  const data = usePeek(place);
  const sky = data ? sceneFor(data, true, true).palette : ['#1e293b', '#334155', '#475569'];
  const isCurrent = place.id === CURRENT_ID;
  return (
    <div className="flex items-center gap-2">
      <AnimatePresence initial={false}>
        {editing && onRemove && (
          <motion.button
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 32, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            aria-label={`Remove ${place.name}`}
            onClick={() => {
              tap([6, 30, 6]);
              onRemove();
            }}
            className="grid h-8 shrink-0 place-items-center text-rose-400"
          >
            <MinusCircle size={22} className="fill-rose-500/20" />
          </motion.button>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: editing ? 1 : 0.97 }}
        onClick={editing ? undefined : onOpen}
        className={`relative flex flex-1 items-stretch justify-between overflow-hidden rounded-[22px] p-4 text-left shadow-lg ring-1 transition-shadow ${active ? 'ring-white/40' : 'ring-white/10'}`}
        style={{ background: `linear-gradient(135deg, ${sky[0]}, ${sky[1]} 60%, ${sky[2]})` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[19px] font-semibold tracking-tight">
            <span className="truncate">{isCurrent ? 'My Location' : place.name}</span>
            {isCurrent && <Navigation size={12} className="shrink-0 fill-white" />}
          </div>
          <div className="text-[12px] font-medium text-white/70">{isCurrent ? place.name : data ? fmtTime(Date.now() / 1000, data.offset, settings) : place.region || place.country}</div>
          <div className="mt-4 truncate text-[13px] font-medium text-white/80">{data?.current.condition.label ?? 'Loading…'}</div>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="flex items-center gap-1">
            {data && <WeatherIcon kind={data.current.condition.kind} isDay={data.current.condition.isDay} size={30} />}
            <span className="tnum text-[38px] font-light leading-none">{data ? fmtTemp(data.current.temp, settings) : '--'}</span>
          </div>
          {data && (
            <div className="tnum text-[12px] font-medium text-white/75">
              H:{fmtTemp(data.daily[0].tMax, settings)} L:{fmtTemp(data.daily[0].tMin, settings)}
            </div>
          )}
        </div>
      </motion.button>
      {editing && handle}
    </div>
  );
};

const SavedItem: React.FC<{ place: Place; children: (handle: React.ReactNode) => React.ReactNode }> = ({ place, children }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={place} dragListener={false} dragControls={controls} className="relative" whileDrag={{ scale: 1.03, zIndex: 10 }}>
      {children(
        <button aria-label="Reorder" onPointerDown={(e) => controls.start(e)} className="grid h-10 w-8 shrink-0 touch-none place-items-center text-white/50">
          <GripVertical size={20} />
        </button>
      )}
    </Reorder.Item>
  );
};

const LocationsSheet: React.FC<Props> = ({ open, onClose, settings }) => {
  const { places, saved, active, geoStatus, setActive, add, remove, reorder, locate } = useLocations();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const current = places.find((p) => p.id === CURRENT_ID);

  const openPlace = (id: string) => {
    tap();
    setActive(id);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setEditing(false);
        setQuery('');
        onClose();
      }}
      full
      title="Locations"
      headerRight={
        saved.length > 0 && (
          <button onClick={() => setEditing((e) => !e)} className="rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold">
            {editing ? 'Done' : 'Edit'}
          </button>
        )
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-gradient-to-b from-[rgb(18,24,42)] via-[rgb(18,24,42)]/95 to-transparent px-5 pb-3">
        <SearchBar
          query={query}
          onQuery={setQuery}
          onPick={(p) => {
            add(p);
            onClose();
          }}
        />
      </div>

      {!query && (
        <div className="space-y-3 pb-6">
          {current ? (
            <LocationCard place={current} active={active?.id === CURRENT_ID} settings={settings} editing={editing} onOpen={() => openPlace(CURRENT_ID)} />
          ) : (
            geoStatus !== 'granted' && (
              <button onClick={locate} className="flex w-full items-center gap-3 rounded-[22px] border border-dashed border-white/20 p-4 text-left active:bg-white/5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                  <LocateFixed size={18} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{geoStatus === 'pending' ? 'Finding your location…' : 'Use my location'}</span>
                  <span className="block text-[12px] text-white/55">{geoStatus === 'denied' ? 'Allow location access in your browser settings' : 'Weather where you are, automatically'}</span>
                </span>
              </button>
            )
          )}

          <Reorder.Group axis="y" values={saved} onReorder={reorder} className="space-y-3">
            {saved.map((p) => (
              <SavedItem key={p.id} place={p}>
                {(handle) => <LocationCard place={p} active={active?.id === p.id} settings={settings} editing={editing} onOpen={() => openPlace(p.id)} onRemove={() => remove(p.id)} handle={handle} />}
              </SavedItem>
            ))}
          </Reorder.Group>

          <div className="pt-3">
            <CityPills
              exclude={saved.map((s) => s.id)}
              onSelect={(p) => {
                add(p);
                onClose();
              }}
            />
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default LocationsSheet;
