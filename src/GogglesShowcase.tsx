import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { W, H } from '@/gogglesPixels';
import { createGogglesPainter } from '@/gogglesPainter';
import { ArrowDown, Check, Plus, RotateCcw } from 'lucide-react';
const GridScan = lazy(() => import('./GridScan').then(module => ({ default: module.GridScan })));

const VIEWS = [
  // HQ revision: restored alpha edges and opaque branding; originals retained.
  { file: 'goggles-front-hq.png', label: 'front', crop: [62, 45, 1548, 852] },
  { file: 'goggles-quarter-hq.png', label: 'front quarter', crop: [52, 74, 1560, 795] },
  { file: 'goggles-left-hq.png', label: 'side', crop: [56, 130, 1581, 676] },
  { file: 'goggles-back-hq.png', label: 'back', crop: [102, 34, 1468, 872] },
  { file: 'goggles-opposite-hq.png', label: 'opposite quarter', crop: [63, 69, 1557, 810] },
];
const COLOURS = [
  { name: 'original', hex: '#efac94' },
  { name: 'glacier', hex: '#85d8e5' },
  { name: 'sunrise', hex: '#edba62' },
  { name: 'forest', hex: '#8ab793' },
  { name: 'smoke', hex: '#a1a6ad' },
];
type Finish = { hex: string; name: string };
const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
function cropView(image: HTMLImageElement, crop: number[]): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const [sx, sy, sw, sh] = crop;
  const scale = Math.min(1710 / sw, 960 / sh);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, sw, sh, (W - sw * scale) / 2, (H - sh * scale) / 2, sw * scale, sh * scale);
  return context.getImageData(0, 0, W, H);
}

export function GogglesShowcase({ active, rendering, onContinue }: { active: boolean; rendering: boolean; onContinue: () => void }) {
  const painterRef = useRef<ReturnType<typeof createGogglesPainter> | null>(null);
  const [views, setViews] = useState<number[]>([]);
  const [backgroundReady, setBackgroundReady] = useState(rendering);
  const [loadError, setLoadError] = useState(false);
  const [angle, setAngle] = useState(0);
  const [colour, setColour] = useState(COLOURS[0].hex);
  const [hexDraft, setHexDraft] = useState(COLOURS[0].hex);
  const [colourName, setColourName] = useState('original');
  const [paintedFinish, setPaintedFinish] = useState<Finish>({ hex: COLOURS[0].hex, name: 'original' });
  const [swapping, setSwapping] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const assemblyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const movement = useRef(0);
  const bodyCanvas = useRef<HTMLCanvasElement>(null);
  const lensCanvas = useRef<HTMLCanvasElement>(null);
  const dragPointer = useRef<number | null>(null);
  const dragDistance = useRef(0);
  const suppressClick = useRef(false);
  const swapEpoch = useRef(0);
  const swapRunning = useRef(false);
  const pendingFinish = useRef<Finish | null>(null);
  const selectedFinish = useRef<Finish>({ hex: COLOURS[0].hex, name: 'original' });
  const currentFinish = useRef(selectedFinish.current);
  const animations = useRef<Animation[]>([]);
  const frame = ((angle % VIEWS.length) + VIEWS.length) % VIEWS.length;
  const renderedFrame = exploded || assembling || swapping ? 0 : frame;

  useEffect(() => {
    if (rendering) setBackgroundReady(true);
  }, [rendering]);

  useEffect(() => {
    let cancelled = false;
    const painter = createGogglesPainter(); painterRef.current = painter;
    Promise.all(VIEWS.map((view, index) => new Promise<number>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        try { void painter.prepare(index, cropView(image, view.crop)).then(() => resolve(index), reject); }
        catch (error) { reject(error); }
      };
      image.onerror = reject;
      image.src = `${import.meta.env.BASE_URL}images/goggles/${view.file}`;
    }))).then(result => { if (!cancelled) setViews(result); }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; painterRef.current = null; painter.dispose(); };
  }, []);

  useEffect(() => {
    if (!views.length || !painterRef.current) return;
    let cancelled = false;
    void painterRef.current.paint(renderedFrame, paintedFinish.hex, paintedFinish.name === 'original').then(painted => {
      if (cancelled) return;
      bodyCanvas.current?.getContext('2d')?.putImageData(painted.body, 0, 0);
      lensCanvas.current?.getContext('2d')?.putImageData(painted.lens, 0, 0);
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [views, renderedFrame, paintedFinish]);

  useEffect(() => {
    if (!active) {
      lastPointer.current = null; dragPointer.current = null;
      swapEpoch.current++; animations.current.forEach(animation => animation.cancel());
      animations.current = []; pendingFinish.current = null; swapRunning.current = false;
      currentFinish.current = selectedFinish.current;
      setPaintedFinish(selectedFinish.current); setSwapping(false); setGrabbing(false);
      if (assemblyTimer.current) clearTimeout(assemblyTimer.current);
      assemblyTimer.current = null; setAssembling(false);
    }
  }, [active]);
  useEffect(() => () => {
    swapEpoch.current++; animations.current.forEach(animation => animation.cancel());
    if (assemblyTimer.current) clearTimeout(assemblyTimer.current);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finishImmediately = () => {
      if (!motion.matches) return;
      swapEpoch.current++; animations.current.forEach(animation => animation.cancel());
      animations.current = []; pendingFinish.current = null; swapRunning.current = false;
      currentFinish.current = selectedFinish.current;
      setPaintedFinish(selectedFinish.current); setSwapping(false);
      if (assemblyTimer.current) clearTimeout(assemblyTimer.current);
      assemblyTimer.current = null; setAssembling(false);
    };
    motion.addEventListener('change', finishImmediately);
    return () => motion.removeEventListener('change', finishImmediately);
  }, []);

  const rotate = (event: PointerEvent<HTMLDivElement>) => {
    if (exploded || assembling || swapping || !active || (event.pointerType !== 'mouse' && dragPointer.current !== event.pointerId)) return;
    const previous = lastPointer.current;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    if (!previous) return;
    const dx = event.clientX - previous.x; const dy = event.clientY - previous.y;
    if (dragPointer.current === event.pointerId) dragDistance.current += Math.hypot(dx, dy);
    const delta = event.pointerType !== 'mouse' || Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    movement.current += delta;
    const step = 52;
    const steps = Math.trunc(movement.current / step);
    if (steps) { setAngle(value => value + steps); movement.current -= steps * step; }
  };
  // Throw the old lens off the left edge, then magnetically seat its replacement.
  // Rapid selections coalesce to the latest finish; leaving the scene cancels safely.
  const swapLens = async (finish: Finish) => {
    const epoch = ++swapEpoch.current;
    if (assemblyTimer.current) clearTimeout(assemblyTimer.current);
    assemblyTimer.current = null; setAssembling(false);
    swapRunning.current = true; setSwapping(true); setExploded(false); setAngle(0);
    try {
      const preparedFinish = painterRef.current?.paint(0, finish.hex, finish.name === 'original');
      await nextPaint();
      if (epoch !== swapEpoch.current) return;
      const lens = lensCanvas.current;
      if (!lens || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        currentFinish.current = finish; setPaintedFinish(finish);
        return;
      }
      const distance = window.innerWidth + lens.getBoundingClientRect().width;
      const outgoing = lens.animate([
        { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1, offset: 0 },
        { transform: 'translate3d(25px,-28px,0) rotate(-7deg) scale(1.03)', opacity: 1, offset: .22 },
        { transform: `translate3d(-${distance}px,-100px,0) rotate(-38deg) scale(.8)`, opacity: 0, offset: 1 },
      ], { duration: 430, easing: 'cubic-bezier(.55,0,.85,.35)', fill: 'forwards' });
      animations.current = [outgoing];
      await outgoing.finished;
      if (epoch !== swapEpoch.current) return;
      // Finish pixel preparation while the old lens flies out, before magnetically seating the new one.
      await preparedFinish;
      if (epoch !== swapEpoch.current) return;
      currentFinish.current = finish; setPaintedFinish(finish);
      await nextPaint();
      if (epoch !== swapEpoch.current) return;
      const incoming = lens.animate([
        { transform: `translate3d(${distance}px,-90px,0) rotate(16deg) scale(.78)`, opacity: 0, offset: 0 },
        { transform: 'translate3d(32px,-18px,0) rotate(2deg) scale(1.04)', opacity: 1, offset: .62 },
        { transform: 'translate3d(-5px,3px,0) rotate(-.5deg) scale(.985)', opacity: 1, offset: .82 },
        { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1, offset: 1 },
      ], { duration: 670, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      animations.current = [incoming]; outgoing.cancel();
      await incoming.finished; incoming.cancel(); animations.current = [];
    } catch { /* Cancellation when navigating away is intentional. */ }
    finally {
      if (epoch === swapEpoch.current) {
        swapRunning.current = false; setSwapping(false);
        const pending = pendingFinish.current; pendingFinish.current = null;
        if (pending && (pending.hex !== currentFinish.current.hex || pending.name !== currentFinish.current.name)) void swapLens(pending);
      }
    }
  };
  const setFinish = (hex: string, name: string) => {
    const finish = { hex, name };
    selectedFinish.current = finish; setColour(hex); setHexDraft(hex); setColourName(name);
    if (!views.length) { currentFinish.current = finish; setPaintedFinish(finish); return; }
    if (swapRunning.current) { pendingFinish.current = finish; return; }
    if (hex !== currentFinish.current.hex || name !== currentFinish.current.name) void swapLens(finish);
  };
  // Keep the wide stage visible while both sides travel back to the centre.
  const closeAssembly = () => {
    if (swapping || assembling || !exploded) return;
    setExploded(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAssembling(true);
    assemblyTimer.current = setTimeout(() => { setAssembling(false); assemblyTimer.current = null; }, 680);
  };
  const toggleAssembly = () => {
    if (swapping || assembling || !views.length) return;
    setAngle(0); movement.current = 0;
    if (exploded) closeAssembly(); else setExploded(true);
  };
  const tabIndex = active ? 0 : -1;

  return <section id="goggles" aria-label="ski goggles product explorer" className={`goggles-showcase relative h-screen w-full overflow-hidden bg-black text-white ${exploded || assembling ? 'is-inspecting' : ''} ${assembling ? 'is-reassembling' : ''} ${swapping ? 'is-swapping' : ''}`}>
    <div className="goggles-grid-background" aria-hidden="true">
      {backgroundReady && <Suspense fallback={null}><GridScan active={rendering} sensitivity={.55} lineThickness={1} linesColor="#2F293A" gridScale={.1} scanColor="#FF9FFC" scanOpacity={.4} bloomIntensity={.6} chromaticAberration={.002} noiseIntensity={.01} /></Suspense>}
    </div>
    <div className="goggles-grid-shade" aria-hidden="true" />
    <div className="goggles-halo" aria-hidden="true" />
    <div className="goggles-eyebrow">alpine vision <span>/</span> a closer look</div>
    {/* Typography revision: two offset lines following the supplied reference. */}
    <h2 className="goggles-title hero-title" aria-label="Less burden, more freedom">
      <span className="goggles-title-first">Less burden,</span>
      <span className="goggles-title-second">more freedom</span>
    </h2>
    <p className="goggles-description">from first light to the last lift.<br />find your focus. make every turn yours.</p>

    <div className={`goggles-product ${grabbing ? 'is-grabbing' : ''}`} role="button" aria-label={exploded ? 'reassemble goggles' : 'rotate or disassemble goggles'} aria-expanded={exploded} aria-busy={swapping || assembling} tabIndex={tabIndex}
      onPointerEnter={event => { lastPointer.current = { x: event.clientX, y: event.clientY }; }}
      onPointerMove={rotate}
      onPointerLeave={() => { if (dragPointer.current === null) lastPointer.current = null; }}
      onPointerDown={event => { dragPointer.current = event.pointerId; dragDistance.current = 0; suppressClick.current = false; setGrabbing(true); lastPointer.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerUp={event => { if (dragPointer.current === event.pointerId) { suppressClick.current = dragDistance.current > 10; dragPointer.current = null; setGrabbing(false); } }}
      onPointerCancel={() => { suppressClick.current = true; dragPointer.current = null; lastPointer.current = null; setGrabbing(false); }}
      onClick={() => { if (!suppressClick.current) toggleAssembly(); suppressClick.current = false; }}
      onKeyDown={event => {
        if (['Enter', ' '].includes(event.key)) { event.preventDefault(); toggleAssembly(); }
        else if (event.key === 'Escape') closeAssembly();
        else if (!exploded && !assembling && !swapping && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setAngle(value => value + (event.key === 'ArrowRight' ? 1 : -1)); }
      }}>
      <div className="goggles-product-motion"><div className={`goggles-assembly ${exploded ? 'is-exploded' : ''}`}>
        <canvas ref={bodyCanvas} width={W} height={H} className="goggles-body" aria-hidden="true" />
        <img src={`${import.meta.env.BASE_URL}images/goggles/goggles-frame-component.png`} className="goggles-separated-frame" alt="" aria-hidden="true" draggable={false} />
        <img src={`${import.meta.env.BASE_URL}images/goggles/goggles-strap-component.png`} className="goggles-separated-strap" alt="" aria-hidden="true" draggable={false} />
        <canvas ref={lensCanvas} width={W} height={H} className="goggles-lens" aria-hidden="true" />
        {exploded && <div className="goggles-component-labels" aria-hidden="true"><span>lens</span><span>frame</span><span>strap</span></div>}
      </div></div>
      {!views.length && <div className="goggles-loading" role="status">{loadError ? 'the views could not load. please refresh.' : 'preparing your view…'}</div>}
      <span className="sr-only">{exploded ? 'Front view: lens on the left, frame in the centre, strap on the right. Click to reassemble.' : `${VIEWS[frame].label} view. Move your pointer or swipe to rotate. Click to separate the three components.`}</span>
    </div>

    <span className="sr-only" aria-live="polite">{swapping ? 'changing lens' : assembling ? 'reassembling goggles' : exploded ? 'lens, frame and strap separated' : `${colourName} lens installed`}</span>

    <div className="goggles-colour-panel">
      <div className="goggles-colour-heading"><span>your lens. your light.</span><span>{colourName}</span></div>
      <div className="goggles-colours" role="group" aria-label="lens colour">
        {COLOURS.map(choice => <button key={choice.name} type="button" tabIndex={tabIndex} aria-label={`${choice.name} lens`} aria-pressed={colourName === choice.name} onClick={() => setFinish(choice.hex, choice.name)} style={{ '--swatch': choice.hex } as CSSProperties}>{colourName === choice.name && <Check size={15} />}</button>)}
        <label className={`goggles-custom-colour ${colourName === 'custom' ? 'is-selected' : ''}`} title="choose any colour">
          <span aria-hidden="true">+</span>
          <input type="color" value={colour} tabIndex={tabIndex} aria-label="choose any lens colour" onChange={event => setFinish(event.target.value, 'custom')} />
        </label>
      </div>
      <label className="goggles-hex"><span>custom colour</span><input aria-label="custom lens hex colour" value={hexDraft} maxLength={7} tabIndex={tabIndex} spellCheck={false} onBlur={() => setHexDraft(colour)} onChange={event => { const value = event.target.value; setHexDraft(value); if (/^#[0-9a-f]{6}$/i.test(value)) setFinish(value, 'custom'); }} /></label>
    </div>

    <div className="goggles-bottom-actions">
      <button type="button" tabIndex={tabIndex} className="goggles-inspect-button" aria-pressed={exploded} disabled={swapping || assembling || !views.length} onClick={toggleAssembly}>{exploded || assembling ? <RotateCcw size={15} /> : <Plus size={15} />}{assembling ? 'reassembling…' : exploded ? 'reassemble' : 'take a closer look'}</button>
      <button type="button" tabIndex={tabIndex} className="goggles-next" aria-label="explore snowboard engineering" onClick={onContinue}><ArrowDown size={18} /></button>
    </div>
  </section>;
}
