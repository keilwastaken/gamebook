const DEFAULT_ROTATION_MIN = -2;
const DEFAULT_ROTATION_MAX = 2;

export function randomRotation(
  seed: number,
  min: number = DEFAULT_ROTATION_MIN,
  max: number = DEFAULT_ROTATION_MAX
): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return min + (x - Math.floor(x)) * (max - min);
}
