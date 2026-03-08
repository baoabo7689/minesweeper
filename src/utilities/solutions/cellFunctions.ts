import type { CubeModel } from '@/models/CubeModel';
import type { CellModel } from '@/models/CellModel';

export type CubeFaceKey = 'up' | 'down' | 'left' | 'right' | 'front' | 'back';

export interface CellRef {
  faceKey: CubeFaceKey;
  rowIndex: number;
  colIndex: number;
}

type FaceEdge = 'top' | 'bottom' | 'left' | 'right';

interface EdgeRef {
  faceKey: CubeFaceKey;
  edge: FaceEdge;
}

interface EdgePair {
  a: EdgeRef;
  b: EdgeRef;
  reverse: boolean;
}

const RELATED_EDGE_PAIRS: EdgePair[] = [
  { a: { faceKey: 'up', edge: 'bottom' }, b: { faceKey: 'front', edge: 'top' }, reverse: false },
  {
    a: { faceKey: 'front', edge: 'bottom' },
    b: { faceKey: 'down', edge: 'top' },
    reverse: false,
  },
  {
    a: { faceKey: 'down', edge: 'bottom' },
    b: { faceKey: 'back', edge: 'bottom' },
    reverse: true,
  },
  { a: { faceKey: 'back', edge: 'top' }, b: { faceKey: 'up', edge: 'top' }, reverse: true },
  { a: { faceKey: 'up', edge: 'left' }, b: { faceKey: 'left', edge: 'top' }, reverse: false },
  {
    a: { faceKey: 'left', edge: 'bottom' },
    b: { faceKey: 'down', edge: 'left' },
    reverse: true,
  },
  {
    a: { faceKey: 'down', edge: 'right' },
    b: { faceKey: 'right', edge: 'bottom' },
    reverse: false,
  },
  { a: { faceKey: 'right', edge: 'top' }, b: { faceKey: 'up', edge: 'bottom' }, reverse: true },
  {
    a: { faceKey: 'front', edge: 'right' },
    b: { faceKey: 'right', edge: 'left' },
    reverse: false,
  },
  {
    a: { faceKey: 'right', edge: 'right' },
    b: { faceKey: 'back', edge: 'left' },
    reverse: false,
  },
  {
    a: { faceKey: 'back', edge: 'right' },
    b: { faceKey: 'left', edge: 'left' },
    reverse: false,
  },
  {
    a: { faceKey: 'left', edge: 'right' },
    b: { faceKey: 'front', edge: 'left' },
    reverse: false,
  },
];

function isInFaceBounds(cube: CubeModel, ref: CellRef) {
  const face = cube[ref.faceKey];

  return (
    ref.rowIndex >= 0 && ref.rowIndex < face.rows && ref.colIndex >= 0 && ref.colIndex < face.cols
  );
}

export function getCell(cube: CubeModel, ref: CellRef): CellModel | null {
  if (!isInFaceBounds(cube, ref)) {
    return null;
  }

  return cube[ref.faceKey].cells[ref.rowIndex]?.[ref.colIndex] ?? null;
}

export function getSameFaceNeighbors(cube: CubeModel, center: CellRef): CellRef[] {
  const neighbors: CellRef[] = [];

  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
      if (rowDelta === 0 && colDelta === 0) {
        continue;
      }

      const neighbor: CellRef = {
        faceKey: center.faceKey,
        rowIndex: center.rowIndex + rowDelta,
        colIndex: center.colIndex + colDelta,
      };

      if (isInFaceBounds(cube, neighbor)) {
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}

function isCellOnEdge(
  cubeModel: CubeModel,
  faceKey: CubeFaceKey,
  edge: FaceEdge,
  rowIndex: number,
  colIndex: number
) {
  const face = cubeModel[faceKey];

  if (edge === 'top') {
    return rowIndex === 0;
  }

  if (edge === 'bottom') {
    return rowIndex === face.rows - 1;
  }

  if (edge === 'left') {
    return colIndex === 0;
  }

  return colIndex === face.cols - 1;
}

function getEdgeIndex(edge: FaceEdge, rowIndex: number, colIndex: number) {
  return edge === 'top' || edge === 'bottom' ? colIndex : rowIndex;
}

function getEdgeLength(cubeModel: CubeModel, faceKey: CubeFaceKey, edge: FaceEdge) {
  const face = cubeModel[faceKey];
  return edge === 'top' || edge === 'bottom' ? face.cols : face.rows;
}

function getCellFromEdgeIndex(
  cubeModel: CubeModel,
  faceKey: CubeFaceKey,
  edge: FaceEdge,
  index: number
): CellRef | null {
  const face = cubeModel[faceKey];

  if (edge === 'top') {
    if (index < 0 || index >= face.cols) {
      return null;
    }

    return { faceKey, rowIndex: 0, colIndex: index };
  }

  if (edge === 'bottom') {
    if (index < 0 || index >= face.cols) {
      return null;
    }

    return { faceKey, rowIndex: face.rows - 1, colIndex: index };
  }

  if (edge === 'left') {
    if (index < 0 || index >= face.rows) {
      return null;
    }

    return { faceKey, rowIndex: index, colIndex: 0 };
  }

  if (index < 0 || index >= face.rows) {
    return null;
  }

  return { faceKey, rowIndex: index, colIndex: face.cols - 1 };
}

function resolveTargetEdgeIndex(
  sourceFaceKey: CubeFaceKey,
  sourceEdge: FaceEdge,
  targetFaceKey: CubeFaceKey,
  targetEdge: FaceEdge,
  sourceIndex: number,
  targetEdgeLength: number,
  reverse: boolean
) {
  const isBackTopToUpTop =
    sourceFaceKey === 'back' &&
    sourceEdge === 'top' &&
    targetFaceKey === 'up' &&
    targetEdge === 'top';

  if (isBackTopToUpTop) {
    return targetEdgeLength - 1 - sourceIndex;
  }

  const isUpTopToBackTop =
    sourceFaceKey === 'up' &&
    sourceEdge === 'top' &&
    targetFaceKey === 'back' &&
    targetEdge === 'top';

  if (isUpTopToBackTop) {
    return targetEdgeLength - 1 - sourceIndex;
  }

  const isBackBottomToDownBottom =
    sourceFaceKey === 'back' &&
    sourceEdge === 'bottom' &&
    targetFaceKey === 'down' &&
    targetEdge === 'bottom';

  if (isBackBottomToDownBottom) {
    return targetEdgeLength - 1 - sourceIndex;
  }

  const isLeftToBackSameOrder =
    sourceFaceKey === 'left' &&
    sourceEdge === 'left' &&
    targetFaceKey === 'back' &&
    targetEdge === 'right';

  if (isLeftToBackSameOrder) {
    return sourceIndex;
  }

  const isBackToLeftSameOrder =
    sourceFaceKey === 'back' &&
    sourceEdge === 'right' &&
    targetFaceKey === 'left' &&
    targetEdge === 'left';

  if (isBackToLeftSameOrder) {
    return sourceIndex;
  }

  const isRightToBackSameOrder =
    sourceFaceKey === 'right' &&
    sourceEdge === 'right' &&
    targetFaceKey === 'back' &&
    targetEdge === 'left';

  if (isRightToBackSameOrder) {
    return sourceIndex;
  }

  const isBackToRightSameOrder =
    sourceFaceKey === 'back' &&
    sourceEdge === 'left' &&
    targetFaceKey === 'right' &&
    targetEdge === 'right';

  if (isBackToRightSameOrder) {
    return sourceIndex;
  }

  return reverse ? targetEdgeLength - 1 - sourceIndex : sourceIndex;
}

export function getRelatedEdgeTargets(
  cubeModel: CubeModel,
  faceKey: CubeFaceKey,
  rowIndex: number,
  colIndex: number
): CellRef[] {
  const relatedTargets: CellRef[] = [];

  RELATED_EDGE_PAIRS.forEach(({ a, b, reverse }) => {
    if (faceKey === a.faceKey && isCellOnEdge(cubeModel, faceKey, a.edge, rowIndex, colIndex)) {
      const sourceIndex = getEdgeIndex(a.edge, rowIndex, colIndex);
      const targetEdgeLength = getEdgeLength(cubeModel, b.faceKey, b.edge);
      const targetIndex = resolveTargetEdgeIndex(
        a.faceKey,
        a.edge,
        b.faceKey,
        b.edge,
        sourceIndex,
        targetEdgeLength,
        reverse
      );
      const target = getCellFromEdgeIndex(cubeModel, b.faceKey, b.edge, targetIndex);

      if (target) {
        relatedTargets.push(target);
      }
    }

    if (faceKey === b.faceKey && isCellOnEdge(cubeModel, faceKey, b.edge, rowIndex, colIndex)) {
      const sourceIndex = getEdgeIndex(b.edge, rowIndex, colIndex);
      const targetEdgeLength = getEdgeLength(cubeModel, a.faceKey, a.edge);
      const targetIndex = resolveTargetEdgeIndex(
        b.faceKey,
        b.edge,
        a.faceKey,
        a.edge,
        sourceIndex,
        targetEdgeLength,
        reverse
      );
      const target = getCellFromEdgeIndex(cubeModel, a.faceKey, a.edge, targetIndex);

      if (target) {
        relatedTargets.push(target);
      }
    }
  });

  if (faceKey === 'up' && rowIndex === 0) {
    const backCols = cubeModel.back.cols;
    const mirroredColIndex = backCols - 1 - colIndex;

    if (mirroredColIndex >= 0 && mirroredColIndex < backCols) {
      relatedTargets.push({ faceKey: 'back', rowIndex: 0, colIndex: mirroredColIndex });
    }
  }

  if (cubeModel.deep === 1) {
    if (faceKey === 'front') {
      relatedTargets.push({ faceKey: 'back', rowIndex, colIndex });
    }

    if (faceKey === 'back') {
      const frontCols = cubeModel.front.cols;
      const mirroredColIndex = frontCols - 1 - colIndex;

      if (mirroredColIndex >= 0 && mirroredColIndex < frontCols) {
        relatedTargets.push({ faceKey: 'front', rowIndex, colIndex: mirroredColIndex });
      }
    }
  }

  return relatedTargets;
}
