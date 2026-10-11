import { useEffect, useState } from 'react';

// The HTML shell draws the mark before the React bundle is available.
export function useSiteEntrance() {
  const [entering, setEntering] = useState(() => Boolean(document.getElementById('site-entrance')));
  useEffect(() => {
    const overlay = document.getElementById('site-entrance');
    if (!overlay) { setEntering(false); return; }
    let disposed = false, finished = false;
    const timers: number[] = [];
    const cleanups: (() => void)[] = [];
    const delay = (ms: number) => new Promise<void>(resolve => timers.push(window.setTimeout(resolve, ms)));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const video = document.querySelector<HTMLVideoElement>('.hero-background-video');
    const videoReady = new Promise<void>(resolve => {
      if (!video || video.readyState >= 2 || video.error) { resolve(); return; }
      const finish = () => resolve();
      video.addEventListener('loadeddata', finish, { once: true });
      video.addEventListener('error', finish, { once: true });
      cleanups.push(() => { video.removeEventListener('loadeddata', finish); video.removeEventListener('error', finish); });
    });
    const motionReady = new Promise<void>(resolve => {
      if (window.gsap && window.ScrollTrigger || reduced || document.documentElement.dataset.motionCdn === 'failed') { resolve(); return; }
      const finish = () => resolve();
      window.addEventListener('alpine:motion-ready', finish, { once: true });
      window.addEventListener('alpine:motion-error', finish, { once: true });
      cleanups.push(() => { window.removeEventListener('alpine:motion-ready', finish); window.removeEventListener('alpine:motion-error', finish); });
    });
    const finish = () => {
      if (disposed || finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      overlay.remove();
      setEntering(false);
      window.ScrollTrigger?.refresh();
    };
    // Ready assets and the completed path draw both gate entry, with a bounded wait.
    void Promise.all([
      delay(reduced ? 0 : 1350),
      Promise.race([Promise.all([document.fonts.ready, videoReady, motionReady]), delay(3500)]),
    ]).then(() => {
      if (disposed) return;
      if (reduced) { finish(); return; }
      overlay.classList.add('is-leaving');
      const ended = (event: TransitionEvent) => { if (event.target === overlay && event.propertyName === 'opacity') finish(); };
      overlay.addEventListener('transitionend', ended);
      cleanups.push(() => overlay.removeEventListener('transitionend', ended));
      timers.push(window.setTimeout(finish, 750));
    });
    // The HTML fail-safe can remove the loader if any prerequisite is unavailable.
    const observer = new MutationObserver(() => { if (!overlay.isConnected) { setEntering(false); observer.disconnect(); } });
    observer.observe(document.body, { childList: true });
    return () => { disposed = true; timers.forEach(clearTimeout); cleanups.forEach(cleanup => cleanup()); observer.disconnect(); };
  }, []);
  return entering;
}
