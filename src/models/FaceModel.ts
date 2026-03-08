import type { faceNameType } from '@/consts/minesweeper_types';
import type { CellModel } from '@/models/CellModel';

export interface FaceModel {
  faceName: faceNameType;
  rows: number;
  cols: number;
  cells: CellModel[][];
}
