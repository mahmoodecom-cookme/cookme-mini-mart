export const FEATURE_RING_SIZE = 6;
export function stepFeature(index: number, direction: -1 | 1) {
  return (index + direction + FEATURE_RING_SIZE) % FEATURE_RING_SIZE;
}
export function featureOffset(slide: number, center: number) {
  return ((slide - center + 9) % FEATURE_RING_SIZE) - 3;
}
