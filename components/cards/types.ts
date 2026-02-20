export interface GameCardData {
  title: string;
  imageUri?: string;
  /** Playtime string e.g. "24h 12m" */
  playtime?: string;
  notePreview?: string;
  mountStyle?: "tape" | "color-pin" | "metal-pin";
  postcardSide?: "front" | "back";
}
