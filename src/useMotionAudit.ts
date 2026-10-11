import { useEffect, type RefObject } from 'react';

// Development-only, opt-in diagnostics; never mounted in production or regular visits.
export function useMotionAudit(rootRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!import.meta.env.DEV || new URLSearchParams(location.search).get('motion-audit') !== '1') return;
    const root = rootRef.current;
    if (!root) return;
    const report = document.createElement('output');
    report.id = 'motion-audit'; report.hidden = true;
    root.appendChild(report);
    const entries: Record<string, { frames: number; total: number; slow: number; max: number; recent: number[]; moving: number[] }> = {};
    let previous = 0, frame = 0, publish = 0, previousClock = 0;
    const tick = (now: number) => {
      const current = root.querySelector<HTMLElement>('[data-scene][aria-hidden="false"]')?.dataset.scene || 'transition';
      const bucket = entries[current] ||= { frames: 0, total: 0, slow: 0, max: 0, recent: [], moving: [] };
      const clock = Number(root.dataset.storyClock || 0);
      if (previous && !document.hidden) {
        const elapsed = now - previous;
        bucket.frames++; bucket.total += elapsed; bucket.slow += Number(elapsed > 50); bucket.max = Math.max(bucket.max, elapsed);
        if (Math.abs(clock - previousClock) > .00005) { bucket.moving.push(elapsed); if (bucket.moving.length > 600) bucket.moving.shift(); }
        bucket.recent.push(elapsed); if (bucket.recent.length > 300) bucket.recent.shift();
      }
      previousClock = clock;
      previous = document.hidden ? 0 : now;
      if (now - publish > 1000) {
        publish = now;
        const result = Object.fromEntries(Object.entries(entries).map(([name, b]) => {
          const sorted = [...b.recent].sort((a, c) => a - c);
          const moving = [...b.moving].sort((a, c) => a - c);
          return [name, { frames: b.frames, fps: +(b.frames * 1000 / b.total).toFixed(1), over50MsPercent: +(b.slow / b.frames * 100).toFixed(1), maxMs: +b.max.toFixed(1), recentP95Ms: +(sorted[Math.floor(sorted.length * .95)] || 0).toFixed(1), movingFrames: moving.length, movingP95Ms: +(moving[Math.floor(moving.length * .95)] || 0).toFixed(1) }];
        }));
        report.textContent = JSON.stringify(result);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); report.remove(); };
  }, [rootRef]);
}
