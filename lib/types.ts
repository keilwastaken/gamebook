export type TicketType =
  | "polaroid"
  | "postcard"
  | "widget"
  | "ticket"
  | "minimal";

export const DEFAULT_TICKET_TYPE: TicketType = "polaroid";

export type CardMountStyle = "tape" | "color-pin" | "metal-pin";

export const DEFAULT_CARD_MOUNT_STYLE: CardMountStyle = "tape";

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
  imageUri?: string;
  playtime?: string;
  status: "playing" | "backlog" | "finished" | "dropped";
  lastNote?: GameNote;
  notes: GameNote[];
}
