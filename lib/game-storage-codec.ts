import {
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
  type BoardPlacement,
  type CardMountStyle,
  type Game,
  type GameNote,
  type PostcardSide,
  type TicketType,
} from "./types";

const VALID_TICKET_TYPES: ReadonlySet<TicketType> = new Set([
  "polaroid",
  "postcard",
  "widget",
  "ticket",
  "minimal",
]);
const VALID_CARD_MOUNT_STYLES: ReadonlySet<CardMountStyle> = new Set([
  "tape",
  "color-pin",
  "metal-pin",
]);
const VALID_POSTCARD_SIDES: ReadonlySet<PostcardSide> = new Set(["front", "back"]);
const VALID_STATUSES: ReadonlySet<Game["status"]> = new Set([
  "playing",
  "backlog",
  "finished",
  "dropped",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTicketType(value: unknown): value is TicketType {
  return typeof value === "string" && VALID_TICKET_TYPES.has(value as TicketType);
}

function isCardMountStyle(value: unknown): value is CardMountStyle {
  return typeof value === "string" && VALID_CARD_MOUNT_STYLES.has(value as CardMountStyle);
}

function isPostcardSide(value: unknown): value is PostcardSide {
  return typeof value === "string" && VALID_POSTCARD_SIDES.has(value as PostcardSide);
}

function isGameStatus(value: unknown): value is Game["status"] {
  return typeof value === "string" && VALID_STATUSES.has(value as Game["status"]);
}

function decodeBoardPlacement(value: unknown): BoardPlacement | null {
  if (!isRecord(value)) return null;
  const { x, y, w, h, columns } = value;
  if (
    !isNumber(x) ||
    !isNumber(y) ||
    !isNumber(w) ||
    !isNumber(h) ||
    !isNumber(columns)
  ) {
    return null;
  }
  return { x, y, w, h, columns };
}

function decodeGameNote(value: unknown): GameNote | null {
  if (!isRecord(value)) return null;
  const { id, timestamp, whereLeftOff, quickThought } = value;
  if (
    typeof id !== "string" ||
    !isNumber(timestamp) ||
    typeof whereLeftOff !== "string"
  ) {
    return null;
  }
  if (quickThought !== undefined && typeof quickThought !== "string") {
    return null;
  }
  return {
    id,
    timestamp,
    whereLeftOff,
    ...(quickThought !== undefined ? { quickThought } : {}),
  };
}

function decodeGame(value: unknown): Game | null {
  if (!isRecord(value)) return null;
  const { id, title, status, notes } = value;
  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    !isGameStatus(status) ||
    !Array.isArray(notes)
  ) {
    return null;
  }

  const decodedNotes = notes
    .map((note) => decodeGameNote(note))
    .filter((note): note is GameNote => note !== null);
  if (decodedNotes.length !== notes.length) return null;

  const ticketType = isTicketType(value.ticketType)
    ? value.ticketType
    : DEFAULT_TICKET_TYPE;
  const mountStyle = isCardMountStyle(value.mountStyle)
    ? value.mountStyle
    : DEFAULT_CARD_MOUNT_STYLE;
  const postcardSide = isPostcardSide(value.postcardSide)
    ? value.postcardSide
    : DEFAULT_POSTCARD_SIDE;

  const board = value.board === undefined ? undefined : decodeBoardPlacement(value.board);
  if (value.board !== undefined && board === null) return null;

  const lastNote = value.lastNote === undefined ? undefined : decodeGameNote(value.lastNote);
  if (value.lastNote !== undefined && lastNote === null) return null;

  const game: Game = {
    id,
    title,
    status,
    notes: decodedNotes,
    ticketType,
    mountStyle,
    postcardSide,
  };

  if (board) game.board = board;
  if (lastNote) game.lastNote = lastNote;
  if (typeof value.imageUri === "string") game.imageUri = value.imageUri;
  if (typeof value.playtime === "string") game.playtime = value.playtime;

  return game;
}

export function decodeStoredGames(raw: string): Game[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const games: Game[] = [];
  for (const entry of parsed) {
    const game = decodeGame(entry);
    if (!game) return null;
    games.push(game);
  }
  return games;
}
