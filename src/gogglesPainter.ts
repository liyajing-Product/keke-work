import { preparePixels, paintPixels, type PreparedView } from './gogglesPixels';
type PaintedView = { body: ImageData; lens: ImageData };

// Pixel isolation and recolouring retain full 1920px detail without blocking scroll/GSAP.
export function createGogglesPainter() {
  let worker: Worker | null = null;
  try { worker = new Worker(new URL('./gogglesPixelWorker.ts', import.meta.url), { type: 'module' }); } catch { /* CPU fallback for restricted browsers. */ }
  let requestId = 0, disposed = false;
  const pending = new Map<number, { resolve: (value: PaintedView) => void; reject: (reason: unknown) => void }>();
  const fallbackViews = new Map<number, PreparedView>();
  const cache = new Map<string, Promise<PaintedView>>();
  if (worker) {
    worker.onmessage = ({ data }) => {
      const promise = pending.get(data.requestId); pending.delete(data.requestId);
      if (data.error) promise?.reject(new Error(data.error)); else promise?.resolve(data);
    };
    worker.onerror = () => { pending.forEach(promise => promise.reject(new Error('Product pixel worker failed'))); pending.clear(); };
  }
  const request = (data: object, transfer: Transferable[] = []) => new Promise<PaintedView>((resolve, reject) => {
    if (disposed || !worker) { reject(new Error('Product painter is unavailable')); return; }
    const id = ++requestId; pending.set(id, { resolve, reject });
    worker.postMessage({ ...data, requestId: id }, transfer);
  });
  return {
    async prepare(viewId: number, base: ImageData) {
      if (worker) await request({ kind: 'prepare', viewId, base }, [base.data.buffer]);
      else fallbackViews.set(viewId, preparePixels(base));
    },
    paint(viewId: number, hex: string, original: boolean): Promise<PaintedView> {
      const key = `${viewId}/${original ? 'original' : hex}`;
      const cached = cache.get(key); if (cached) return cached;
      const promise = worker ? request({ kind: 'paint', viewId, hex, original }) : Promise.resolve(paintPixels(fallbackViews.get(viewId)!, hex, original));
      cache.set(key, promise);
      // Bound retained high-resolution buffers, including custom colour selections.
      if (cache.size > 5) cache.delete(cache.keys().next().value!);
      void promise.catch(() => cache.delete(key));
      return promise;
    },
    dispose() {
      disposed = true; worker?.terminate();
      pending.forEach(promise => promise.reject(new Error('Product painter disposed')));
      pending.clear(); cache.clear(); fallbackViews.clear();
    },
  };
}
