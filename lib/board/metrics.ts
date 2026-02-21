import { TAB_BAR_HEIGHT_RATIO } from "@/constants/layout";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board-layout";

export const BOARD_GAP = 8;
export const BOARD_SIDE_PADDING = 16;
export const BOARD_TOP_PADDING = 16;
export const BOARD_MIN_WIDTH = 200;
export const BOARD_MAX_WIDTH = 680;
export const BOARD_ROW_HEIGHT_RATIO = 1.28;

export interface BoardMetrics {
  columns: number;
  boardWidth: number;
  cellWidth: number;
  rowHeight: number;
}

export function getBoardWidth(screenWidth: number): number {
  const available = Math.max(BOARD_MIN_WIDTH, screenWidth - BOARD_SIDE_PADDING * 2);
  return Math.min(available, BOARD_MAX_WIDTH);
}

export function getBoardMetrics(
  screenWidth: number,
  columns: number = DEFAULT_BOARD_COLUMNS
): BoardMetrics {
  const safeColumns = Math.max(1, columns);
  const boardWidth = getBoardWidth(screenWidth);
  const cellWidth = (boardWidth - BOARD_GAP * (safeColumns - 1)) / safeColumns;
  const rowHeight = cellWidth * BOARD_ROW_HEIGHT_RATIO;

  return {
    columns: safeColumns,
    boardWidth,
    cellWidth,
    rowHeight,
  };
}

export function getBoardScrollBottomPadding(
  screenWidth: number,
  safeAreaBottom: number
): number {
  return Math.ceil(screenWidth * TAB_BAR_HEIGHT_RATIO + safeAreaBottom + 12);
}
