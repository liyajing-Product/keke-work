import { useEffect, useRef } from 'react';

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4';
export function SecurifyHero({ active, reducedMotion = false }: { active: boolean; reducedMotion?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const finish = () => {
      if (reducedMotion && Number.isFinite(video.duration)) video.currentTime = Math.max(0, video.duration - .05);
    };
    if (active && !reducedMotion) void video.play().catch(() => {});
    else { video.pause(); finish(); }
    video.addEventListener('loadedmetadata', finish);
    return () => video.removeEventListener('loadedmetadata', finish);
  }, [active, reducedMotion]);

  return <section aria-labelledby="skiing-title" className="skiing-hero relative h-screen w-full overflow-hidden">
    <div className="hero-video-layer absolute inset-0">
      <video ref={videoRef} className="hero-background-video absolute inset-0 h-full w-full object-cover" loop={!reducedMotion} muted playsInline src={HERO_VIDEO} aria-hidden="true" />
      <div className="hero-video-shade absolute inset-0" aria-hidden="true" />
    </div>
    <div className="hero-title-frame">
      <h1 id="skiing-title" className="hero-title hero-zoom-title" aria-label="SKIING">
        {'SKIING'.split('').map((letter, index) => <span key={index} aria-hidden="true" data-hero-letter={letter}>{letter}</span>)}
      </h1>
    </div>
  </section>;
}
