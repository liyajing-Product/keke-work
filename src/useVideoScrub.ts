import { useEffect, useRef, useState } from 'react';
import type { Sample, Track } from 'mp4box';

const LERP_TAU = 8;
const SNAP = 0.002;
const LRU_MAX = 24;
const LEAD = 24;
const WATCHDOG = 60000;
type BankFrame = { ts: number; blob: Blob };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function nearestIndex(bank: BankFrame[], seconds: number) {
  const ts = seconds * 1e6;
  let lo = 0;
  let hi = bank.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (bank[mid].ts < ts) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && Math.abs(bank[lo - 1].ts - ts) < Math.abs(bank[lo].ts - ts) ? lo - 1 : lo;
}

export function useVideoScrub(videoSrc: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canvasLive, setCanvasLive] = useState(false);

  useEffect(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const abort = new AbortController();
    const lru = new Map<number, ImageBitmap | null>();
    let bank: BankFrame[] = [];
    let current = 0;
    let target = 0;
    let dur = Number.isFinite(video.duration) ? video.duration : 0;
    let span = 1;
    let origin = 0;
    let ready = false;
    let reverted = false;
    let painted = false;
    let building = false;
    let stopped = false;
    let lastPainted = -1;
    let lastProgress = -1;
    let lastTime = performance.now();
    let animation = 0;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let decoder: VideoDecoder | undefined;
    let wakeDecode: (() => void) | undefined;
    let failDecode: ((error: Error) => void) | undefined;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      origin = container.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, container.offsetHeight - window.innerHeight);
    };
    const metadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) dur = video.duration;
      video.pause();
    };
    const closeLRU = () => {
      for (const bitmap of lru.values()) bitmap?.close();
      lru.clear();
    };
    const fallback = () => {
      reverted = true;
      ready = false;
      bank = [];
      closeLRU();
      setCanvasLive(false);
      abort.abort();
      failDecode?.(new Error('Frame bank stopped'));
      if (decoder && decoder.state !== 'closed') decoder.close();
      wakeDecode?.();
    };

    const warmLRU = (i: number) => {
      for (let index = i - 1; index <= i + 2; index++) {
        if (index < 0 || index >= bank.length || lru.has(index)) continue;
        lru.set(index, null);
        void createImageBitmap(bank[index].blob).then(bitmap => {
          if (stopped || reverted || !lru.has(index)) { bitmap.close(); return; }
          lru.set(index, bitmap);
        }).catch(() => lru.delete(index));
      }
      while (lru.size > LRU_MAX) {
        const oldest = lru.keys().next().value!;
        lru.get(oldest)?.close();
        lru.delete(oldest);
      }
    };
    const paint = () => {
      if (!ctx || !bank.length) return;
      const index = nearestIndex(bank, current);
      const bitmap = lru.get(index);
      if (lru.has(index)) { lru.delete(index); lru.set(index, bitmap ?? null); }
      warmLRU(index);
      if (!bitmap || lastPainted === index) return;
      // Draw with cover cropping into the fixed 1920 × 1080 presentation canvas.
      const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
      const width = bitmap.width * scale;
      const height = bitmap.height * scale;
      ctx.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      lastPainted = index;
      if (!painted) { painted = true; setCanvasLive(true); }
    };
    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const p = clamp((window.scrollY - origin) / span);
      if (p !== lastProgress) { setScrollProgress(p); lastProgress = p; }
      if (dur > 0) {
        target = p * dur;
        current = motion.matches ? target : current + (target - current) * (1 - Math.exp(-dt * LERP_TAU));
        if (Math.abs(target - current) < SNAP) current = target;
        if (ready) paint();
        else if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
          try { video.currentTime = Math.min(current, Math.max(0, dur - 0.001)); } catch { /* Metadata may still be loading. */ }
        }
      }
      animation = requestAnimationFrame(tick);
    };

    async function extract(buffer: ArrayBuffer) {
      const MP4Box = await import('mp4box');
      const file = MP4Box.createFile();
      let track: Track | undefined;
      const samples: Sample[] = [];
      await new Promise<void>((resolve, reject) => {
        const cancelled = () => { file.stop(); reject(new Error('Extraction aborted')); };
        abort.signal.addEventListener('abort', cancelled, { once: true });
        file.onError = message => reject(new Error(message));
        file.onReady = info => {
          track = info.videoTracks[0];
          if (!track) { reject(new Error('No video track')); return; }
          file.setExtractionOptions(track.id, null, { nbSamples: 100 });
          file.start();
        };
        file.onSamples = (_id, _user, next) => {
          samples.push(...next);
          if (track && samples.length >= track.nb_samples) {
            abort.signal.removeEventListener('abort', cancelled);
            file.stop();
            resolve();
          }
        };
        const input = buffer.slice(0) as ArrayBuffer & { fileStart: number };
        input.fileStart = 0;
        file.appendBuffer(input);
        file.flush();
      });
      if (!track || stopped || reverted) throw new Error('Extraction stopped');
      const entry = file.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
      let description: Uint8Array | undefined;
      for (const boxType of ['avcC', 'hvcC', 'vpcC', 'av1C']) {
        if (entry[boxType]) {
          const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
          entry[boxType].write(stream);
          description = new Uint8Array(stream.buffer.slice(8, stream.position));
          break;
        }
      }
      return { track, samples, description };
    }

    async function decodeFrames(
      extracted: Awaited<ReturnType<typeof extract>>,
      hardwareAcceleration: HardwareAcceleration,
    ) {
      const { track, samples, description } = extracted;
      const config: VideoDecoderConfig = {
        codec: track.codec, codedWidth: track.video.width, codedHeight: track.video.height,
        description, hardwareAcceleration,
      };
      const support = await VideoDecoder.isConfigSupported(config);
      if (!support.supported) throw new Error('Unsupported video codec');
      const frames: BankFrame[] = [];
      let pendingBlobs = 0;
      let failed = false;
      let decodeError: Error | undefined;
      let rejectFailure: (error: Error) => void = () => {};
      const failure = new Promise<never>((_resolve, reject) => { rejectFailure = reject; });
      // Attach a handler immediately; errors can occur before flush starts.
      void failure.catch(() => {});
      const fail = (error: Error) => {
        failed = true;
        decodeError = error;
        rejectFailure(error);
        wakeDecode?.();
      };
      failDecode = fail;
      const activeDecoder = new VideoDecoder({
        error: fail,
        output: frame => {
          if (stopped || reverted || failed) { frame.close(); return; }
          pendingBlobs++;
          const ts = frame.timestamp;
          const offscreen = document.createElement('canvas');
          offscreen.width = frame.displayWidth;
          offscreen.height = frame.displayHeight;
          try {
            const outputContext = offscreen.getContext('2d');
            if (!outputContext) throw new Error('Canvas unavailable');
            outputContext.drawImage(frame, 0, 0);
            offscreen.toBlob(blob => {
              if (!stopped && !reverted && !failed) {
                if (blob) frames.push({ ts, blob });
                else fail(new Error('Frame encoding failed'));
              }
              offscreen.width = 0;
              offscreen.height = 0;
              pendingBlobs--;
              wakeDecode?.();
            }, 'image/webp', 0.82);
          } catch (error) {
            pendingBlobs--;
            fail(error instanceof Error ? error : new Error('Frame encoding failed'));
          } finally { frame.close(); }
        },
      });
      decoder = activeDecoder;
      activeDecoder.addEventListener('dequeue', () => wakeDecode?.());
      try {
        activeDecoder.configure(config);
        for (const sample of samples) {
          while (!failed && !stopped && !reverted && activeDecoder.decodeQueueSize + pendingBlobs >= LEAD) {
            await Promise.race([new Promise<void>(resolve => { wakeDecode = resolve; }), failure]);
          }
          if (failed) throw decodeError;
          if (stopped || reverted) throw new Error('Decode stopped');
          activeDecoder.decode(new EncodedVideoChunk({
            type: sample.is_sync ? 'key' : 'delta',
            timestamp: Math.round(sample.cts * 1e6 / sample.timescale),
            duration: Math.round(sample.duration * 1e6 / sample.timescale),
            data: sample.data,
          }));
        }
        await Promise.race([activeDecoder.flush(), failure]);
        while (pendingBlobs > 0 && !failed && !stopped && !reverted) {
          await Promise.race([new Promise<void>(resolve => { wakeDecode = resolve; }), failure]);
        }
        if (failed) throw decodeError;
        if (!frames.length || stopped || reverted) throw new Error('Empty frame bank');
        return frames.sort((a, b) => a.ts - b.ts);
      } finally {
        failed = true;
        if (activeDecoder.state !== 'closed') activeDecoder.close();
        if (decoder === activeDecoder) decoder = undefined;
        failDecode = undefined;
        wakeDecode = undefined;
      }
    }

    const build = async () => {
      if (building || stopped || motion.matches || !('VideoDecoder' in window)) return;
      building = true;
      watchdog = setTimeout(() => { if (!stopped) fallback(); }, WATCHDOG);
      try {
        const response = await fetch(videoSrc, { signal: abort.signal });
        if (!response.ok) throw new Error('Video fetch failed');
        const extracted = await extract(await response.arrayBuffer());
        if (!dur) dur = extracted.track.duration / extracted.track.timescale;
        try { bank = await decodeFrames(extracted, 'prefer-hardware'); }
        catch (error) {
          if (stopped || reverted) throw error;
          bank = await decodeFrames(extracted, 'prefer-software');
        }
        if (!stopped && !reverted) { ready = true; warmLRU(nearestIndex(bank, current)); }
      } catch {
        if (!stopped) fallback();
      } finally { clearTimeout(watchdog); building = false; }
    };
    const motionChanged = () => { if (motion.matches) fallback(); };
    resize();
    video.addEventListener('loadedmetadata', metadata);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    motion.addEventListener('change', motionChanged);
    animation = requestAnimationFrame(tick);
    if (document.readyState === 'complete') void build();
    else window.addEventListener('load', build, { once: true });

    return () => {
      stopped = true;
      abort.abort();
      clearTimeout(watchdog);
      cancelAnimationFrame(animation);
      failDecode?.(new Error('Component unmounted'));
      if (decoder && decoder.state !== 'closed') decoder.close();
      wakeDecode?.();
      video.removeEventListener('loadedmetadata', metadata);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('load', build);
      motion.removeEventListener('change', motionChanged);
      closeLRU();
      bank = [];
    };
  }, [videoSrc]);

  return { containerRef, videoRef, canvasRef, scrollProgress, canvasLive };
}
