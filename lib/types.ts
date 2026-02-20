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
  imageUri?: string;
  playtime?: string;
  progress: number;
  status: "playing" | "backlog" | "finished" | "dropped";
  lastNote?: GameNote;
  notes: GameNote[];
}
