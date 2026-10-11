import type { ComponentType } from 'react';
export type SplashCursorProps = Partial<Record<'SIM_RESOLUTION' | 'DYE_RESOLUTION' | 'CAPTURE_RESOLUTION' | 'DENSITY_DISSIPATION' | 'VELOCITY_DISSIPATION' | 'PRESSURE' | 'PRESSURE_ITERATIONS' | 'CURL' | 'SPLAT_RADIUS' | 'SPLAT_FORCE' | 'COLOR_UPDATE_SPEED', number>> & {
  SHADING?: boolean; TRANSPARENT?: boolean; RAINBOW_MODE?: boolean; COLOR?: string;
  BACK_COLOR?: {r: number; g: number; b: number};
};
declare const SplashCursor: ComponentType<SplashCursorProps>;
export default SplashCursor;
