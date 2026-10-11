import { useEffect, useRef, type MutableRefObject } from 'react';

export type SignatureParticleDriver = { progress: number; render: (() => void) | null };

type Particle = { x: number; y: number; z: number; radius: number; glow: boolean; opacity: number };
const PARTICLE_STYLE = { count: 6500, mobileCount: 2700, background: '#07090b', light: '207,223,229', speed: .075 };

// Seeded volumetric strands keep the composition stable across resize and navigation.
function makeParticles(count: number): Particle[] {
  let seed = 314159;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(.0001, random()))) * Math.cos(random() * Math.PI * 2);
  return Array.from({ length: count }, (_, index) => {
    const u = random();
    const a = random() * Math.PI * 2;
    const r = (.14 + Math.sin(u * Math.PI) * .27) * Math.sqrt(random());
    const scattered = index > count * .94;
    return {
      x: scattered ? (random() - .5) * 2.5 : Math.sin(u * Math.PI * 4.6) * .28 + Math.cos(a) * r * 1.4,
      y: scattered ? (random() - .5) * 1.65 : (u - .5) * 1.3 + normal() * .105,
      z: scattered ? (random() - .5) * 1.25 : Math.sin(a) * r + normal() * .15,
      radius: 1.4 + Math.pow(random(), 2.5) * 6.5,
      glow: random() > .978,
      opacity: .38 + random() * .6,
    };
  });
}

function makeSprite(blur: number, glowing: boolean): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const context = sprite.getContext('2d')!;
  const gradient = context.createRadialGradient(29, 27, 1, 32, 32, 31);
  const rgb = glowing ? '239,253,255' : PARTICLE_STYLE.light;
  gradient.addColorStop(0, `rgba(${rgb},${glowing ? 1 : .82})`);
  gradient.addColorStop(blur ? .2 : .43, `rgba(${rgb},${glowing ? .92 : .7})`);
  gradient.addColorStop(blur ? .56 : .51, `rgba(${rgb},${glowing ? .22 : .05})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return sprite;
}

export function SignatureParticles({ active, reducedMotion, driver }: {
  active: boolean; reducedMotion: boolean; driver: MutableRefObject<SignatureParticleDriver>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const syncRef = useRef<(() => void) | null>(null);
  useEffect(() => { activeRef.current = active; syncRef.current?.(); }, [active]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    let particles = makeParticles(window.innerWidth < 768 ? PARTICLE_STYLE.mobileCount : PARTICLE_STYLE.count);
    const sprites = [makeSprite(0, false), makeSprite(1, false), makeSprite(1, true)];
    let width = 0, height = 0, dpr = 1, frame = 0, time = 0, previous = 0;
    let projected = particles.map(() => ({ x: 0, y: 0, z: 0, size: 0, alpha: 0, sprite: 0 }));
    const buckets: typeof projected[] = Array.from({ length: 24 }, () => []);
    const draw = () => {
      const progress = reducedMotion ? .65 : driver.current.progress;
      const angle = time * PARTICLE_STYLE.speed + progress * .75 - .35;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const scale = Math.min(width * .49, height * .7) * (1 + progress * .26);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = PARTICLE_STYLE.background;
      context.fillRect(0, 0, width, height);
      buckets.forEach(bucket => { bucket.length = 0; });
      particles.forEach((particle, index) => {
        const x = particle.x * cos + particle.z * sin;
        const z = particle.z * cos - particle.x * sin;
        const perspective = 2.2 / (2.2 - z);
        const item = projected[index];
        item.x = width * .47 + x * scale * perspective;
        item.y = height * .24 + (particle.y + Math.sin(time * .12 + particle.x * 3) * .015 - progress * .06) * scale * perspective;
        item.z = z;
        const blur = Math.abs(z - .12) > .36;
        item.size = particle.radius * perspective * Math.min(1.35, width / 1100 + .35) * (blur ? 2.25 : 1.55);
        item.alpha = particle.opacity * (z < -.2 ? .6 : 1) * (particle.glow ? 1 : .94);
        item.sprite = particle.glow ? 2 : blur ? 1 : 0;
        buckets[Math.max(0, Math.min(23, Math.floor((z + 1.2) * 10)))].push(item);
      });
      // Drawing distant particles first gives the cloud a solid, layered volume.
      for (const bucket of buckets) for (const point of bucket) {
        if (point.x + point.size < 0 || point.x - point.size > width || point.y + point.size < 0 || point.y - point.size > height) continue;
        context.globalAlpha = point.alpha;
        context.drawImage(sprites[point.sprite], point.x - point.size, point.y - point.size, point.size * 2, point.size * 2);
      }
      context.globalAlpha = 1;
    };
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const count = width < 768 ? PARTICLE_STYLE.mobileCount : PARTICLE_STYLE.count;
      if (particles.length !== count) {
        particles = makeParticles(count);
        projected = particles.map(() => ({ x: 0, y: 0, z: 0, size: 0, alpha: 0, sprite: 0 }));
      }
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      draw();
    };
    const tick = (now: number) => {
      frame = 0;
      if (!activeRef.current || document.hidden || reducedMotion) return;
      time += previous ? Math.min((now - previous) / 1000, .05) : 0;
      draw(); previous = now;
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); previous = 0;
      if (activeRef.current && !document.hidden && !reducedMotion) frame = requestAnimationFrame(tick);
    };
    syncRef.current = sync;
    document.addEventListener('visibilitychange', sync);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    driver.current.render = () => { if (!activeRef.current || reducedMotion) draw(); };
    resize();
    sync();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', sync); syncRef.current = null; driver.current.render = null; };
  }, [reducedMotion, driver]);
  return <canvas ref={canvasRef} className="signature-particles" aria-hidden="true" />;
}
