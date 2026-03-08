import type { CubeModel } from '@/models/CubeModel';
import type { CellModel } from '@/models/CellModel';
import type { CellRef, CubeFaceKey } from './cellFunctions';
import { getCell, getRelatedEdgeTargets } from './cellFunctions';

const FACE_KEYS: CubeFaceKey[] = ['front'];

function markCellAsSafe(nextCube: CubeModel, sourceCube: CubeModel, target: CellRef) {
  const targetCell = getCell(nextCube, target);
  if (!targetCell || targetCell.value !== 'Undetermined') {
    return;
  }

  const targets: CellRef[] = [
    target,
    ...getRelatedEdgeTargets(sourceCube, target.faceKey, target.rowIndex, target.colIndex),
  ];

  const uniqueTargetMap = new Map<string, CellRef>();
  targets.forEach((ref) => {
    uniqueTargetMap.set(`${ref.faceKey}-${ref.rowIndex}-${ref.colIndex}`, ref);
  });

  uniqueTargetMap.forEach((ref) => {
    const refCell = getCell(nextCube, ref);
    if (!refCell || refCell.value !== 'Undetermined') {
      return;
    }

    const face = nextCube[ref.faceKey];
    const nextCells = face.cells.map((row) => [...row]);

    nextCells[ref.rowIndex][ref.colIndex] = {
      ...refCell,
      value: 'HSafe',
    };

    nextCube[ref.faceKey] = {
      ...face,
      cells: nextCells,
    };
  });
}

function is121Pattern(left: CellModel, center: CellModel, right: CellModel) {
  return (
    left.remainDedicatedBombCount === 1 &&
    center.remainDedicatedBombCount === 2 &&
    right.remainDedicatedBombCount === 1
  );
}

function is1221Pattern(a: CellModel, b: CellModel, c: CellModel, d: CellModel) {
  return (
    a.remainDedicatedBombCount === 1 &&
    b.remainDedicatedBombCount === 2 &&
    c.remainDedicatedBombCount === 2 &&
    d.remainDedicatedBombCount === 1
  );
}

function isSameCell(a: CellRef, b: CellRef) {
  return a.faceKey === b.faceKey && a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
}

function isAdjacentCell(a: CellRef, b: CellRef) {
  return (
    a.faceKey === b.faceKey &&
    !isSameCell(a, b) &&
    Math.abs(a.rowIndex - b.rowIndex) <= 1 &&
    Math.abs(a.colIndex - b.colIndex) <= 1
  );
}

// 1-2-1 horizontal: cells above and below the center "2" are safe.
export function apply121HorizontalPatternHint(cube: CubeModel): CubeModel {
  let nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex <= face.cols - 3; colIndex += 1) {
        const leftRef: CellRef = { faceKey, rowIndex, colIndex };
        const centerRef: CellRef = { faceKey, rowIndex, colIndex: colIndex + 1 };
        const rightRef: CellRef = { faceKey, rowIndex, colIndex: colIndex + 2 };

        const leftCell = getCell(cube, leftRef);
        const centerCell = getCell(cube, centerRef);
        const rightCell = getCell(cube, rightRef);

        if (!leftCell || !centerCell || !rightCell) {
          continue;
        }

        if (!is121Pattern(leftCell, centerCell, rightCell)) {
          continue;
        }

        markCellAsSafe(nextCube, cube, {
          faceKey,
          rowIndex: rowIndex - 1,
          colIndex: colIndex + 1,
        });

        markCellAsSafe(nextCube, cube, {
          faceKey,
          rowIndex: rowIndex + 1,
          colIndex: colIndex + 1,
        });
      }
    }
  });

  return nextCube;
}

// 1-2-1 vertical: cells to the left and right of the center "2" are safe.
export function apply121VerticalPatternHint(cube: CubeModel): CubeModel {
  let nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex <= face.rows - 3; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const topRef: CellRef = { faceKey, rowIndex, colIndex };
        const centerRef: CellRef = { faceKey, rowIndex: rowIndex + 1, colIndex };
        const bottomRef: CellRef = { faceKey, rowIndex: rowIndex + 2, colIndex };

        const topCell = getCell(cube, topRef);
        const centerCell = getCell(cube, centerRef);
        const bottomCell = getCell(cube, bottomRef);

        if (!topCell || !centerCell || !bottomCell) {
          continue;
        }

        if (!is121Pattern(topCell, centerCell, bottomCell)) {
          continue;
        }

        markCellAsSafe(nextCube, cube, {
          faceKey,
          rowIndex: rowIndex + 1,
          colIndex: colIndex - 1,
        });

        markCellAsSafe(nextCube, cube, {
          faceKey,
          rowIndex: rowIndex + 1,
          colIndex: colIndex + 1,
        });
      }
    }
  });

  return nextCube;
}

// 1-2-2-1 horizontal: cells beside each outer "1" (outside the pattern) are safe.
export function apply1221HorizontalPatternHint(cube: CubeModel): CubeModel {
  let nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex <= face.cols - 4; colIndex += 1) {
        const firstRef: CellRef = { faceKey, rowIndex, colIndex };
        const secondRef: CellRef = { faceKey, rowIndex, colIndex: colIndex + 1 };
        const thirdRef: CellRef = { faceKey, rowIndex, colIndex: colIndex + 2 };
        const fourthRef: CellRef = { faceKey, rowIndex, colIndex: colIndex + 3 };

        const firstCell = getCell(cube, firstRef);
        const secondCell = getCell(cube, secondRef);
        const thirdCell = getCell(cube, thirdRef);
        const fourthCell = getCell(cube, fourthRef);

        if (!firstCell || !secondCell || !thirdCell || !fourthCell) {
          continue;
        }

        if (!is1221Pattern(firstCell, secondCell, thirdCell, fourthCell)) {
          continue;
        }

        const oneRefs: CellRef[] = [firstRef, fourthRef];
        const twoRefs: CellRef[] = [secondRef, thirdRef];
        const patternRefs: CellRef[] = [firstRef, secondRef, thirdRef, fourthRef];

        oneRefs.forEach((oneRef) => {
          for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
            for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
              const candidate: CellRef = {
                faceKey,
                rowIndex: oneRef.rowIndex + rowDelta,
                colIndex: oneRef.colIndex + colDelta,
              };

              if (patternRefs.some((ref) => isSameCell(ref, candidate))) {
                continue;
              }

              const isAdjacentToBothTwos =
                isAdjacentCell(candidate, twoRefs[0]) && isAdjacentCell(candidate, twoRefs[1]);

              if (isAdjacentToBothTwos) {
                continue;
              }

              markCellAsSafe(nextCube, cube, candidate);
            }
          }
        });
      }
    }
  });

  return nextCube;
}

// 1-2-2-1 vertical: cells adjacent to each outer "1" but not adjacent to both "2" cells are safe.
export function apply1221VerticalPatternHint(cube: CubeModel): CubeModel {
  let nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex <= face.rows - 4; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const firstRef: CellRef = { faceKey, rowIndex, colIndex };
        const secondRef: CellRef = { faceKey, rowIndex: rowIndex + 1, colIndex };
        const thirdRef: CellRef = { faceKey, rowIndex: rowIndex + 2, colIndex };
        const fourthRef: CellRef = { faceKey, rowIndex: rowIndex + 3, colIndex };

        const firstCell = getCell(cube, firstRef);
        const secondCell = getCell(cube, secondRef);
        const thirdCell = getCell(cube, thirdRef);
        const fourthCell = getCell(cube, fourthRef);

        if (!firstCell || !secondCell || !thirdCell || !fourthCell) {
          continue;
        }

        if (!is1221Pattern(firstCell, secondCell, thirdCell, fourthCell)) {
          continue;
        }

        const oneRefs: CellRef[] = [firstRef, fourthRef];
        const twoRefs: CellRef[] = [secondRef, thirdRef];
        const patternRefs: CellRef[] = [firstRef, secondRef, thirdRef, fourthRef];

        oneRefs.forEach((oneRef) => {
          for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
            for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
              const candidate: CellRef = {
                faceKey,
                rowIndex: oneRef.rowIndex + rowDelta,
                colIndex: oneRef.colIndex + colDelta,
              };

              if (patternRefs.some((ref) => isSameCell(ref, candidate))) {
                continue;
              }

              const isAdjacentToBothTwos =
                isAdjacentCell(candidate, twoRefs[0]) && isAdjacentCell(candidate, twoRefs[1]);

              if (isAdjacentToBothTwos) {
                continue;
              }

              markCellAsSafe(nextCube, cube, candidate);
            }
          }
        });
      }
    }
  });

  return nextCube;
}

// Extension point for advanced pattern-based hint rules.
export function applyPatternHints(cube: CubeModel): CubeModel {
  let nextCube = cube;

  nextCube = apply121HorizontalPatternHint(nextCube);
  nextCube = apply121VerticalPatternHint(nextCube);
  nextCube = apply1221HorizontalPatternHint(nextCube);
  nextCube = apply1221VerticalPatternHint(nextCube);

  return nextCube;
}
