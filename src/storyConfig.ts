export type SceneName = 'hero' | 'goggles' | 'snowboard' | 'signature' | 'collection';

// Eight viewport lengths per clock unit preserve each scene's animation pace.
export const STORY_SCROLL_END = 2.7;
export const SCENE_DESTINATIONS: Record<SceneName, number> = {
  hero: 0, goggles: .33, snowboard: .6825, signature: 2.255, collection: 2.5275,
};
export const SIGNATURE_OFFSET = 1.255;
export const COLLECTION_OFFSET = 1.8225;

// Camera pacing is shared by the four handoffs. Backgrounds stay live across
// the whole visible overlap; interaction belongs to the dominant scene only.
export const STORY_MOTION = { scrub: .48, transitionEase: 'power2.inOut', depth: -300, scale: .94, tilt: 2, rise: 3 };
export const SCENE_HANDOFFS = [
  { enter: .14, exit: .23, end: .285, switchAt: .245 },
  { enter: .455, exit: .455, end: .635, switchAt: .545 },
  { enter: 2.0, exit: 1.9825, end: 2.17, switchAt: 2.075 },
  { enter: 2.295, exit: 2.28, end: 2.485, switchAt: 2.385 },
] as const;
export const SCENE_RENDER_WINDOWS = [
  [0, .285], [.09, .65], [.405, 2.175], [1.95, 2.485], [2.245, STORY_SCROLL_END],
] as const;
