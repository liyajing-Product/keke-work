// React Bits LightRays shader supplied in the user's attachment.
// Site adapter: TypeScript, active-scene lifecycle, static reduced-motion fallback.
import { useEffect, useRef, useState } from 'react';
import './LightRays.css';

type RaysOrigin = 'top-center' | 'top-left' | 'top-right' | 'right' | 'left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
type LightRaysProps = {
  raysOrigin?: RaysOrigin; raysColor?: string; raysSpeed?: number; lightSpread?: number;
  rayLength?: number; pulsating?: boolean; fadeDistance?: number; saturation?: number;
  followMouse?: boolean; mouseInfluence?: number; noiseAmount?: number; distortion?: number;
  lightMode?: boolean; className?: string; active?: boolean; reducedMotion?: boolean;
};
const hexToRgb = (hex: string) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match ? match.slice(1).map(channel => parseInt(channel, 16) / 255) : [1, 1, 1];
};
const getAnchorAndDir = (origin: RaysOrigin, w: number, h: number) => {
  switch (origin) {
    case 'top-left': return { anchor: [0, -.2 * h], dir: [0, 1] };
    case 'top-right': return { anchor: [w, -.2 * h], dir: [0, 1] };
    case 'left': return { anchor: [-.2 * w, .5 * h], dir: [1, 0] };
    case 'right': return { anchor: [1.2 * w, .5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, 1.2 * h], dir: [0, -1] };
    case 'bottom-center': return { anchor: [.5 * w, 1.2 * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, 1.2 * h], dir: [0, -1] };
    default: return { anchor: [.5 * w, -.2 * h], dir: [0, 1] };
  }
};

const vertex = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;
const fragment = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
uniform float lightMode;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;

  if (lightMode > 0.5) {
    vec3 mapped = vec3(1.0) - exp(-max(fragColor.rgb, vec3(0.0)) * 1.35);
    float energy = clamp(max(mapped.r, max(mapped.g, mapped.b)), 0.0, 1.0);
    vec3 hue = mapped / max(energy, 0.0001);
    vec3 ink = mix(hue * 0.25, hue * 0.72, energy);
    fragColor = vec4(mix(vec3(1.0), ink, energy), 1.0);
  }
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  // This effect sits on a black canvas. Opaque compositing avoids applying
  // the ray strength again as alpha, which makes the beams disappear on mobile.
  gl_FragColor = lightMode > 0.5 ? color : vec4(color.rgb * 1.35, 1.0);
}`;

export default function LightRays({
  raysOrigin = 'top-center', raysColor = '#ffffff', raysSpeed = 1, lightSpread = 1,
  rayLength = 2, pulsating = false, fadeDistance = 1, saturation = 1,
  followMouse = true, mouseInfluence = .1, noiseAmount = 0, distortion = 0,
  lightMode = false, className = '', active = true, reducedMotion = false,
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const [initialized, setInitialized] = useState(active);
  const activeRef = useRef(active);
  const syncRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    activeRef.current = active;
    if (active) setInitialized(true);
    syncRef.current?.();
  }, [active]);

  useEffect(() => {
    if (!initialized || reducedMotion || !containerRef.current) return;
    const container = containerRef.current;
    let disposed = false;
    let cleanup = () => {};
    setFallback(false);
    // The WebGL dependency loads only when this pinned scene becomes active.
    void import('ogl').then(({ Renderer, Program, Triangle, Mesh }) => {
      if (disposed) return;
      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 1.5), alpha: true });
      const gl = renderer.gl;
      const canvas = gl.canvas as HTMLCanvasElement;
      let frame = 0;
      let contextLost = false;
      let lastTime: number | null = null;
      let elapsed = 0;
      const pointer = { x: .5, y: .5 };
      const smooth = { x: .5, y: .5 };
      const uniforms = {
        iTime: { value: 0 }, iResolution: { value: [1, 1] },
        rayPos: { value: [0, 0] }, rayDir: { value: [0, 1] },
        raysColor: { value: hexToRgb(raysColor) }, raysSpeed: { value: raysSpeed },
        lightSpread: { value: lightSpread }, rayLength: { value: rayLength },
        pulsating: { value: pulsating ? 1 : 0 }, fadeDistance: { value: fadeDistance },
        saturation: { value: saturation }, mousePos: { value: [.5, .5] },
        mouseInfluence: { value: followMouse ? mouseInfluence : 0 },
        noiseAmount: { value: noiseAmount }, distortion: { value: distortion },
        lightMode: { value: lightMode ? 1 : 0 },
      };
      const geometry = new Triangle(gl);
      const program = new Program(gl, { vertex, fragment, uniforms });
      const mesh = new Mesh(gl, { geometry, program });
      const resize = () => {
        renderer.dpr = Math.min(window.devicePixelRatio, 1.5);
        renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
        const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
        uniforms.iResolution.value = [w, h];
        uniforms.rayPos.value = anchor;
        uniforms.rayDir.value = dir;
      };
      const move = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      };
      const render = (time: number) => {
        if (disposed || document.hidden || !activeRef.current || contextLost) return;
        if (lastTime !== null) elapsed += Math.min(time - lastTime, 50) * .001;
        lastTime = time;
        uniforms.iTime.value = elapsed;
        // Smooth pointer input keeps subtle light movement behind the engineering drawing.
        const smoothing = .08;
        smooth.x += (pointer.x - smooth.x) * smoothing;
        smooth.y += (pointer.y - smooth.y) * smoothing;
        uniforms.mousePos.value = [smooth.x, smooth.y];
        renderer.render({ scene: mesh });
        frame = requestAnimationFrame(render);
      };
      const visibility = () => {
        cancelAnimationFrame(frame);
        lastTime = null;
        if (!document.hidden && !disposed && activeRef.current && !contextLost) frame = requestAnimationFrame(render);
      };
      syncRef.current = visibility;
      const lostContext = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        cancelAnimationFrame(frame);
        setFallback(true);
      };
      const restoredContext = () => { contextLost = false; setFallback(false); resize(); visibility(); };
      const sizeObserver = new ResizeObserver(resize);
      cleanup = () => {
        syncRef.current = null;
        cancelAnimationFrame(frame);
        sizeObserver.disconnect();
        window.removeEventListener('pointermove', move);
        document.removeEventListener('visibilitychange', visibility);
        canvas.removeEventListener('webglcontextlost', lostContext);
        canvas.removeEventListener('webglcontextrestored', restoredContext);
        geometry.remove();
        program.remove();
        canvas.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
      container.appendChild(canvas);
      sizeObserver.observe(container);
      canvas.addEventListener('webglcontextlost', lostContext);
      canvas.addEventListener('webglcontextrestored', restoredContext);
      if (followMouse && mouseInfluence > 0) window.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('visibilitychange', visibility);
      resize();
      visibility();
    }).catch(() => {
      if (!disposed) { cleanup(); setFallback(true); }
    });
    return () => { disposed = true; cleanup(); };
  }, [initialized, reducedMotion, raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, followMouse, mouseInfluence, noiseAmount, distortion, lightMode]);

  return <div ref={containerRef} aria-hidden="true" className={`light-rays-container ${fallback || reducedMotion ? 'is-static' : ''} ${className}`.trim()} />;
}
