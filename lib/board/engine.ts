import { constrainSpanForCard, getCardSpan } from "@/lib/board-layout";
import type { BoardPlacement, Game, TicketType } from "@/lib/types";

export type GridRect = { x: number; y: number; w: number; h: number };
export type GridCell = { x: number; y: number };

export function chooseNearestAllowedSpan(
  presets: { w: number; h: number }[],
  intent: { w: number; h: number },
  fallback: { w: number; h: number }
): { w: number; h: number } {
  const exact = presets.find((preset) => preset.w === intent.w && preset.h === intent.h);
  if (exact) return exact;

  const fallbackPreset =
    presets.find((preset) => preset.w === fallback.w && preset.h === fallback.h) ?? presets[0];

  return presets.reduce((best, preset) => {
    const bestScore = Math.abs(best.w - intent.w) + Math.abs(best.h - intent.h);
    const nextScore = Math.abs(preset.w - intent.w) + Math.abs(preset.h - intent.h);
    if (nextScore < bestScore) return preset;
    if (nextScore > bestScore) return best;

    const bestAreaDelta = Math.abs(best.w * best.h - intent.w * intent.h);
    const nextAreaDelta = Math.abs(preset.w * preset.h - intent.w * intent.h);
    if (nextAreaDelta < bestAreaDelta) return preset;
    if (nextAreaDelta > bestAreaDelta) return best;

    const bestIsFallback = best.w === fallbackPreset.w && best.h === fallbackPreset.h;
    const nextIsFallback = preset.w === fallbackPreset.w && preset.h === fallbackPreset.h;
    if (nextIsFallback && !bestIsFallback) return preset;

    return best;
  }, fallbackPreset);
}

export function normalizePlacementForGame(game: Game, columns: number): BoardPlacement {
  const rawSpan = game.board ? { w: game.board.w, h: game.board.h } : getCardSpan(game.ticketType);
  const span = constrainSpanForCard(game.ticketType, rawSpan, columns);
  const maxX = Math.max(0, columns - span.w);

  return {
    x: Math.max(0, Math.min(game.board?.x ?? 0, maxX)),
    y: Math.max(0, game.board?.y ?? 0),
    w: span.w,
    h: span.h,
    columns,
  };
}

export function normalizePlacementForTicketTarget(
  ticketType: TicketType | undefined,
  target: GridRect,
  columns: number
): GridRect {
  const span = constrainSpanForCard(ticketType, { w: target.w, h: target.h }, columns);
  const maxX = Math.max(0, columns - span.w);

  return {
    x: Math.max(0, Math.min(target.x, maxX)),
    y: Math.max(0, target.y),
    w: span.w,
    h: span.h,
  };
}

export function normalizePlacementForGameTarget(
  game: Game,
  target: GridRect,
  columns: number
): BoardPlacement {
  const span = constrainSpanForCard(game.ticketType, { w: target.w, h: target.h }, columns);
  const maxX = Math.max(0, columns - span.w);

  return {
    x: Math.max(0, Math.min(target.x, maxX)),
    y: Math.max(0, target.y),
    w: span.w,
    h: span.h,
    columns,
  };
}

export function samePlacement(a: BoardPlacement, b: BoardPlacement): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.columns === b.columns;
}

export function getDropTargetConflictCells(
  games: Game[],
  draggingGameId: string,
  target: GridRect,
  columns: number
): GridCell[] {
  const draggingGame = games.find((game) => game.id === draggingGameId);
  if (!draggingGame) return [];

  const placements = new Map<string, GridRect>();
  for (const game of games) {
    placements.set(game.id, normalizePlacementForGame(game, columns));
  }

  const movingTo = normalizePlacementForTicketTarget(draggingGame.ticketType, target, columns);
  const occupied = new Set<string>();
  for (const game of games) {
    if (game.id === draggingGameId) continue;
    const placement = placements.get(game.id);
    if (!placement) continue;
    for (let y = placement.y; y < placement.y + placement.h; y += 1) {
      for (let x = placement.x; x < placement.x + placement.w; x += 1) {
        occupied.add(`${x},${y}`);
      }
    }
  }

  const conflicts: GridCell[] = [];
  for (let y = movingTo.y; y < movingTo.y + movingTo.h; y += 1) {
    for (let x = movingTo.x; x < movingTo.x + movingTo.w; x += 1) {
      if (occupied.has(`${x},${y}`)) conflicts.push({ x, y });
    }
  }

  return conflicts;
}

export function commitMoveStrictNoOverlap(
  games: Game[],
  gameId: string,
  target: GridRect,
  columns: number
): Game[] {
  const movingGame = games.find((game) => game.id === gameId);
  if (!movingGame) return games;

  const movingFrom = normalizePlacementForGame(movingGame, columns);
  const movingTo = normalizePlacementForGameTarget(movingGame, target, columns);
  if (samePlacement(movingFrom, movingTo)) return games;
  if (getDropTargetConflictCells(games, gameId, target, columns).length > 0) return games;

  return games.map((game) =>
    game.id === gameId ? { ...game, board: movingTo } : game
  );
}
