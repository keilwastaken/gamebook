import type { Game, TicketType } from "./types";

export const DEFAULT_BOARD_COLUMNS = 4;

export function getCardSpan(ticketType: TicketType | undefined): {
  w: number;
  h: number;
} {
  if (ticketType === "polaroid") return { w: 1, h: 2 };
  if (ticketType === "postcard") return { w: 2, h: 1 };
  if (ticketType === "ticket") return { w: 2, h: 1 };
  if (ticketType === "minimal") return { w: 1, h: 1 };
  if (ticketType === "widget") return { w: 1, h: 1 };
  return { w: 1, h: 1 };
}

export function applyBoardLayout(games: Game[], columns: number): Game[] {
  const occupied = new Set<string>();

  const isFree = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        if (occupied.has(`${col},${row}`)) return false;
      }
    }
    return true;
  };

  const markUsed = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        occupied.add(`${col},${row}`);
      }
    }
  };

  return games.map((game) => {
    const span = getCardSpan(game.ticketType);
    const w = Math.min(span.w, columns);

    let y = 0;
    let x = 0;
    let placed = false;

    while (!placed) {
      for (let candidateX = 0; candidateX <= columns - w; candidateX += 1) {
        if (isFree(candidateX, y, w, span.h)) {
          x = candidateX;
          placed = true;
          break;
        }
      }
      if (!placed) y += 1;
    }

    markUsed(x, y, w, span.h);

    return {
      ...game,
      board: { x, y, w, h: span.h, columns },
    };
  });
}
