export const FEATURE_RING_SIZE = 6;
export function stepFeature(index: number, direction: -1 | 1, size = FEATURE_RING_SIZE) {
  return size > 0 ? (index + direction + size) % size : 0;
}
export function featureOffset(slide: number, center: number, size = FEATURE_RING_SIZE) {
  const half = Math.floor(size / 2);
  return size > 0 ? ((slide - center + size + half) % size) - half : 0;
}
