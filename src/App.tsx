import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowDown, ChevronUp, Info, X } from 'lucide-react';
import { useVideoScrub } from '@/useVideoScrub';

const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4';
const DARK = '#1D3045';
const NAV = ['VECTRUS ENERGY', 'VECTRUS UPSTREAM', 'VECTRUS MARKETS', 'VECTRUS SYSTEMS', 'VECTRUS+'];
const NAV_PROGRESS = [0, 0.4, 0.75, 0.4, 0.75];

function Stagger({ visible, delay = 0, className = '', children }: {
  visible: boolean; delay?: number; className?: string; children: ReactNode;
}) {
  return <div className={`stagger ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${visible ? delay : 0}ms` }}>{children}</div>;
}

export default function App() {
  const { containerRef, videoRef, canvasRef, scrollProgress: p, canvasLive } = useVideoScrub(VIDEO_SRC);
  const [navVisible, setNavVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isLight = p > 0.55;
  const s1 = p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08);
  const s2 = p < 0.32 ? 0 : p < 0.4 ? (p - 0.32) / 0.08 : p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.08);
  const s3 = p < 0.67 ? 0 : p < 0.75 ? (p - 0.67) / 0.08 : 1;

  const goTo = (progress: number) => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + progress * (container.offsetHeight - window.innerHeight), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setNavVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button');
    first?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (event.key !== 'Tab') return;
      const elements = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href],button') ?? []);
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) { event.preventDefault(); lastElement?.focus(); }
      else if (!event.shiftKey && document.activeElement === lastElement) { event.preventDefault(); firstElement?.focus(); }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', keydown);
      previousFocus?.focus();
    };
  }, [menuOpen]);

  const sectionStyle = (opacity: number) => ({ opacity, transition: 'opacity 0.1s ease-out' });
  const sceneClass = 'absolute inset-0';

  return <>
    <main ref={containerRef} id="scene" className="relative h-[500vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video ref={videoRef} src={VIDEO_SRC} className="absolute inset-0 h-full w-full object-cover" muted playsInline preload="auto" aria-hidden="true" />
        <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style={{ opacity: canvasLive ? 1 : 0 }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0">
          <nav aria-label="Main navigation" className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex items-center justify-between px-6 pb-6 pt-8 transition-colors duration-500 sm:px-8 sm:pt-12 md:px-12" style={{ color: isLight ? '#fff' : DARK }}>
            <div className="hidden items-center gap-8 lg:flex xl:gap-10">
              {NAV.map((label, i) => <a key={label} href="#scene" onClick={event => { event.preventDefault(); goTo(NAV_PROGRESS[i]); }} className={`nav-enter relative text-xs font-medium uppercase tracking-[0.15em] hover:opacity-70 ${navVisible ? 'is-visible' : ''}`} style={{ transitionDelay: `${i * 80 + 100}ms` }} aria-current={i === 0 ? 'page' : undefined}>
                {label}{i === 0 && <span className="absolute -bottom-3 left-0 h-[2px] w-full bg-current" />}
              </a>)}
            </div>
            <button ref={menuButtonRef} type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)} className={`nav-enter flex flex-col gap-[5px] py-2 lg:hidden ${navVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '100ms' }}>
              <span className="h-[2px] w-6 bg-current" /><span className="h-[2px] w-6 bg-current" /><span className="h-[2px] w-4 bg-current" />
            </button>
            <div className={`nav-enter hidden items-center gap-8 sm:flex ${navVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '500ms' }}>
              <a href="#scene" onClick={event => { event.preventDefault(); goTo(0.4); }} className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70">
                NEWS<span className="flex h-5 w-5 items-center justify-center rounded-full bg-current"><Info size={10} style={{ color: isLight ? DARK : '#fff' }} /></span>
              </a>
              <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-menu" className="text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70"><span>MENU</span></button>
            </div>
          </nav>

          <section aria-hidden={s1 <= 0.3} className={`${sceneClass} flex items-center px-6 sm:px-8 md:px-20 lg:px-32`} style={sectionStyle(s1)}>
            <div>
              <Stagger visible={s1 > 0.3}>
                <h1 className="text-[clamp(2rem,5vw,5rem)] font-light uppercase leading-[1.2] text-navy">Advancing resources for a cleaner future</h1>
              </Stagger>
              <Stagger visible={s1 > 0.3} delay={150}><p className="mt-6 text-sm uppercase tracking-[0.3em] text-[#1D304590]">Sustainable power with purpose</p></Stagger>
            </div>
            <Stagger visible={s1 > 0.3} delay={300} className="absolute bottom-12 right-6 sm:right-8 md:right-12">
              <button type="button" tabIndex={s1 > 0.3 ? 0 : -1} onClick={() => goTo(0.4)} aria-label="Explore partnerships" className={`${s1 > 0.3 ? 'pointer-events-auto' : ''} flex h-12 w-12 items-center justify-center rounded-full border border-navy/50 text-navy transition-opacity hover:opacity-70`}><ArrowRight size={18} /></button>
            </Stagger>
          </section>

          <section aria-hidden={s2 <= 0.3} className={`${sceneClass} flex items-center justify-center px-6 sm:px-8`} style={sectionStyle(s2)}>
            <Stagger visible={s2 > 0.3} className="max-w-[900px]">
              <h2 className="text-center text-[clamp(1.5rem,4.5vw,4.5rem)] font-extralight uppercase leading-[1.3] tracking-wide text-navy">We build lasting partnerships with vision <span className="text-navy/80">and precision</span>{' '}<span className="text-navy/50">across every frontier</span></h2>
            </Stagger>
            <div className="absolute bottom-16 right-6 flex flex-col items-center gap-4 sm:right-8 md:right-12">
              <Stagger visible={s2 > 0.3} delay={200}><button type="button" tabIndex={s2 > 0.3 ? 0 : -1} onClick={() => goTo(0.75)} aria-label="Continue to Nordvik" className={`${s2 > 0.3 ? 'pointer-events-auto' : ''} flex h-12 w-12 items-center justify-center rounded-full border border-navy/40 text-navy transition-opacity hover:opacity-70`}><ArrowDown size={18} /></button></Stagger>
              <Stagger visible={s2 > 0.3} delay={350} className="mt-4 flex flex-col items-center gap-2"><span className="h-2 w-2 rounded-full bg-navy" /><span className="h-1.5 w-1.5 rounded-full bg-navy/40" /><span className="h-1.5 w-1.5 rounded-full bg-navy/40" /></Stagger>
              <Stagger visible={s2 > 0.3} delay={500} className="mt-2"><button type="button" tabIndex={s2 > 0.3 ? 0 : -1} onClick={() => goTo(0)} aria-label="Back to top" className={`${s2 > 0.3 ? 'pointer-events-auto' : ''} flex h-10 w-10 items-center justify-center rounded-full border border-navy/30 text-navy/80 transition-opacity hover:opacity-70`}><ChevronUp size={16} /></button></Stagger>
            </div>
          </section>

          <section aria-hidden={s3 <= 0.3} className={`${sceneClass} flex items-center justify-end px-6 sm:px-8 md:px-20 lg:px-32`} style={sectionStyle(s3)}>
            <div className="max-w-2xl text-left">
              <Stagger visible={s3 > 0.3}><p className="mb-4 text-lg tracking-wide text-white/60">Halder | Nordvik</p></Stagger>
              <Stagger visible={s3 > 0.3} delay={150}><h2 className="mb-8 text-[clamp(2rem,4vw,4rem)] font-light uppercase leading-[1.2] tracking-wide text-white">Fueling ambition,<br />shaping tomorrow.</h2></Stagger>
              <Stagger visible={s3 > 0.3} delay={300}><a tabIndex={s3 > 0.3 ? 0 : -1} href="mailto:" className={`${s3 > 0.3 ? 'pointer-events-auto' : ''} inline-flex items-center gap-4`}><span className="text-sm uppercase tracking-[0.3em] text-white/80">Contact Nordvik</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 transition-transform duration-300 hover:scale-110"><ArrowRight size={16} /></span></a></Stagger>
            </div>
          </section>
        </div>
      </div>
    </main>

    <div ref={menuRef} id="mobile-menu" role="dialog" aria-modal={menuOpen ? true : undefined} aria-label="Navigation menu" aria-hidden={!menuOpen} className={`fixed inset-0 z-[100] bg-navy transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${menuOpen ? 'menu-open visible opacity-100' : 'invisible opacity-0'}`}>
      <div className={`flex h-full flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${menuOpen ? 'translate-y-0' : '-translate-y-8'}`}>
        <div className="absolute right-0 top-0 px-6 pt-8 sm:px-8 sm:pt-12"><button type="button" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-white"><X size={18} /></button></div>
        <nav aria-label="Menu navigation" className="flex flex-1 flex-col justify-center px-8 sm:px-12">
          {NAV.map((label, i) => <a key={label} tabIndex={menuOpen ? 0 : -1} href="#scene" onClick={event => { event.preventDefault(); goTo(NAV_PROGRESS[i]); }} className={`menu-link py-3 text-2xl font-light uppercase tracking-wide sm:text-3xl ${i === 0 ? 'text-white' : 'text-white/60 hover:text-white'}`} style={{ transitionDelay: `${menuOpen ? i * 60 : 0}ms` }}>{label}</a>)}
        </nav>
        <div className="flex gap-8 px-8 pb-10 text-xs uppercase tracking-[0.2em] text-white/60 sm:px-12"><a tabIndex={menuOpen ? 0 : -1} href="#scene" onClick={event => { event.preventDefault(); goTo(0.4); }} className="hover:text-white">NEWS</a><a tabIndex={menuOpen ? 0 : -1} href="mailto:" className="hover:text-white">CONTACT</a></div>
      </div>
    </div>
  </>;
}
