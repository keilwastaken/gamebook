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
  progress: number;
}

export interface Game {
  id: string;
  title: string;
  ticketType?: TicketType;
  imageUri?: string;
  playtime?: string;
  progress: number;
  status: "playing" | "backlog" | "finished" | "dropped";
  lastNote?: GameNote;
  notes: GameNote[];
}
