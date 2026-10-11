// Engineering palette, exploded poses and scroll chapters share one configuration.
export const BOARD_PALETTE = { background: '#000000', accent: '#83d7e3', line: '#dde7e9', surface: '#060b0d', muted: '#ffffff70' };
// These values are seek coordinates, not elapsed playback milliseconds.
export const BOARD_SCROLL = { start: .6825, end: 1.9325, chapter: 1000, lead: 30, move: 820, label: 120, bindingDelay: 80, bindingStagger: 45, screwStagger: 25, screwMove: 500, screwLift: 15, screwTurn: 2, scrub: .18, snapDelay: .32, snapDuration: .5, boundaryTolerance: .012 };
export type SnowboardScrollDriver = { progress: number; render: ((progress: number) => void) | null };
export const BOARD_PARTS = [
  { id: 'part-screws', x: -250, y: -280, rotate: -.6 },
  { id: 'part-binding', x: 60, y: -365, rotate: -1 },
  { id: 'part-top-sheet', x: -12, y: -195, rotate: -.6 },
  { id: 'part-sidewall', x: 10, y: -50, rotate: .5 },
  { id: 'part-upper-fiber', x: -6, y: 95, rotate: -.5 },
  { id: 'part-inserts', x: 380, y: -300, rotate: .5 },
  { id: 'part-core', x: 0, y: 240, rotate: .4 },
  { id: 'part-lower-fiber', x: 8, y: 380, rotate: -.4 },
  { id: 'part-edge-left', x: -12, y: 525, rotate: -.4 },
  { id: 'part-edge-right', x: 12, y: 550, rotate: -.4 },
  { id: 'part-base', x: -12, y: 705, rotate: -.6 },
] as const;
export const BINDING_PARTS = [
  { id: 'binding-straps', x: 100, y: -45, rotate: 3 },
  { id: 'binding-highback', x: -45, y: -70, rotate: -3 },
  { id: 'binding-baseplate', x: 0, y: 0, rotate: 0 },
] as const;
export const BOARD_LABELS = [
  { name: 'binding / 3 parts', points: '1290,160 1780,160', x: 1800, y: 165 },
  { name: 'screws / 8', points: '670,275 500,275', x: 275, y: 280 },
  { name: 'top sheet', points: '1710,400 1780,400', x: 1800, y: 405 },
  { name: 'sidewall', points: '1730,550 1780,550', x: 1800, y: 555 },
  { name: 'upper laminate', points: '1710,700 1780,700', x: 1800, y: 705 },
  { name: 'wood core', points: '1720,850 1780,850', x: 1800, y: 855 },
  { name: 'lower laminate', points: '1730,995 1780,995', x: 1800, y: 1000 },
  { name: 'steel edges / 2', points: '1730,1155 1780,1155', x: 1800, y: 1160 },
  { name: 'sintered pe base', points: '1710,1320 1780,1320', x: 1800, y: 1325 },
  { name: 'threaded inserts / 8', points: '1450,280 1780,280', x: 1800, y: 285 },
] as const;
export const BOARD_SCROLL_STEPS = [
  { name: 'screws', ids: ['part-screws'], labels: [1] },
  { name: 'binding', ids: ['part-binding'], labels: [0] },
  { name: 'top sheet', ids: ['part-top-sheet'], labels: [2] },
  { name: 'sidewall', ids: ['part-sidewall'], labels: [3] },
  { name: 'upper laminate', ids: ['part-upper-fiber'], labels: [4] },
  { name: 'threaded inserts', ids: ['part-inserts'], labels: [9] },
  { name: 'wood core', ids: ['part-core'], labels: [5] },
  { name: 'lower laminate', ids: ['part-lower-fiber'], labels: [6] },
  { name: 'steel edges', ids: ['part-edge-left', 'part-edge-right'], labels: [7] },
  { name: 'sintered base', ids: ['part-base'], labels: [8] },
] as const;
export const BOARD_SCROLL_DURATION = BOARD_SCROLL_STEPS.length * BOARD_SCROLL.chapter;
// The still-assembled inner stack descends as an outer layer is peeled away.
// This keeps a moving core or laminate from passing through an unopened lower layer.
export const BOARD_SPREAD_STEPS = [
  { chapter: 4, y: 240, ids: ['part-inserts', 'part-core', 'part-lower-fiber', 'part-edge-left', 'part-edge-right', 'part-base'] },
  { chapter: 6, y: 380, ids: ['part-lower-fiber', 'part-edge-left', 'part-edge-right', 'part-base'] },
  { chapter: 7, y: 537, ids: ['part-edge-left', 'part-edge-right', 'part-base'] },
  { chapter: 8, y: 650, ids: ['part-base'] },
];
export const boardRestOffset = (id: string, chapter: number) => BOARD_SPREAD_STEPS.reduce((offset, spread) => spread.chapter < chapter && spread.ids.includes(id) ? spread.y : offset, 0);
