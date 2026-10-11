import type { SceneName } from '@/storyConfig';

const LINKS = [
  { label: 'Home', scene: 'hero' },
  { label: 'Goggles', scene: 'goggles' },
  { label: 'Skateboarding', scene: 'snowboard' },
  { label: 'Equip', scene: 'collection' },
] satisfies { label: string; scene: SceneName }[];

// One shared navigation stays visible throughout all five scroll scenes.
export function SecurifyNav({ onNavigate }: { onNavigate: (scene: SceneName) => void }) {
  return <div className="global-navigation fixed inset-x-0 top-0 z-50 px-4 pt-6 min-[420px]:px-6 md:px-10">
    <nav aria-label="alpine navigation" className="flex items-center justify-between gap-4">
      <a href="#scene" onClick={event => { event.preventDefault(); onNavigate('hero'); }} aria-label="白境 ALPINE home" className="alpine-brand flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-neutral-900/90 px-3 py-3 backdrop-blur sm:px-4">
        <svg viewBox="0 0 64 52" className="h-5 w-6 shrink-0" aria-hidden="true"><use href="#alpine-mark" /></svg>
        <span className="whitespace-nowrap text-sm font-normal tracking-tight sm:text-base lg:text-lg">白境 / ALPINE</span>
      </a>
      <div className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-2 backdrop-blur min-[960px]:flex lg:px-3">
        {LINKS.map(link => <a key={link.label} href={link.scene === 'hero' ? '#scene' : `#${link.scene}`} onClick={event => { event.preventDefault(); onNavigate(link.scene); }} className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-neutral-300 transition-colors hover:text-white lg:px-5">{link.label}</a>)}
      </div>
      <button type="button" onClick={() => onNavigate('goggles')} className="shrink-0 rounded-full bg-white px-4 py-3 text-sm font-normal text-black transition-colors hover:bg-neutral-200 sm:px-6">get started</button>
    </nav>
  </div>;
}
