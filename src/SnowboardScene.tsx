import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type MutableRefObject } from 'react';
import { createTimeline, stagger, svg } from 'animejs';
import LightRays from '@/LightRays';
import { BOARD_PALETTE, BOARD_SCROLL, BOARD_PARTS, BINDING_PARTS, BOARD_LABELS, BOARD_SCROLL_STEPS, BOARD_SCROLL_DURATION, BOARD_SPREAD_STEPS, boardRestOffset, type SnowboardScrollDriver } from '@/snowboardConfig';

const PROFILE = 'M-500 0 C-500-70-450-105-380-100 C-150-80-80-68 0-70 C80-68 150-80 380-100 C450-105 500-70 500 0 C500 70 450 105 380 100 C150 80 80 68 0 70 C-80 68-150 80-380 100 C-450 105-500 70-500 0Z';
const PLANE = 'matrix(1 -.045 .38 .24 700 610)';
const INSERTS = Array.from({ length: 8 }, (_: unknown, i = 0) => {
  const x = -90 + Math.floor(i / 2) * 60;
  const y = i % 2 ? 30 : -30;
  return { x, y, px: 700 + x + .38 * y, py: 610 - .045 * x + .24 * y };
});

function Part({ id, children }: { id: string; children: ReactNode }) {
  const pose = [...BOARD_PARTS, ...BINDING_PARTS].find(part => part.id === id)!;
  const style = { '--explode-x': `${pose.x}px`, '--explode-y': `${pose.y}px`, '--explode-angle': `${pose.rotate}deg` } as CSSProperties;
  const fullSizePart = BOARD_PARTS.some(part => part.id === id);
  return <g id={`stack-${id}`}><g id={id} className="board-part" style={style}>
    {fullSizePart ? <g transform="translate(925 610) scale(1.6) translate(-700 -610)">{children}</g> : children}
  </g></g>;
}

function BoardPlane({ children, offset = 0 }: { children: ReactNode; offset?: number }) {
  return <g transform={`translate(0 ${offset})`}><g transform={PLANE}>{children}</g></g>;
}

export function SnowboardScene({ driver, reducedMotion, active }: { driver: MutableRefObject<SnowboardScrollDriver>; reducedMotion: boolean; active: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState({ count: 0, name: 'complete board' });

  useLayoutEffect(() => {
    if (reducedMotion || !rootRef.current) return;
    const root = rootRef.current;
    const drawing = root.querySelector<SVGSVGElement>('.snowboard-drawing > svg')!;
    const labels = Array.from(root.querySelectorAll<SVGGElement>('.board-label'));
    const transport = [...new Set(BOARD_SPREAD_STEPS.flatMap(spread => spread.ids))].map(id => ({ id, element: root.querySelector<SVGGElement>(`#stack-${id}`)! }));
    // Anime owns the SVG transforms; GSAP's scrubbed camera clock only seeks it.
    // No timer, autoplay, repeat or wheel interception: reversing scroll reverses every pose.
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'inOutSine' } });
    BOARD_SCROLL_STEPS.forEach((step, index) => {
      const start = index * BOARD_SCROLL.chapter + BOARD_SCROLL.lead;
      step.ids.forEach(id => {
        const pose = BOARD_PARTS.find(part => part.id === id)!;
        tl.add(root.querySelector(`#${id}`)!, {
          x: [0, pose.x], y: [0, pose.y - boardRestOffset(id, index)], rotate: [0, pose.rotate],
          duration: BOARD_SCROLL.move,
        }, start);
      });
      if (step.name === 'screws') {
        tl.add(Array.from(root.querySelectorAll('.board-screw')), {
          y: [0, -BOARD_SCROLL.screwLift], rotate: [0, -BOARD_SCROLL.screwTurn], duration: BOARD_SCROLL.screwMove,
        }, stagger(BOARD_SCROLL.screwStagger, { start }));
      }
      if (step.name === 'binding') {
        BINDING_PARTS.forEach((pose, child) => {
          tl.add(root.querySelector(`#${pose.id}`)!, {
            x: [0, pose.x], y: [0, pose.y], rotate: [0, pose.rotate],
            duration: BOARD_SCROLL.move - BOARD_SCROLL.bindingDelay - BOARD_SCROLL.bindingStagger * 2,
          }, start + BOARD_SCROLL.bindingDelay + child * BOARD_SCROLL.bindingStagger);
        });
      }
      step.labels.forEach(labelIndex => {
        const label = labels[labelIndex];
        const leader = svg.createDrawable(label.querySelector('.board-leader')!);
        tl.add(label, { opacity: [0, 1], duration: BOARD_SCROLL.label, ease: 'outQuad' }, start + BOARD_SCROLL.move)
          .add(leader, { draw: ['0 0', '0 1'], duration: BOARD_SCROLL.label, ease: 'outQuad' }, '<<');
      });
    });
    // Includes a settled hold at every chapter end, including the final exploded view.
    tl.add({ duration: BOARD_SCROLL_DURATION - tl.duration }, '<');
    const state = driver.current;
    let previousChapter = -1;
    let narrow = root.clientWidth < 768;
    const render = (progress: number) => {
      const normalized = Math.max(0, Math.min(1, progress));
      const time = normalized * BOARD_SCROLL_DURATION;
      tl.seek(time, true);
      // Start with a close view of the complete board. Open the camera as the
      // stack spreads; only the framing changes, never the SVG proportions.
      const framing = Math.min(1, normalized / .8);
      const camera = .5 - .5 * Math.cos(Math.PI * framing);

      drawing.setAttribute('viewBox', `${narrow ? 50 : 50 - 50 * camera} ${180 - 270 * camera} ${narrow ? 1750 : 1750 + 350 * camera} ${880 + 660 * camera}`);
      // Keep stack transport on a separate wrapper. A single position function
      // is exact when seeking backwards or skipping chapters, without competing
      // replacement tweens on a part's y property.
      transport.forEach(({ id, element }) => {
        let offset = 0;
        BOARD_SPREAD_STEPS.forEach(spread => {
          if (!spread.ids.includes(id)) return;
          const start = spread.chapter * BOARD_SCROLL.chapter + BOARD_SCROLL.lead;
          const amount = Math.max(0, Math.min(1, (time - start) / BOARD_SCROLL.move));
          const eased = .5 - .5 * Math.cos(Math.PI * amount);
          offset += (spread.y - boardRestOffset(id, spread.chapter)) * eased;
        });
        element.setAttribute('transform', `translate(0 ${offset})`);
      });
      const count = Math.min(BOARD_SCROLL_STEPS.length, Math.max(0, Math.ceil((time - BOARD_SCROLL.lead) / BOARD_SCROLL.chapter)));
      if (count !== previousChapter) {
        previousChapter = count;
        setChapter({ count, name: count === 0 ? 'complete board' : BOARD_SCROLL_STEPS[count - 1].name });
      }
    };
    state.render = render;
    render(state.progress);
    const resize = () => { narrow = root.clientWidth < 768; render(state.progress); };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); if (state.render === render) state.render = null; tl.revert(); transport.forEach(({ element }) => element.removeAttribute('transform')); drawing.setAttribute('viewBox', '0 -90 2100 1540'); };
  }, [driver, reducedMotion]);

  const palette = { '--board-background': BOARD_PALETTE.background, '--board-accent': BOARD_PALETTE.accent, '--board-line': BOARD_PALETTE.line, '--board-surface': BOARD_PALETTE.surface, '--board-muted': BOARD_PALETTE.muted } as CSSProperties;

  return <section ref={rootRef} id="snowboard" aria-labelledby="snowboard-title" className={`snowboard-scene ${reducedMotion ? 'is-reduced' : ''}`} style={palette}>
    <div className="snowboard-light-background" aria-hidden="true">
      <LightRays active={active} reducedMotion={reducedMotion} raysOrigin="top-center" raysColor={BOARD_PALETTE.accent} raysSpeed={.55} lightSpread={1.1} rayLength={2.4} fadeDistance={1.4} followMouse mouseInfluence={.08} noiseAmount={.04} distortion={.015} />
    </div>
    <div className="snowboard-light-shade" aria-hidden="true" />
    <header className="snowboard-heading">
      <div><p className="snowboard-eyebrow">alpine engineering / inside the ride</p><h2 id="snowboard-title" className="alpine-display">BUILT FROM<br />WITHIN.</h2></div>
      <p className="snowboard-description">Every layer. A purpose.<br />One board. Your own line.</p>
    </header>
    <figure className="snowboard-figure">
      <div className="snowboard-drawing">
        <svg viewBox="0 -90 2100 1540" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="board-svg-title board-svg-desc">
          <title id="board-svg-title">Snowboard engineering exploded view</title>
          <desc id="board-svg-desc">A horizontal snowboard separates into a sintered PE base, two steel edges, lower laminate, wood core, upper laminate, sidewall, top sheet, eight threaded inserts, eight screws, and one binding with baseplate, highback and straps. Parts reassemble in reverse order.</desc>
          <defs>
            <path id="board-profile" d={PROFILE} />
            <clipPath id="board-profile-clip"><use href="#board-profile" /></clipPath>
            <pattern id="board-carbon" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L18 0M-9 9L9-9M9 27L27 9" className="board-texture" /></pattern>
          </defs>
          <g className="board-reference" aria-hidden="true">
            <path d="M110 1415H1740M110 1404V1426M1740 1404V1426" />
            <text x="925" y="1440" textAnchor="middle">longitudinal section / twin directional</text>
          </g>
          <g className="board-floating">
            <Part id="part-base"><BoardPlane offset={14}><use href="#board-profile" className="board-base" /><path d="M-365 0H365" className="board-detail" /><text x="-420" y="20" className="board-brand">ALPINE°</text></BoardPlane></Part>
            <g id="part-edges">
              <Part id="part-edge-left"><BoardPlane offset={10}><path d="M-500 0C-500-70-450-105-380-100C-150-80-80-68 0-70C80-68 150-80 380-100C450-105 500-70 500 0" className="board-edge" /></BoardPlane></Part>
              <Part id="part-edge-right"><BoardPlane offset={10}><path d="M-500 0C-500 70-450 105-380 100C-150 80-80 68 0 70C80 68 150 80 380 100C450 105 500 70 500 0" className="board-edge" /></BoardPlane></Part>
            </g>
            <Part id="part-lower-fiber"><BoardPlane offset={7}><use href="#board-profile" className="board-laminate" /><use href="#board-profile" fill="url(#board-carbon)" /></BoardPlane></Part>
            <Part id="part-core"><BoardPlane>
              <use href="#board-profile" className="board-core" />
              <g clipPath="url(#board-profile-clip)" className="board-grain">{Array.from({ length: 14 }, (_: unknown, i = 0) => <path key={i} d={`M-510 ${-100 + i * 15} C-280 ${-125 + i * 15} -40 ${-65 + i * 15} 170 ${-95 + i * 15} S410 ${-125 + i * 15} 510 ${-100 + i * 15}`} />)}<path d="M-420-80C-380-15-350 15-305 65M250-75C275-40 280 15 330 70" /></g>
              {INSERTS.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="9" className="board-hole" />)}
            </BoardPlane></Part>
            <Part id="part-upper-fiber"><BoardPlane offset={-5}><use href="#board-profile" className="board-laminate" /><use href="#board-profile" fill="url(#board-carbon)" /></BoardPlane></Part>
            <Part id="part-sidewall"><BoardPlane offset={-8}><use href="#board-profile" className="board-sidewall" /><g transform="scale(.974 .88)"><use href="#board-profile" className="board-sidewall-inner" /></g></BoardPlane></Part>
            <Part id="part-top-sheet"><BoardPlane offset={-13}>
              <use href="#board-profile" className="board-top" />
              <g clipPath="url(#board-profile-clip)" className="board-top-art"><path d="M-455 65L-355-75-280 20-230-35-145 75M190 80L290-70 345 0 385-45 455 70" /><path d="M-325-50L-305-25-280 20M290-70L305-18 326-5" /></g>
              <text x="-130" y="18" className="board-brand">ALPINE°</text>
              {INSERTS.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="5" className="board-hole" />)}
            </BoardPlane></Part>
            <Part id="part-inserts">{INSERTS.map((point, i) => <g key={i} transform={`translate(${point.px} ${point.py - 8})`} className="board-metal">
              <path d="M-7-4V8C-7 13 7 13 7 8V-4" /><ellipse cx="0" cy="-4" rx="7" ry="3.5" /><ellipse cx="0" cy="-4" rx="3" ry="1.5" /><path d="M-7 2Q0 7 7 2M-7 6Q0 11 7 6" />
            </g>)}</Part>
            <Part id="part-binding">
              <Part id="binding-baseplate"><BoardPlane offset={-20}><path d="M-120-55Q-130 0-110 55H120Q145 0 120-55Z" className="board-binding" /><path d="M-95-40H97Q115 0 97 40H-95Z" className="board-detail" /><circle r="32" className="board-detail" /><path d="M-25 0H25M0-25V25M-95-30V30M92-30V30" className="board-detail" /></BoardPlane></Part>
              <Part id="binding-highback"><path d="M572 597L589 486Q638 465 688 480L701 570Q655 587 617 612Z" className="board-binding" /><path d="M596 573L608 496Q639 485 671 493L679 553ZM611 505L619 552M634 498L642 554M657 499L666 551" className="board-detail" /><path d="M586 584Q631 557 692 565" className="board-detail" /></Part>
              <Part id="binding-straps"><path d="M657 584Q677 522 742 523L753 543Q690 541 682 593ZM766 570Q793 521 831 536L839 551Q804 548 790 584Z" className="board-binding" /><path d="M681 566Q700 540 737 537M787 565Q807 539 828 546" className="board-detail" /><rect x="740" y="537" width="18" height="12" rx="2" className="board-metal" /><rect x="827" y="546" width="18" height="12" rx="2" className="board-metal" /></Part>
            </Part>
            <Part id="part-screws">{INSERTS.map((point, i) => <g id={`screw-${i + 1}`} key={i} className="board-screw"><g transform={`translate(${point.px} ${point.py - 28})`} className="board-metal">
              <path d="M-3 1V18Q0 22 3 18V1M-3 6L3 9M-3 11L3 14" /><ellipse rx="8" ry="4" /><path d="M-4 0H4M0-2V2" />
            </g></g>)}</Part>
          </g>
          <g className="board-labels" aria-hidden="true">{BOARD_LABELS.map((label, i) => <g key={label.name} className="board-label"><polyline className="board-leader" points={label.points} /><text x={label.x} y={label.y}><tspan className="board-label-number">{String(i + 1).padStart(2, '0')} / </tspan>{label.name}</text></g>)}</g>
        </svg>
      </div>
      <figcaption className="sr-only">ALPINE snowboard construction. This is an illustrative engineering cutaway, not a manufacturing drawing.</figcaption>
    </figure>
    <footer className="snowboard-footer">
      <div><p className="snowboard-footer-label">{reducedMotion ? 'precision in every layer.' : chapter.count === 0 ? 'one board. every layer.' : chapter.name}</p><p className="snowboard-state"><span />{reducedMotion ? 'static exploded view' : `${String(chapter.count).padStart(2, '0')} / ${BOARD_SCROLL_STEPS.length}`} <span className="snowboard-separator">/</span> {reducedMotion ? 'sintered base · wood core · steel edges' : 'scroll down to separate · up to assemble'}</p></div>
      {!reducedMotion && <ol className="snowboard-chapters" aria-label="Snowboard disassembly progress">{BOARD_SCROLL_STEPS.map((step, index) => <li key={step.name} className={index < chapter.count ? 'is-complete' : ''} aria-current={chapter.count === index + 1 ? 'step' : undefined}><span className="sr-only">{index + 1}. {step.name}</span></li>)}</ol>}
    </footer>
  </section>;
}
