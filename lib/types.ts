export type TicketType =
  | "polaroid"
  | "postcard"
  | "widget"
  | "ticket"
  | "minimal";

export const DEFAULT_TICKET_TYPE: TicketType = "polaroid";

export type GridUnit = 1 | 2 | 3 | 4;
export type GridSizeId = `${GridUnit}x${GridUnit}`;
export type GridSpan = { w: number; h: number };

export type CardMountStyle = "tape" | "color-pin" | "metal-pin";

export const DEFAULT_CARD_MOUNT_STYLE: CardMountStyle = "tape";

export type PostcardSide = "front" | "back";

export const DEFAULT_POSTCARD_SIDE: PostcardSide = "front";

export interface BoardPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
  columns: number;
}

export interface GameNote {
  id: string;
  timestamp: number;
  whereLeftOff: string;
  quickThought?: string;
}

export interface Game {
  id: string;
  title: string;
  ticketType?: TicketType;
  mountStyle?: CardMountStyle;
  postcardSide?: PostcardSide;
  board?: BoardPlacement;
  imageUri?: string;
  playtime?: string;
  status: "playing" | "backlog" | "finished" | "dropped";
  lastNote?: GameNote;
  notes: GameNote[];
}
