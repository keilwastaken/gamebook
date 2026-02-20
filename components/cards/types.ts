export interface GameCardData {
  title: string;
  imageUri?: string;
  /** Playtime string e.g. "24h 12m" */
  playtime?: string;
  notePreview?: string;
}

const ROTATION_MIN = -2;
const ROTATION_MAX = 2;

export function randomRotation(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return ROTATION_MIN + (x - Math.floor(x)) * (ROTATION_MAX - ROTATION_MIN);
}
