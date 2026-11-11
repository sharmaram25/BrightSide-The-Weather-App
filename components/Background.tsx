import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SkyEngine, SkyScene } from '../lib/skyEngine';

interface BackgroundProps {
  palette: [string, string, string];
  scene: SkyScene | null;
  /** lower the frame rate while sheets cover the sky */
  throttle?: boolean;
}

interface Layer {
  key: string;
  gradient: string;
}

/** Procedural living sky: cross-fading gradient + canvas weather engine with scroll parallax. */
const Background: React.FC<BackgroundProps> = ({ palette, scene, throttle = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SkyEngine | null>(null);
  const gradient = `linear-gradient(180deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`;
  const [layers, setLayers] = useState<Layer[]>([{ key: gradient, gradient }]);

  useEffect(() => {
    setLayers((ls) => (ls[ls.length - 1].key === gradient ? ls : [...ls.slice(-2), { key: gradient, gradient }]));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette[0]);
    document.documentElement.style.setProperty('--sky-top', palette[0]);
  }, [gradient, palette]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new SkyEngine(canvasRef.current);
    engineRef.current = engine;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        engine.setScroll(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (scene) engineRef.current?.setScene(scene);
  }, [scene]);

  useEffect(() => {
    engineRef.current?.setThrottle(throttle);
  }, [throttle]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" style={{ background: '#070b18' }}>
      {layers.map((l, i) => (
        <motion.div
          key={l.key}
          className="absolute inset-0 will-change-[opacity]"
          style={{ background: l.gradient }}
          initial={{ opacity: i === 0 ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (i === layers.length - 1 && layers.length > 1) setLayers([l]);
          }}
        />
      ))}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* soft vignette + bottom scrim for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(140% 90% at 50% 0%, transparent 55%, rgba(3,6,15,0.35) 100%), linear-gradient(180deg, transparent 35%, rgba(3,6,15,0.28) 75%, rgba(3,6,15,0.5) 100%)',
        }}
      />
    </div>
  );
};

export default Background;
