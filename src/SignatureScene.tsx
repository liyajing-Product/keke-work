import type { MutableRefObject } from 'react';
import { SignatureParticles, type SignatureParticleDriver } from '@/SignatureParticles';

export function SignatureScene({ active, reducedMotion, driver }: {
  active: boolean; reducedMotion: boolean; driver: MutableRefObject<SignatureParticleDriver>;
}) {
  return <section id="signature" aria-labelledby="signature-title" className="signature-scene">
    <SignatureParticles active={active} reducedMotion={reducedMotion} driver={driver} />
    <div className="signature-shade" aria-hidden="true" />
    <div className="signature-registration" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => <span key={index}>+</span>)}
    </div>
    <h2 id="signature-title" className="signature-title alpine-display">
      <span>Your style doesn't require</span>{' '}
      <span>a standard answer</span>
    </h2>
    <p className="signature-scroll-cue">scroll to explore <span aria-hidden="true">↓</span></p>
  </section>;
}
