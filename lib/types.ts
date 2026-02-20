export type TicketType =
  | "polaroid"
  | "postcard"
  | "widget"
  | "ticket"
  | "minimal";

export const DEFAULT_TICKET_TYPE: TicketType = "polaroid";

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
  imageUri?: string;
  playtime?: string;
  status: "playing" | "backlog" | "finished" | "dropped";
  lastNote?: GameNote;
  notes: GameNote[];
}
