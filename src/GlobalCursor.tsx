import { lazy, Suspense, useEffect, useState } from 'react';

const SplashCursor = lazy(() => import('@/SplashCursor'));
export function GlobalCursor({ entering }: { entering: boolean }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(finePointer.matches && !reduced.matches);
    sync(); finePointer.addEventListener('change', sync); reduced.addEventListener('change', sync);
    return () => { finePointer.removeEventListener('change', sync); reduced.removeEventListener('change', sync); };
  }, []);
  if (entering || !enabled) return null;
  return <Suspense fallback={null}>
    <SplashCursor COLOR="#9fcbd0" RAINBOW_MODE={false} SIM_RESOLUTION={96} DYE_RESOLUTION={640}
      PRESSURE_ITERATIONS={12} SPLAT_RADIUS={.12} SPLAT_FORCE={3500} DENSITY_DISSIPATION={5} />
  </Suspense>;
}
