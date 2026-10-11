import type { SignatureParticleDriver } from '@/SignatureParticles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORY_SCROLL_END, SCENE_DESTINATIONS, SIGNATURE_OFFSET, COLLECTION_OFFSET, STORY_MOTION, SCENE_HANDOFFS, SCENE_RENDER_WINDOWS, type SceneName } from '@/storyConfig';
import { BOARD_SCROLL, BOARD_SCROLL_STEPS, type SnowboardScrollDriver } from '@/snowboardConfig';

type Target = string | Element | Element[] | object;
type Vars = Record<string, unknown>;
type Tween = { kill: () => void };
type Timeline = Tween & {
  to: (target: Target, vars: Vars, position?: number) => Timeline;
  fromTo: (target: Target, from: Vars, to: Vars, position?: number) => Timeline;
};
type Runtime = {
  registerPlugin: (plugin: unknown) => void;
  set: (target: Target, vars: Vars) => void;
  to: (target: Target, vars: Vars) => Tween;
  timeline: (vars: Vars) => Timeline;
  context: (setup: () => void, scope: Element) => { revert: () => void };
};
declare global {
  interface Window {
    gsap?: Runtime;
    ScrollTrigger?: { refresh: () => void; config: (vars: Vars) => void; create: (vars: Vars) => Tween };
  }
}

export function useScrollStory() {
  const rootRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const signatureDriver = useRef<SignatureParticleDriver>({ progress: 0, render: null });
  const navigationTween = useRef<Tween | null>(null);
  const snowboardDriver = useRef<SnowboardScrollDriver>({ progress: 0, render: null });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [cdnFailed, setCdnFailed] = useState(document.documentElement.dataset.motionCdn === 'failed');
  const [ready, setReady] = useState(Boolean(window.gsap && window.ScrollTrigger));
  const [activeScene, setActiveScene] = useState(0);
  const [renderMask, setRenderMask] = useState(1);
  const staticLayout = reducedMotion || cdnFailed;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    const loaded = () => {
      if (window.gsap && window.ScrollTrigger) { setReady(true); setCdnFailed(false); }
      else setCdnFailed(true);
    };
    const failed = () => setCdnFailed(true);
    window.addEventListener('alpine:motion-ready', loaded);
    window.addEventListener('alpine:motion-error', failed);
    if (window.gsap && window.ScrollTrigger) loaded();
    // A blocked CDN must leave a usable document, rather than hidden panels.
    const timeout = window.setTimeout(() => {
      if (!window.gsap || !window.ScrollTrigger) failed();
    }, 10000);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('alpine:motion-ready', loaded);
      window.removeEventListener('alpine:motion-error', failed);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const gsap = window.gsap;
    const trigger = window.ScrollTrigger;
    if (!root || !ready || !gsap || !trigger || staticLayout) {
      progress.current = staticLayout ? STORY_SCROLL_END : 0;
      return;
    }
    gsap.registerPlugin(trigger);
    trigger.config({ ignoreMobileResize: true });
    let disposed = false;
    const context = gsap.context(() => {
      const first = root.querySelector('[data-scene="hero"]')!;
      const product = root.querySelector('[data-scene="goggles"]')!;
      const finalScene = root.querySelector('[data-scene="collection"]')!;
      const collection = root.querySelector<HTMLElement>('#collection')!;
      const signature = root.querySelector('[data-scene="signature"]')!;
      const snowboard = root.querySelector('[data-scene="snowboard"]')!;
      const time = (value: number) => value * .75;
      const collectionTime = (value: number) => time(value) + COLLECTION_OFFSET;
      const signatureTime = (value: number) => value + SIGNATURE_OFFSET;
      const heroTitle = root.querySelector<HTMLElement>('.hero-zoom-title')!;
      const portalLetter = heroTitle.querySelector<HTMLElement>('[data-hero-letter="G"]')!;
      // Resolve the letter aperture in the untransformed layout, including on refresh.
      // Zoom around the G counter rather than a stroke that would fill the screen white.
      const portal = () => {
        const x = portalLetter.offsetLeft + portalLetter.offsetWidth * .48;
        const y = heroTitle.offsetHeight * .49;
        return { x, y, shiftX: heroTitle.offsetWidth * .5 - x, shiftY: heroTitle.offsetHeight * .5 - y };
      };
      const productMotion = root.querySelector('.goggles-product-motion')!;
      const driver = { value: 0 };
      const boardClock = { value: 0 };
      let scene = -1, lastMask = -1;
      const audit = import.meta.env.DEV && new URLSearchParams(location.search).get('motion-audit') === '1';
      const updateScene = (value: number) => {
        progress.current = value;
        const boundary = SCENE_HANDOFFS.findIndex(handoff => value < handoff.switchAt);
        const next = boundary < 0 ? 4 : boundary;
        if (next !== scene) { scene = next; setActiveScene(next); }
        const mask = SCENE_RENDER_WINDOWS.reduce((result, [start, end], index) => value >= start && value <= end ? result | (1 << index) : result, 0);
        if (mask !== lastMask) { lastMask = mask; setRenderMask(mask); }
        if (audit) root.dataset.storyClock = value.toFixed(4);
      };
      const entryPose = { autoAlpha: 0, z: STORY_MOTION.depth, yPercent: STORY_MOTION.rise, scale: STORY_MOTION.scale, rotationX: STORY_MOTION.tilt, filter: 'none' };
      gsap.set(first, { autoAlpha: 1, z: 0, yPercent: 0, scale: 1, rotationX: 0, filter: 'none' });
      gsap.set([product, finalScene, signature, snowboard], entryPose);
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => updateScene(driver.value),
        scrollTrigger: {
          id: 'alpine-depth-story', trigger: root,
          start: 'top top', end: 'bottom bottom',
          scrub: STORY_MOTION.scrub, invalidateOnRefresh: true,
          onRefresh: () => updateScene(driver.value),

        },
      });
      // A single camera-like timeline: scroll down advances; scroll up reverses it.
      // Scene order: hero → goggles → snowboard chapters → signature → collection.
      timeline.to(driver, { value: STORY_SCROLL_END, duration: STORY_SCROLL_END }, 0)
        .fromTo(root.querySelector('.hero-background-video')!, { scale: 1 }, { scale: 1.24, duration: .245 }, 0)
        .fromTo(heroTitle, {
          scale: 1, x: 0, y: 0, force3D: false,
          transformOrigin: () => `${portal().x}px ${portal().y}px`,
        }, {
          scale: 38, x: () => portal().shiftX, y: () => portal().shiftY,
          duration: .245, ease: 'power2.in',
        }, 0)
        .to(root.querySelector('.hero-video-layer')!, { autoAlpha: 0, duration: .095, ease: 'power1.inOut' }, .14)
        .to(first, { autoAlpha: 0, duration: .055, ease: 'power1.inOut' }, SCENE_HANDOFFS[0].exit)
        .to(product, { z: 0, yPercent: 0, scale: 1, rotationX: 0, autoAlpha: 1, duration: .145, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[0].enter)
        .fromTo(root.querySelector('.goggles-title-first')!, { xPercent: 20, y: 40, autoAlpha: 0 }, { xPercent: 0, y: 0, autoAlpha: 1, duration: .085, ease: 'power2.out' }, .185)
        .fromTo(root.querySelector('.goggles-title-second')!, { xPercent: -16, y: 40, autoAlpha: 0 }, { xPercent: 0, y: 0, autoAlpha: 1, duration: .085, ease: 'power2.out' }, .195)
        .fromTo(productMotion, { y: 90, scale: .6, rotation: -9, autoAlpha: 0 }, { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: .1, ease: 'power2.out' }, .185)
        .fromTo(root.querySelector('.goggles-grid-background')!, { scale: 1.4, yPercent: 12 }, { scale: 1, yPercent: 0, duration: time(.2) }, time(.22))
        .fromTo(root.querySelector('.goggles-halo')!, { scale: .65, opacity: 0 }, { scale: 1, opacity: 1, duration: time(.19) }, time(.25))
        .fromTo(Array.from(root.querySelectorAll('.goggles-eyebrow, .goggles-description, .goggles-colour-panel, .goggles-bottom-actions')), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .055, stagger: .006 }, .245)
        .to(productMotion, { y: -12, rotation: 2, scale: 1.04, duration: time(.14) }, time(.44))
        .to(root.querySelector('.goggles-grid-background')!, { scale: 1.12, yPercent: -5, duration: time(.16) }, time(.43))
        .to(Array.from(root.querySelectorAll('.goggles-title span')), { y: -24, autoAlpha: 0, duration: .12, ease: 'power1.in' }, SCENE_HANDOFFS[1].exit)
        .to(product, { z: 260, scale: 1.12, rotationX: -2, autoAlpha: 0, duration: .18, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[1].exit)
        .to(finalScene, { z: 0, yPercent: 0, scale: 1, rotationX: 0, autoAlpha: 1, duration: .19, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[3].enter)
        .fromTo(collection.querySelector('h2')!, { xPercent: 0, y: 24, scale: .98, autoAlpha: 0 }, { xPercent: 0, y: 0, scale: 1, autoAlpha: 1, duration: time(.15) }, collectionTime(.67))
        .fromTo(collection.querySelector('.collection-table')!, { z: -120, rotationX: 3, scale: .97, transformPerspective: 1400 }, { z: 0, rotationX: 0, scale: 1, duration: time(.15) }, collectionTime(.71))
        .fromTo(collection.querySelector('.collection-background-type')!, { scale: 1.32, yPercent: 14, xPercent: 6 }, { scale: 1, yPercent: -5, xPercent: -3, duration: time(.37) }, collectionTime(.63))
        .to(collection.querySelector('h2')!, { y: -8, duration: time(.12) }, collectionTime(.88));
      collection.querySelectorAll('.collection-group').forEach((group, index) => {
        const position = collectionTime(.72 + index * .045);
        timeline.fromTo(group, { '--rule-alpha': 0 }, { '--rule-alpha': .16, duration: time(.09) }, position);
        timeline.fromTo(Array.from(group.querySelectorAll('span')), { y: 24, opacity: .1 }, { y: 0, opacity: 1, duration: time(.09), stagger: .003 }, position);
      });
      timeline
        .to(snowboard, { z: 0, scale: 1, yPercent: 0, rotationX: 0, autoAlpha: 1, duration: .18, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[1].enter)
        .fromTo(root.querySelector('.snowboard-heading')!, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, .4925)
        .fromTo(root.querySelector('.snowboard-drawing')!, { y: 60, scale: .8, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .14 }, .4925)
        .fromTo(root.querySelector('.snowboard-footer')!, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .08 }, .5625)
        .to(root.querySelector('.snowboard-drawing')!, { scale: 1.02, y: -8, duration: BOARD_SCROLL.end - BOARD_SCROLL.start }, BOARD_SCROLL.start)
        .to(snowboard, { z: -260, scale: .96, yPercent: -2, autoAlpha: 0, duration: .1875, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[2].exit)
        .to(signature, { z: 0, scale: 1, yPercent: 0, rotationX: 0, autoAlpha: 1, duration: .17, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[2].enter)
        .fromTo(Array.from(root.querySelectorAll('.signature-title span')), { y: 45, scale: .94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .085, stagger: .018 }, signatureTime(.77))
        .fromTo(signatureDriver.current, { progress: 0 }, { progress: 1, duration: .245, onUpdate: () => signatureDriver.current.render?.() }, signatureTime(.755))
        .to(Array.from(root.querySelectorAll('.signature-title span')), { y: -24, autoAlpha: 0, duration: .095, ease: 'power1.in' }, SCENE_HANDOFFS[3].exit)
        .to(signature, { z: -260, scale: .96, autoAlpha: 0, duration: .205, ease: STORY_MOTION.transitionEase }, SCENE_HANDOFFS[3].exit);
      let boardDirection = 1;
      gsap.to(boardClock, {
        value: 1, duration: 1, ease: 'none',
        onUpdate: () => {
          const state = snowboardDriver.current;
          state.progress = boardClock.value;
          state.render?.(boardClock.value);
        },
        scrollTrigger: {
          id: 'alpine-board-chapters', trigger: root,
          start: () => root.getBoundingClientRect().top + window.scrollY + (root.offsetHeight - window.innerHeight) * BOARD_SCROLL.start / STORY_SCROLL_END,
          end: () => root.getBoundingClientRect().top + window.scrollY + (root.offsetHeight - window.innerHeight) * BOARD_SCROLL.end / STORY_SCROLL_END, scrub: BOARD_SCROLL.scrub, invalidateOnRefresh: true,
          onUpdate: (self: { direction: number }) => { boardDirection = self.direction; },
          snap: {
            // Wait for this short scrub to settle before starting the chapter snap.
            // A boundary tolerance prevents rounded scroll pixels advancing a second chapter.
            inertia: false, directional: false, delay: BOARD_SCROLL.snapDelay,
            duration: BOARD_SCROLL.snapDuration, ease: 'power1.inOut',
            snapTo: (value: number) => {
              if (navigationTween.current) return value;
              const chapter = value * BOARD_SCROLL_STEPS.length;
              const nearest = Math.round(chapter);
              const boundary = Math.abs(chapter - nearest) < BOARD_SCROLL.boundaryTolerance ? nearest : boardDirection > 0 ? Math.ceil(chapter) : Math.floor(chapter);
              return Math.max(0, Math.min(BOARD_SCROLL_STEPS.length, boundary)) / BOARD_SCROLL_STEPS.length;
            },
          },
        },
      });
      updateScene(driver.value);
    }, root);
    void document.fonts.ready.then(() => { if (!disposed) trigger.refresh(); });
    return () => { disposed = true; navigationTween.current?.kill(); context.revert(); };
  }, [ready, staticLayout]);

  const goTo = useCallback((scene: SceneName) => {
    const root = rootRef.current;
    if (!root) return;
    const element = document.querySelector<HTMLElement>(`[data-scene="${scene}"]`)!;
    navigationTween.current?.kill();
    if (staticLayout) {
      element.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
    const start = root.getBoundingClientRect().top + window.scrollY;
    const destination = SCENE_DESTINATIONS[scene];
    const target = start + (destination / STORY_SCROLL_END) * Math.max(1, root.offsetHeight - window.innerHeight);
    const gsap = window.gsap;
    if (!gsap || !ready) { window.scrollTo({ top: target, behavior: 'instant' }); return; }
    const position = { value: window.scrollY };
    navigationTween.current = gsap.to(position, {
      value: target, duration: 1.1, ease: 'power3.inOut',
      onUpdate: () => window.scrollTo({ top: position.value, behavior: 'instant' }),
      onComplete: () => { navigationTween.current = null; },
    });
  }, [ready, staticLayout]);

  useEffect(() => {
    const cancel = () => { navigationTween.current?.kill(); navigationTween.current = null; };
    const key = (event: KeyboardEvent) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel(); };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown', key);
    return () => { cancel(); window.removeEventListener('wheel', cancel); window.removeEventListener('touchstart', cancel); window.removeEventListener('keydown', key); };
  }, []);

  useEffect(() => {
    if (!ready && !staticLayout) return;
    const openHash = () => {
      if (window.location.hash === '#goggles') goTo('goggles');
      else if (['#mountain', '#collection'].includes(window.location.hash)) goTo('collection');
      else if (window.location.hash === '#signature') goTo('signature');
      else if (window.location.hash === '#snowboard') goTo('snowboard');
      else if (window.location.hash === '#scene') goTo('hero');
    };
    const frame = requestAnimationFrame(openHash);
    window.addEventListener('hashchange', openHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', openHash); };
  }, [goTo, ready, staticLayout]);

  return { rootRef, progress, reducedMotion, staticLayout, activeScene, goTo, snowboardDriver, signatureDriver, renderMask };
}
