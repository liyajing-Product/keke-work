import { useMotionAudit } from '@/useMotionAudit';
import { STORY_SCROLL_END } from '@/storyConfig';
import type { CSSProperties } from 'react';
import { useScrollStory } from '@/useScrollStory';
import { SecurifyHero } from '@/SecurifyHero';
import { SecurifyNav } from '@/SecurifyNav';
import { GogglesShowcase } from '@/GogglesShowcase';
import { AlpineCollection } from '@/AlpineCollection';
import { SignatureScene } from '@/SignatureScene';
import { SnowboardScene } from '@/SnowboardScene';
import { GlobalCursor } from '@/GlobalCursor';
import { useSiteEntrance } from '@/useSiteEntrance';

export default function App() {
  const entering = useSiteEntrance();
  const { rootRef, reducedMotion, staticLayout, activeScene, goTo, snowboardDriver, signatureDriver, renderMask } = useScrollStory();
  useMotionAudit(rootRef);
  const visible = (scene: number) => staticLayout || activeScene === scene;
  const rendering = (scene: number) => staticLayout || Boolean(renderMask & (1 << scene));
  const sceneStyle = (scene: number) => ({ pointerEvents: visible(scene) ? 'auto' as const : 'none' as const });

  return <>
    <div aria-hidden={entering || undefined} {...(entering ? { inert: '' } : {})}>
    <SecurifyNav onNavigate={goTo} />
    <main ref={rootRef} id="scene" className={`scroll-story ${staticLayout ? 'motion-static' : ''}`} style={{ '--story-height': STORY_SCROLL_END * 800 + 100 } as CSSProperties}>
      <div className="story-stage">
        <div data-scene="hero" aria-hidden={!visible(0)} className="story-scene story-hero" style={sceneStyle(0)}>
          <SecurifyHero active={rendering(0)} reducedMotion={reducedMotion} />
        </div>
        <div data-scene="goggles" aria-hidden={!visible(1)} className="story-scene story-goggles" style={sceneStyle(1)}>
          <GogglesShowcase active={visible(1)} rendering={rendering(1)} onContinue={() => goTo('snowboard')} />
        </div>
        <div data-scene="snowboard" aria-hidden={!visible(2)} className="story-scene story-snowboard" style={sceneStyle(2)}>
          <SnowboardScene driver={snowboardDriver} reducedMotion={staticLayout} active={rendering(2)} />
        </div>
        <div data-scene="signature" aria-hidden={!visible(3)} className="story-scene story-signature" style={sceneStyle(3)}>
          <SignatureScene active={rendering(3)} reducedMotion={staticLayout} driver={signatureDriver} />
        </div>
        <div data-scene="collection" aria-hidden={!visible(4)} className="story-scene story-collection" style={sceneStyle(4)}>
          <AlpineCollection staticLayout={staticLayout} />
        </div>
      </div>
    </main>
    </div>
    <GlobalCursor entering={entering} />
  </>;
}
