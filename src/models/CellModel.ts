import type { CellValueType } from '@/consts/minesweeper_types';

export interface CellModel {
  row: number;
  col: number;
  value: CellValueType;
  adjacentBombCount: number;
  remainDedicatedBombCount: number;
  dedicatedBombCells: Array<{ row: number; col: number }>;
  historyCheck?: Array<string>;
  minDedicatedCells: {
    minDedicatedBombCount: number;
    cells: Array<{ row: number; col: number }>;
  };
  maxDedicatedCells: {
    maxDedicatedBombCount: number;
    cells: Array<{ row: number; col: number }>;
  };

  isRevealed: boolean;
  isFlagged: boolean;
}

export function setAdjacentBombCount(cellModel: CellModel, adjacentBombCount: number): CellModel {
  return {
    ...cellModel,
    adjacentBombCount,
  };
}
