import type { CubeModel } from '@/models/CubeModel';
import type { CellModel } from '@/models/CellModel';
import type { FaceModel } from '@/models/FaceModel';

export type RotationDirection = 'clockwise' | 'counterclockwise' | 'halfturn';

export function rotateMatrixClockwise<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  return Array.from({ length: cols }, (_, rowIndex) =>
    Array.from({ length: rows }, (_, colIndex) => matrix[rows - 1 - colIndex][rowIndex])
  );
}

export function rotateMatrixCounterclockwise<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  return Array.from({ length: cols }, (_, rowIndex) =>
    Array.from({ length: rows }, (_, colIndex) => matrix[colIndex][cols - 1 - rowIndex])
  );
}

export function rotateMatrixHalfTurn<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => matrix[rows - 1 - rowIndex][cols - 1 - colIndex])
  );
}

export function reverseMatrixColumns<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  const cols = matrix[0].length;

  return matrix.map((row) =>
    Array.from({ length: cols }, (_, colIndex) => row[cols - 1 - colIndex])
  );
}

export function reverseMatrixRows<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return [];
  }

  const rows = matrix.length;

  return Array.from({ length: rows }, (_, rowIndex) => matrix[rows - 1 - rowIndex]);
}

export function rotateMatrix<T>(matrix: T[][], direction: RotationDirection): T[][] {
  if (direction === 'clockwise') {
    return rotateMatrixClockwise(matrix);
  }

  if (direction === 'counterclockwise') {
    return rotateMatrixCounterclockwise(matrix);
  }

  return rotateMatrixHalfTurn(matrix);
}

function withNormalizedCellCoordinates(cells: CellModel[][]): CellModel[][] {
  return cells.map((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      ...cell,
      row: rowIndex,
      col: colIndex,
    }))
  );
}

function cloneFace(face: FaceModel): FaceModel {
  return {
    ...face,
    cells: withNormalizedCellCoordinates(face.cells.map((row) => row.map((cell) => ({ ...cell })))),
  };
}

export function rotateFace(face: FaceModel, direction: RotationDirection): FaceModel {
  const rotatedCells = rotateMatrix(face.cells, direction);
  const normalizedCells = withNormalizedCellCoordinates(rotatedCells);

  return {
    ...face,
    rows: normalizedCells.length,
    cols: normalizedCells[0]?.length ?? 0,
    cells: normalizedCells,
  };
}

export function reverseFaceColumns(face: FaceModel): FaceModel {
  const reversedCells = reverseMatrixColumns(face.cells);
  const normalizedCells = withNormalizedCellCoordinates(reversedCells);

  return {
    ...face,
    rows: normalizedCells.length,
    cols: normalizedCells[0]?.length ?? 0,
    cells: normalizedCells,
  };
}

export function reverseFaceRows(face: FaceModel): FaceModel {
  const reversedCells = reverseMatrixRows(face.cells);
  const normalizedCells = withNormalizedCellCoordinates(reversedCells);

  return {
    ...face,
    rows: normalizedCells.length,
    cols: normalizedCells[0]?.length ?? 0,
    cells: normalizedCells,
  };
}

export function rotateLR(cube: CubeModel): CubeModel {
  return {
    ...cube,
    width: cube.deep,
    deep: cube.width,
    // left -> front -> right -> back with same order
    front: cloneFace(cube.left),
    right: cloneFace(cube.front),
    back: cloneFace(cube.right),
    left: cloneFace(cube.back),
    up: rotateFace(cube.up, 'counterclockwise'),
    down: rotateFace(cube.down, 'clockwise'),
  };
}

export function rotateUD(cube: CubeModel): CubeModel {
  return {
    ...cube,
    height: cube.deep,
    deep: cube.height,
    // up -> front -> down -> back [row+column reverse] -> up [row+column reverse]
    front: cloneFace(cube.up),
    down: cloneFace(cube.front),
    back: rotateFace(cube.down, 'halfturn'),
    up: rotateFace(cube.back, 'halfturn'),
    right: rotateFace(cube.right, 'counterclockwise'),
    left: rotateFace(cube.left, 'clockwise'),
  };
}
