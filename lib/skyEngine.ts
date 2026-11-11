import { IconKind } from './model';
import { moonPath } from './astro';

export interface SkyScene {
  kind: IconKind;
  isDay: boolean;
  cloud: number; // 0..1
  precip: number; // 0..1 intensity
  wind: number; // m/s, signed horizontal component (+ = to the right)
  moonPhase: number;
  southern: boolean;
  sunProgress: number | null; // 0..1 across the day, null at night
  lite: boolean;
  reduced: boolean;
}

interface Star { x: number; y: number; r: number; tw: number; sp: number }
interface CloudP { x: number; y: number; s: number; v: number; a: number; sprite: number; depth: number }
interface Drop { x: number; y: number; len: number; v: number; layer: number }
interface Flake { x: number; y: number; r: number; v: number; ph: number; layer: number }
interface Shooting { x: number; y: number; vx: number; vy: number; life: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const WET: IconKind[] = ['drizzle', 'rain', 'heavy-rain', 'thunder', 'sleet'];

const canvas2d = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

const makeCloudSprite = (dark: boolean, seed: number) => {
  // Rendered small and scaled up: clouds are soft, so this costs nothing visually
  const w = 260;
  const h = 120;
  const c = canvas2d(w, h);
  const g = c.getContext('2d')!;
  const puffs = 9 + (seed % 4);
  for (let i = 0; i < puffs; i++) {
    const t = i / (puffs - 1);
    const x = 35 + t * (w - 70) + rand(-10, 10);
    const y = h * 0.58 - Math.sin(t * Math.PI) * rand(15, 30) + rand(-5, 5);
    const r = rand(28, 48) * (0.7 + Math.sin(t * Math.PI) * 0.5);
    const grad = g.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
    if (dark) {
      grad.addColorStop(0, 'rgba(150,160,180,0.55)');
      grad.addColorStop(0.6, 'rgba(110,120,140,0.28)');
      grad.addColorStop(1, 'rgba(90,100,120,0)');
    } else {
      grad.addColorStop(0, 'rgba(255,255,255,0.6)');
      grad.addColorStop(0.55, 'rgba(240,245,255,0.28)');
      grad.addColorStop(1, 'rgba(230,236,248,0)');
    }
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
};

const makeFogSprite = () => {
  const c = canvas2d(256, 128);
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 64, 0, 128, 64, 128);
  grad.addColorStop(0, 'rgba(220,226,235,0.16)');
  grad.addColorStop(1, 'rgba(220,226,235,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);
  return c;
};

/**
 * Lightweight procedural sky. Performance notes:
 * - renders at ≤1x device pixels (sky content is soft, so it looks identical)
 * - static glows (sun / moon) are baked into a cached layer and blitted
 * - calm scenes run at 30fps; precipitation at 60fps
 * - adapts particle counts if frames run long, and fully stops when nothing moves
 */
export class SkyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private scale = 1;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private scene: SkyScene | null = null;
  private scroll = 0;
  private throttled = false;

  private stars: Star[] = [];
  private clouds: CloudP[] = [];
  private drops: Drop[] = [];
  private flakes: Flake[] = [];
  private shooting: Shooting | null = null;
  private nextShooting = 0;
  private flash = 0;
  private bolt: { pts: [number, number][]; branches: [number, number][][]; life: number } | null = null;
  private nextBolt = 0;
  private fogT = 0;
  private cloudSet: 'light' | 'dark' = 'light';
  private sprites: { light: HTMLCanvasElement[]; dark: HTMLCanvasElement[]; fog: HTMLCanvasElement } | null = null;
  private celestial: HTMLCanvasElement | null = null;
  private celestialKey = '';

  // adaptive quality
  private quality = 1;
  private slowFrames = 0;
  private sampleFrames = 0;

  private alpha = { stars: 0, clouds: 0, rain: 0, snow: 0, fog: 0, sun: 0, moon: 0 };
  private target = { stars: 0, clouds: 0, rain: 0, snow: 0, fog: 0, sun: 0, moon: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.measure();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  setScroll(y: number) {
    const prev = this.scroll;
    this.scroll = y;
    // only matters for parallax near the top; skip redraws further down
    if (!this.running && this.scene && Math.min(prev, y) < this.h * 2) this.draw(0);
  }

  /** Lower frame rate while sheets cover the sky. */
  setThrottle(on: boolean) {
    this.throttled = on;
  }

  setScene(s: SkyScene) {
    const prev = this.scene;
    this.scene = s;
    if (!this.sprites) {
      this.sprites = {
        light: [0, 1, 2].map((i) => makeCloudSprite(false, i)),
        dark: [0, 1, 2].map((i) => makeCloudSprite(true, i)),
        fog: makeFogSprite(),
      };
    }
    const structural =
      !prev ||
      prev.kind !== s.kind ||
      prev.isDay !== s.isDay ||
      prev.lite !== s.lite ||
      prev.reduced !== s.reduced ||
      Math.abs(prev.cloud - s.cloud) > 0.08 ||
      Math.abs(prev.precip - s.precip) > 0.1;

    if (!prev || prev.lite !== s.lite) this.measure();
    if (structural) this.populate();
    else this.retarget(); // e.g. the minute tick: sun moves, nothing jumps

    if (s.reduced) {
      this.stop();
      Object.assign(this.alpha, this.target);
      this.draw(0);
    } else {
      this.start();
    }
  }

  private onVisibility() {
    if (document.hidden) this.stop();
    else if (this.scene && !this.scene.reduced) this.start();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private measure() {
    const lite = this.scene?.lite ?? false;
    const dpr = window.devicePixelRatio || 1;
    this.scale = Math.min(dpr, lite ? 0.75 : 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.scale);
    this.canvas.height = Math.round(this.h * this.scale);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.celestialKey = '';
  }

  private resize() {
    // Mobile browsers fire resize when the URL bar shows/hides; ignore height-only nudges
    if (Math.abs(window.innerWidth - this.w) < 2 && Math.abs(window.innerHeight - this.h) < 120) return;
    this.measure();
    if (this.scene) {
      this.populate();
      if (!this.running) this.draw(0);
    }
  }

  private density() {
    const area = Math.min(1.6, (this.w * this.h) / (390 * 844));
    return area * (this.scene!.lite ? 0.5 : 1) * this.quality;
  }

  private populate() {
    const s = this.scene!;
    const k = this.density();
    const wet = WET.includes(s.kind);
    const snowy = s.kind === 'snow' || s.kind === 'sleet';
    const darkClouds = wet || s.kind === 'overcast';

    const starCount = !s.isDay ? Math.round(140 * k * (1 - s.cloud * 0.85)) : 0;
    this.stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.pow(Math.random(), 1.4) * 0.75,
      r: rand(0.6, 1.8),
      tw: Math.random() * Math.PI * 2,
      sp: rand(0.6, 1.8),
    }));

    const cloudCount = Math.round((s.cloud * 8 + (wet ? 3 : 0)) * (s.lite ? 0.6 : 1));
    this.cloudSet = darkClouds ? 'dark' : 'light';
    const sizeK = Math.max(0.8, Math.min(1.4, this.w / 420));
    this.clouds = Array.from({ length: cloudCount }, (_, i) => {
      const depth = rand(0.4, 1);
      return {
        x: rand(-0.3, 1.1) * this.w,
        y: rand(-0.05, darkClouds ? 0.42 : 0.35) * this.h,
        s: rand(1.2, 2.5) * depth * sizeK,
        v: rand(0.06, 0.16) * depth,
        a: rand(0.5, 0.95) * (darkClouds ? 1 : 0.85),
        sprite: i % 3,
        depth,
      };
    }).sort((a, b) => a.depth - b.depth);

    const dropCount = wet && s.kind !== 'sleet' ? Math.round((s.kind === 'drizzle' ? 80 : 140 + s.precip * 220) * k) : s.kind === 'sleet' ? Math.round(80 * k) : 0;
    this.drops = Array.from({ length: dropCount }, () => {
      const layer = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
      return {
        x: Math.random() * this.w * 1.2 - this.w * 0.1,
        y: Math.random() * this.h,
        len: (s.kind === 'drizzle' ? 6 : 12) + layer * 6 + Math.random() * 6,
        v: (s.kind === 'drizzle' ? 7 : 13) + layer * 5 + Math.random() * 4,
        layer,
      };
    });

    const flakeCount = snowy ? Math.round((s.kind === 'sleet' ? 55 : 120) * k) : 0;
    this.flakes = Array.from({ length: flakeCount }, () => {
      const layer = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
      return { x: Math.random() * this.w, y: Math.random() * this.h, r: 1 + layer * 1.1 + Math.random(), v: 0.5 + layer * 0.45 + Math.random() * 0.4, ph: Math.random() * 6.28, layer };
    });

    this.retarget();
    this.alpha.rain = Math.min(this.alpha.rain, 0.2);
    this.alpha.snow = Math.min(this.alpha.snow, 0.2);
    this.alpha.clouds = Math.min(this.alpha.clouds, 0.35);
    this.nextBolt = performance.now() + rand(1500, 4000);
    this.nextShooting = performance.now() + rand(3000, 9000);
  }

  private retarget() {
    const s = this.scene!;
    const wet = WET.includes(s.kind);
    const heavy = s.kind === 'heavy-rain' || s.kind === 'thunder' || s.kind === 'overcast' || s.kind === 'fog' || s.kind === 'haze';
    this.target = {
      stars: this.stars.length ? 1 : 0,
      clouds: this.clouds.length ? 1 : 0,
      rain: this.drops.length ? 1 : 0,
      snow: this.flakes.length ? 1 : 0,
      fog: s.kind === 'fog' || s.kind === 'haze' ? 1 : 0,
      sun: s.isDay && s.sunProgress !== null ? (heavy || wet ? 0.25 : 1 - s.cloud * 0.55) : 0,
      moon: !s.isDay ? (heavy || wet ? 0.15 : 1 - s.cloud * 0.6) : 0,
    };
  }

  /** Is anything moving? If not, we can stop the loop entirely. */
  private animating() {
    const s = this.scene!;
    if (this.drops.length || this.flakes.length || this.stars.length || this.clouds.length || s.kind === 'thunder' || this.target.fog) return true;
    return (Object.keys(this.alpha) as (keyof typeof this.alpha)[]).some((k) => Math.abs(this.alpha[k] - this.target[k]) > 0.01);
  }

  private frame(now: number) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const s = this.scene!;
    const fast = (this.drops.length > 0 || this.flakes.length > 0 || s.kind === 'thunder') && !this.throttled;
    const interval = this.throttled ? 1000 / 20 : fast ? 0 : 1000 / 30;
    const elapsed = now - this.last;
    if (elapsed < interval - 1) return;
    this.last = now;

    const dt = Math.min(3, elapsed / 16.67);
    const ease = 1 - Math.pow(0.965, dt);
    (Object.keys(this.alpha) as (keyof typeof this.alpha)[]).forEach((key) => {
      this.alpha[key] = lerp(this.alpha[key], this.target[key], ease);
    });

    const t0 = performance.now();
    this.draw(dt, now);
    this.adapt(performance.now() - t0, elapsed);

    if (!this.animating()) {
      this.stop();
    }
  }

  /** Drop particle density if the device is struggling. */
  private adapt(drawMs: number, frameMs: number) {
    if (this.quality <= 0.4) return;
    this.sampleFrames++;
    if (drawMs > 8 || frameMs > 40) this.slowFrames++;
    if (this.sampleFrames >= 90) {
      if (this.slowFrames > 30) {
        this.quality = Math.max(0.4, this.quality * 0.65);
        this.populate();
      }
      this.sampleFrames = 0;
      this.slowFrames = 0;
    }
  }

  /** Bake the sun / moon glow into an offscreen layer; only rebuilt when it visibly changes. */
  private celestialLayer() {
    const s = this.scene!;
    const { w, h } = this;
    const p = s.sunProgress;
    const key = `${w}x${h}|${s.isDay}|${p !== null ? p.toFixed(2) : 'n'}|${s.moonPhase.toFixed(2)}|${s.southern}`;
    if (key === this.celestialKey && this.celestial) return this.celestial;
    this.celestialKey = key;
    const c = this.celestial ?? canvas2d(1, 1);
    // half resolution is plenty for glows
    c.width = Math.round(w * 0.5);
    c.height = Math.round(h * 0.5);
    const g = c.getContext('2d')!;
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.clearRect(0, 0, w, h);

    if (s.isDay && p !== null) {
      const x = w * (0.12 + 0.76 * p);
      const y = h * (0.3 - 0.2 * Math.sin(Math.PI * p));
      const low = 1 - Math.sin(Math.PI * p);
      const R = Math.max(w, h) * 0.55;
      const grad = g.createRadialGradient(x, y, 0, x, y, R);
      grad.addColorStop(0, `rgba(255,${Math.round(244 - low * 50)},${Math.round(214 - low * 110)},0.55)`);
      grad.addColorStop(0.12, `rgba(255,${Math.round(220 - low * 60)},${Math.round(150 - low * 80)},0.28)`);
      grad.addColorStop(0.45, 'rgba(255,200,120,0.07)');
      grad.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      const core = g.createRadialGradient(x, y, 0, x, y, 34);
      core.addColorStop(0, 'rgba(255,255,245,1)');
      core.addColorStop(0.5, 'rgba(255,248,220,0.85)');
      core.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = core;
      g.beginPath();
      g.arc(x, y, 34, 0, Math.PI * 2);
      g.fill();
    } else if (!s.isDay) {
      const r = Math.max(14, Math.min(w, h) * 0.045);
      const x = w * 0.8;
      const y = h * 0.13;
      const glow = g.createRadialGradient(x, y, r * 0.5, x, y, r * 7);
      glow.addColorStop(0, 'rgba(210,225,255,0.22)');
      glow.addColorStop(1, 'rgba(210,225,255,0)');
      g.fillStyle = glow;
      g.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
      g.fillStyle = 'rgba(200,210,230,0.08)';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      const lit = new Path2D(moonPath(s.moonPhase, x, y, r, s.southern));
      const mg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      mg.addColorStop(0, '#fbfdff');
      mg.addColorStop(1, '#cfd8e6');
      g.fillStyle = mg;
      g.fill(lit);
    }
    this.celestial = c;
    return c;
  }

  private draw(dt: number, now = performance.now()) {
    const s = this.scene;
    if (!s) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const par = Math.min(this.scroll, h * 2);

    // ---- stars (squares are much cheaper than arcs and look identical at this size)
    if (this.alpha.stars > 0.01 && this.stars.length) {
      ctx.fillStyle = '#fff';
      const t = now / 1000;
      const oy = -par * 0.04;
      for (const st of this.stars) {
        ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * st.sp + st.tw))) * this.alpha.stars;
        ctx.fillRect(st.x * w, st.y * h + oy, st.r, st.r);
      }
      ctx.globalAlpha = 1;

      if (dt > 0 && this.alpha.stars > 0.6 && s.cloud < 0.5 && !this.throttled) {
        if (!this.shooting && now > this.nextShooting) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          this.shooting = { x: rand(0.2, 0.8) * w, y: rand(0.05, 0.3) * h, vx: dir * rand(9, 13), vy: rand(3, 5), life: 1 };
          this.nextShooting = now + rand(9000, 18000);
        }
        if (this.shooting) {
          const sh = this.shooting;
          sh.x += sh.vx * dt;
          sh.y += sh.vy * dt;
          sh.life -= 0.022 * dt;
          const tail = 14;
          ctx.strokeStyle = `rgba(255,255,255,${0.85 * Math.max(0, sh.life)})`;
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * tail * 0.5, sh.y - sh.vy * tail * 0.5);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${0.3 * Math.max(0, sh.life)})`;
          ctx.beginPath();
          ctx.moveTo(sh.x - sh.vx * tail * 0.5, sh.y - sh.vy * tail * 0.5);
          ctx.lineTo(sh.x - sh.vx * tail, sh.y - sh.vy * tail);
          ctx.stroke();
          if (sh.life <= 0) this.shooting = null;
        }
      }
    }

    // ---- sun / moon (cached layer)
    const celA = s.isDay ? this.alpha.sun : this.alpha.moon;
    if (celA > 0.01) {
      ctx.globalAlpha = celA;
      ctx.drawImage(this.celestialLayer(), 0, -par * (s.isDay ? 0.15 : 0.12), w, h);
      ctx.globalAlpha = 1;
    }

    // ---- clouds
    if (this.alpha.clouds > 0.01 && this.sprites) {
      const set = this.sprites[this.cloudSet];
      const drift = 0.4 + Math.abs(s.wind) * 0.12;
      const dir = s.wind < 0 ? -1 : 1;
      const dim = s.isDay ? 1 : 0.55;
      for (const c of this.clouds) {
        const sp = set[c.sprite];
        const cw = sp.width * c.s;
        const ch = sp.height * c.s;
        c.x += c.v * drift * dir * dt;
        if (dir > 0 && c.x > w + 40) c.x = -cw - 40;
        if (dir < 0 && c.x < -cw - 40) c.x = w + 40;
        ctx.globalAlpha = c.a * this.alpha.clouds * dim;
        ctx.drawImage(sp, c.x, c.y - par * 0.1 * c.depth, cw, ch);
      }
      ctx.globalAlpha = 1;
    }

    // ---- fog bands (sprite blits)
    if (this.alpha.fog > 0.01 && this.sprites) {
      this.fogT += 0.002 * dt;
      ctx.globalAlpha = this.alpha.fog;
      for (let i = 0; i < 4; i++) {
        const y = h * (0.25 + i * 0.2);
        const x = Math.sin(this.fogT * (1 + i * 0.3) + i) * w * 0.15 + w / 2;
        ctx.drawImage(this.sprites.fog, x - w * 0.9, y - h * 0.25, w * 1.8, h * 0.5);
      }
      ctx.globalAlpha = 1;
    }

    // ---- rain (one path per depth layer)
    if (this.alpha.rain > 0.01 && this.drops.length) {
      const slant = Math.max(-0.45, Math.min(0.45, s.wind * 0.05));
      const styles = ['rgba(190,210,240,0.22)', 'rgba(200,220,250,0.34)', 'rgba(220,235,255,0.5)'];
      ctx.lineCap = 'butt';
      ctx.globalAlpha = this.alpha.rain;
      for (let layer = 0; layer < 3; layer++) {
        ctx.strokeStyle = styles[layer];
        ctx.lineWidth = 0.8 + layer * 0.35;
        ctx.beginPath();
        for (const d of this.drops) {
          if (d.layer !== layer) continue;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + slant * d.len, d.y + d.len);
          d.y += d.v * dt;
          d.x += slant * d.v * dt;
          if (d.y > h) {
            d.y = -d.len - Math.random() * 40;
            d.x = Math.random() * w * 1.2 - w * 0.1;
          }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ---- snow (squares for tiny flakes, arcs only for the near layer)
    if (this.alpha.snow > 0.01 && this.flakes.length) {
      const t = now / 1000;
      for (let layer = 0; layer < 3; layer++) {
        ctx.fillStyle = `rgba(255,255,255,${(0.45 + layer * 0.2) * this.alpha.snow})`;
        if (layer === 2) ctx.beginPath();
        for (const f of this.flakes) {
          if (f.layer !== layer) continue;
          const x = f.x + Math.sin(t * 0.8 + f.ph) * (6 + layer * 4);
          if (layer === 2) {
            ctx.moveTo(x + f.r, f.y);
            ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
          } else {
            ctx.fillRect(x - f.r, f.y - f.r, f.r * 2, f.r * 2);
          }
          f.y += f.v * dt;
          f.x += s.wind * 0.05 * dt;
          if (f.y > h + 5) {
            f.y = -5;
            f.x = Math.random() * w;
          }
          if (f.x > w + 10) f.x = -10;
          if (f.x < -10) f.x = w + 10;
        }
        if (layer === 2) ctx.fill();
      }
    }

    // ---- lightning
    if (s.kind === 'thunder' && dt > 0) {
      if (now > this.nextBolt) {
        this.flash = 1;
        this.nextBolt = now + rand(4500, 11000);
        if (Math.random() < 0.7) {
          const pts: [number, number][] = [];
          let x = rand(0.15, 0.85) * w;
          let y = 0;
          const end = rand(0.35, 0.6) * h;
          const branches: [number, number][][] = [];
          while (y < end) {
            pts.push([x, y]);
            y += rand(14, 30);
            x += rand(-22, 22);
            if (Math.random() < 0.14) {
              const b: [number, number][] = [[x, y]];
              let bx = x;
              let by = y;
              for (let i = 0; i < 5; i++) {
                bx += rand(-24, 24);
                by += rand(10, 22);
                b.push([bx, by]);
              }
              branches.push(b);
            }
          }
          this.bolt = { pts, branches, life: 1 };
        }
      }
      if (this.flash > 0.01) {
        ctx.fillStyle = `rgba(220,230,255,${this.flash * 0.2})`;
        ctx.fillRect(0, 0, w, h);
        this.flash *= Math.pow(0.86, dt);
        if (this.flash < 0.4 && this.flash > 0.3 && Math.random() < 0.15) this.flash = 0.7;
      }
      if (this.bolt) {
        const b = this.bolt;
        const path = (pts: [number, number][]) => {
          ctx.beginPath();
          pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.stroke();
        };
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(190,205,255,${0.25 * b.life})`;
        ctx.lineWidth = 7;
        path(b.pts);
        ctx.strokeStyle = `rgba(255,255,255,${0.95 * b.life})`;
        ctx.lineWidth = 1.8;
        path(b.pts);
        ctx.lineWidth = 1;
        b.branches.forEach(path);
        b.life -= 0.07 * dt;
        if (b.life <= 0) this.bolt = null;
      }
    }
  }
}
