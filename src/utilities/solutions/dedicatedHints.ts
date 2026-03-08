import type { CubeModel } from '@/models/CubeModel';
import type { CubeFaceKey } from './cellFunctions';
import { getCell, getSameFaceNeighbors } from './cellFunctions';

const FACE_KEYS: CubeFaceKey[] = ['front'];

function toCellKey(row: number, col: number) {
  return `${row}-${col}`;
}

function fromCellKey(key: string) {
  const [row, col] = key.split('-').map((value) => Number.parseInt(value, 10));
  return { row, col };
}

function getReduceDedicatedCandidates(
  cube: CubeModel,
  faceKey: CubeFaceKey,
  row: number,
  col: number
) {
  const face = cube[faceKey];
  const candidates: Array<{ rowIndex: number; colIndex: number }> = [];

  for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
    for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
      if (rowIndex === row && colIndex === col) {
        continue;
      }

      const isWithinOneRow = Math.abs(rowIndex - row) <= 2;
      const isWithinOneColumn = Math.abs(colIndex - col) <= 2;

      if (!isWithinOneRow || !isWithinOneColumn) {
        continue;
      }

      candidates.push({ rowIndex, colIndex });
    }
  }

  candidates.sort((a, b) => {
    const aRowDistance = Math.abs(a.rowIndex - row);
    const aColDistance = Math.abs(a.colIndex - col);
    const bRowDistance = Math.abs(b.rowIndex - row);
    const bColDistance = Math.abs(b.colIndex - col);

    const aManhattan = aRowDistance + aColDistance;
    const bManhattan = bRowDistance + bColDistance;
    if (aManhattan !== bManhattan) {
      return aManhattan - bManhattan;
    }

    const aEuclideanSquared = aRowDistance * aRowDistance + aColDistance * aColDistance;
    const bEuclideanSquared = bRowDistance * bRowDistance + bColDistance * bColDistance;
    if (aEuclideanSquared !== bEuclideanSquared) {
      return aEuclideanSquared - bEuclideanSquared;
    }

    if (a.rowIndex !== b.rowIndex) {
      return a.rowIndex - b.rowIndex;
    }

    return a.colIndex - b.colIndex;
  });

  return candidates;
}

export function preprocessDedicated(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];
    const nextCells = face.cells.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const hasMaxInfo =
          !!cell.maxDedicatedCells &&
          (cell.maxDedicatedCells.maxDedicatedBombCount > 0 ||
            cell.maxDedicatedCells.cells.length > 0);
        const hasMinInfo =
          !!cell.minDedicatedCells &&
          (cell.minDedicatedCells.minDedicatedBombCount > 0 ||
            cell.minDedicatedCells.cells.length > 0);
        const hasHistoryInfo = !!cell.historyCheck && cell.historyCheck.length > 0;

        if (cell.adjacentBombCount <= 0) {
          return {
            ...cell,
            dedicatedBombCells: [],
            historyCheck: hasHistoryInfo ? cell.historyCheck : [],
            remainDedicatedBombCount: 0,
            minDedicatedCells: hasMinInfo
              ? cell.minDedicatedCells
              : {
                  minDedicatedBombCount: 0,
                  cells: [],
                },
            maxDedicatedCells: hasMaxInfo
              ? cell.maxDedicatedCells
              : {
                  maxDedicatedBombCount: 0,
                  cells: [],
                },
          };
        }

        const neighbors = getSameFaceNeighbors(cube, { faceKey, rowIndex, colIndex })
          .map((ref) => ({ ref, cell: getCell(cube, ref) }))
          .filter((entry) => !!entry.cell);

        const dedicatedBombCells = neighbors
          .filter(
            (entry) => entry.cell?.value === 'Undetermined' && entry.cell?.adjacentBombCount === 0
          )
          .map((entry) => ({ row: entry.ref.rowIndex, col: entry.ref.colIndex }));

        const adjacentBombLikeCount = neighbors.filter(
          (entry) =>
            !!entry.cell &&
            (entry.cell.isFlagged ||
              entry.cell.value === 'Flag' ||
              entry.cell.value === 'HBomb' ||
              entry.cell.value === 'Bomb')
        ).length;

        return {
          ...cell,
          dedicatedBombCells,
          historyCheck: hasHistoryInfo ? cell.historyCheck : [],
          remainDedicatedBombCount: cell.adjacentBombCount - adjacentBombLikeCount,
          minDedicatedCells: hasMinInfo
            ? cell.minDedicatedCells
            : {
                minDedicatedBombCount: 0,
                cells: [],
              },
          maxDedicatedCells: hasMaxInfo
            ? cell.maxDedicatedCells
            : {
                maxDedicatedBombCount: 0,
                cells: [],
              },
        };
      })
    );

    nextCube[faceKey] = {
      ...face,
      cells: nextCells,
    };
  });

  return nextCube;
}

export function reduceDedicated(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const cellA = nextCube[faceKey].cells[rowIndex]?.[colIndex];
        if (
          !cellA ||
          cellA.remainDedicatedBombCount <= 0 ||
          cellA.dedicatedBombCells.length === 0
        ) {
          continue;
        }

        let nextRemainDedicatedBombCount = cellA.remainDedicatedBombCount;
        let nextDedicatedBombCells = [...cellA.dedicatedBombCells];

        const reduceCandidates = getReduceDedicatedCandidates(
          nextCube,
          faceKey,
          rowIndex,
          colIndex
        );
        reduceCandidates.forEach((ref) => {
          const cellB = nextCube[faceKey].cells[ref.rowIndex]?.[ref.colIndex];
          if (
            !cellB ||
            cellB.remainDedicatedBombCount <= 0 ||
            cellB.dedicatedBombCells.length === 0
          ) {
            return;
          }

          const cellAKeySet = new Set(
            nextDedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
          );
          const cellBKeySet = new Set(
            cellB.dedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
          );

          const isSubset = [...cellBKeySet].every((key) => cellAKeySet.has(key));
          if (!isSubset) {
            return;
          }

          nextRemainDedicatedBombCount -= cellB.remainDedicatedBombCount;
          nextDedicatedBombCells = nextDedicatedBombCells.filter(
            (entry) => !cellBKeySet.has(toCellKey(entry.row, entry.col))
          );
        });

        const nextFace = nextCube[faceKey];
        const nextCells = nextFace.cells.map((row) => [...row]);

        nextCells[rowIndex][colIndex] = {
          ...cellA,
          remainDedicatedBombCount: nextRemainDedicatedBombCount,
          dedicatedBombCells: nextDedicatedBombCells,
        };

        nextCube[faceKey] = {
          ...nextFace,
          cells: nextCells,
        };
      }
    }
  });

  return nextCube;
}

export function highComplexityBomb(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  const placedBombLikeCount = FACE_KEYS.reduce((total, faceKey) => {
    const face = cube[faceKey];

    return (
      total +
      face.cells
        .flat()
        .filter(
          (cell) =>
            cell.isFlagged ||
            cell.value === 'Flag' ||
            cell.value === 'Bomb' ||
            cell.value === 'HBomb'
        ).length
    );
  }, 0);

  const remainingBombCapacity = Math.max(0, cube.bombCount - placedBombLikeCount);

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const cellA = cube[faceKey].cells[rowIndex]?.[colIndex];
        if (
          !cellA ||
          cellA.remainDedicatedBombCount <= 0 ||
          cellA.dedicatedBombCells.length === 0
        ) {
          continue;
        }

        if (rowIndex === 3 && colIndex === 3) {
          debugger;
        }

        const cellAKeySet = new Set(
          cellA.dedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
        );
        const intersectionKeySet = new Set<string>();
        const historyCheck = new Set<string>(cellA.historyCheck ?? []);
        let sumMax = 0;
        let minDedicatedBombCount = cellA.remainDedicatedBombCount;

        const reduceCandidates = getReduceDedicatedCandidates(cube, faceKey, rowIndex, colIndex);
        reduceCandidates.forEach((ref) => {
          const cellB = cube[faceKey].cells[ref.rowIndex]?.[ref.colIndex];
          if (
            !cellB ||
            cellB.remainDedicatedBombCount <= 0 ||
            cellB.dedicatedBombCells.length === 0 ||
            cellB.remainDedicatedBombCount >= minDedicatedBombCount
          ) {
            return;
          }

          const cellBHistoryKey = `max-${ref.rowIndex}-${ref.colIndex}`;
          if (historyCheck.has(cellBHistoryKey)) {
            return;
          }

          const cellBKeySet = new Set(
            cellB.dedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
          );
          const isSubset = [...cellBKeySet].every((key) => cellAKeySet.has(key));
          if (!isSubset) {
            return;
          }

          const intersectionKeys = [...cellBKeySet].filter((key) => cellAKeySet.has(key));

          if (intersectionKeys.length === 0) {
            return;
          }

          intersectionKeys.forEach((key) => {
            intersectionKeySet.add(key);
          });

          const candidateMax = Math.min(cellB.remainDedicatedBombCount, remainingBombCapacity);
          const remainingForSum = Math.max(0, remainingBombCapacity - sumMax);
          sumMax += Math.min(candidateMax, remainingForSum);
          minDedicatedBombCount -= sumMax;
          historyCheck.add(cellBHistoryKey);
        });

        const excludedKeys = [...cellAKeySet].filter((key) => !intersectionKeySet.has(key));
        const excludedCells = excludedKeys.map((key) => {
          const target = fromCellKey(key);
          return { row: target.row, col: target.col };
        });

        const currentFace = nextCube[faceKey];
        const currentCells = currentFace.cells.map((row) => [...row]);
        const currentCell = currentCells[rowIndex][colIndex];
        const shouldUpdateMinDedicatedCells =
          !currentCell.minDedicatedCells ||
          minDedicatedBombCount < currentCell.minDedicatedCells.minDedicatedBombCount;
        currentCells[rowIndex][colIndex] = {
          ...currentCell,
          historyCheck: [...historyCheck],
          minDedicatedCells: shouldUpdateMinDedicatedCells
            ? {
                minDedicatedBombCount,
                cells: excludedCells,
              }
            : currentCell.minDedicatedCells,
        };
        nextCube[faceKey] = {
          ...currentFace,
          cells: currentCells,
        };

        if (excludedKeys.length === 0) {
          continue;
        }

        if (minDedicatedBombCount !== excludedKeys.length) {
          continue;
        }

        excludedKeys.forEach((key) => {
          const target = fromCellKey(key);
          const targetCell = nextCube[faceKey].cells[target.row]?.[target.col];
          if (!targetCell || targetCell.value !== 'Undetermined') {
            return;
          }

          const nextFace = nextCube[faceKey];
          const nextCells = nextFace.cells.map((row) => [...row]);

          nextCells[target.row][target.col] = {
            ...targetCell,
            value: 'HBomb',
            isFlagged: true,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
            dedicatedBombCells: [],
            minDedicatedCells: {
              minDedicatedBombCount: 0,
              cells: [],
            },
            maxDedicatedCells: {
              maxDedicatedBombCount: 0,
              cells: [],
            },
          };

          nextCube[faceKey] = {
            ...nextFace,
            cells: nextCells,
          };
        });
      }
    }
  });

  return nextCube;
}

export function highComplexitySafe(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const cellA = cube[faceKey].cells[rowIndex]?.[colIndex];

        if (rowIndex === 1 && colIndex === 3) {
          debugger;
        }

        if (
          !cellA ||
          cellA.remainDedicatedBombCount <= 0 ||
          cellA.dedicatedBombCells.length === 0
        ) {
          continue;
        }

        let maxDedicatedBombCount = cellA.remainDedicatedBombCount;
        let minDedicatedBombCount = cellA.remainDedicatedBombCount;
        const cellAKeySet = new Set(
          cellA.dedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
        );
        const cellAMinKeySet = new Set(
          cellA.minDedicatedCells.cells.map((entry) => toCellKey(entry.row, entry.col))
        );
        const historyCheck = new Set<string>(cellA.historyCheck ?? []);
        const allMaxIntersection = new Set<string>();
        const allMinIntersection = new Set<string>();

        const reduceCandidates = getReduceDedicatedCandidates(cube, faceKey, rowIndex, colIndex);
        reduceCandidates.forEach((ref) => {
          const cellB = cube[faceKey].cells[ref.rowIndex]?.[ref.colIndex];
          if (!cellB || cellB.dedicatedBombCells.length === 0) {
            return;
          }

          const cellBKeySet = new Set(
            cellB.dedicatedBombCells.map((entry) => toCellKey(entry.row, entry.col))
          );
          const intersectionKeys = [...cellBKeySet].filter((key) => cellAKeySet.has(key));

          if (intersectionKeys.length === 0) {
            return;
          }

          // Max path (safe): intersection is exactly cellB.minDedicatedCells.cells
          var minBKey = `min-${ref.rowIndex}-${ref.colIndex}`;
          if (!historyCheck.has(minBKey) && cellB.minDedicatedCells.cells.length > 0) {
            const cellBMinKeySet = new Set(
              cellB.minDedicatedCells.cells.map((c) => toCellKey(c.row, c.col))
            );
            const isIntersectionSameAsMinCells =
              intersectionKeys.length === cellB.minDedicatedCells.cells.length &&
              intersectionKeys.every((key) => cellBMinKeySet.has(key));

            if (isIntersectionSameAsMinCells) {
              maxDedicatedBombCount -= cellB.minDedicatedCells.minDedicatedBombCount;
              intersectionKeys.forEach((key) => allMaxIntersection.add(key));
              historyCheck.add(minBKey);
            }
          }

          // Min path (bomb): intersection is a sub-array of cellB.maxDedicatedCells.cells
          var maxBKey = `max-${ref.rowIndex}-${ref.colIndex}`;
          if (!historyCheck.has(maxBKey) && cellB.maxDedicatedCells.cells.length > 0) {
            const cellBMaxKeySet = new Set(
              cellB.maxDedicatedCells.cells.map((c) => toCellKey(c.row, c.col))
            );
            const isIntersectionSubsetOfMaxCells = intersectionKeys.every((key) =>
              cellBMaxKeySet.has(key)
            );
            const hasAnyIntersectionInCellAMinDedicatedCells = intersectionKeys.some((key) =>
              cellAMinKeySet.has(key)
            );

            if (
              minDedicatedBombCount > cellB.maxDedicatedCells.maxDedicatedBombCount &&
              isIntersectionSubsetOfMaxCells &&
              hasAnyIntersectionInCellAMinDedicatedCells
            ) {
              minDedicatedBombCount -= cellB.maxDedicatedCells.maxDedicatedBombCount;
              intersectionKeys.forEach((key) => allMinIntersection.add(key));
              historyCheck.add(maxBKey);
            }
          }
        });

        // Max path result: cells outside the max-intersection
        const excludeAllMaxIntersection = [...cellAKeySet].filter(
          (key) => !allMaxIntersection.has(key)
        );
        const excludeMaxCells = excludeAllMaxIntersection.map((key) => {
          const target = fromCellKey(key);
          return { row: target.row, col: target.col };
        });

        // Min path result: cells outside the min-intersection
        const excludeAllMinIntersection = [...cellAKeySet].filter(
          (key) => !allMinIntersection.has(key)
        );
        const excludeMinCells = excludeAllMinIntersection.map((key) => {
          const target = fromCellKey(key);
          return { row: target.row, col: target.col };
        });

        const nextFace = nextCube[faceKey];
        const nextCells = nextFace.cells.map((row) => [...row]);
        const currentCell = nextCells[rowIndex][colIndex];
        nextCells[rowIndex][colIndex] = {
          ...currentCell,
          historyCheck: [...historyCheck],
          maxDedicatedCells: {
            maxDedicatedBombCount,
            cells: excludeMaxCells,
          },
          minDedicatedCells: {
            minDedicatedBombCount,
            cells: excludeMinCells,
          },
        };

        // Max path: mark HSafe when no bombs remain in the excluded cells
        if (maxDedicatedBombCount === 0) {
          excludeMaxCells.forEach((target) => {
            const targetCell = nextCells[target.row]?.[target.col];
            if (!targetCell || targetCell.value !== 'Undetermined') {
              return;
            }
            nextCells[target.row][target.col] = {
              ...targetCell,
              value: 'HSafe',
            };
          });
        }

        // Min path: mark HBomb when all remaining bombs fall in the excluded cells
        if (minDedicatedBombCount === excludeMinCells.length) {
          excludeMinCells.forEach((target) => {
            const targetCell = nextCells[target.row]?.[target.col];
            if (!targetCell || targetCell.value !== 'Undetermined') {
              return;
            }
            nextCells[target.row][target.col] = {
              ...targetCell,
              value: 'HBomb',
              isFlagged: true,
              adjacentBombCount: 0,
              remainDedicatedBombCount: 0,
              dedicatedBombCells: [],
              minDedicatedCells: {
                minDedicatedBombCount: 0,
                cells: [],
              },
              maxDedicatedCells: {
                maxDedicatedBombCount: 0,
                cells: [],
              },
            };
          });
        }

        nextCube[faceKey] = {
          ...nextFace,
          cells: nextCells,
        };
      }
    }
  });

  return nextCube;
}

export function markUndeterminedAroundAsBomb(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const cell = face.cells[rowIndex]?.[colIndex];

        if (!cell || cell.remainDedicatedBombCount <= 0) {
          continue;
        }

        const dedicatedBombCount = cell.dedicatedBombCells.length;
        if (dedicatedBombCount <= 0) {
          continue;
        }

        if (cell.remainDedicatedBombCount !== dedicatedBombCount) {
          continue;
        }

        cell.dedicatedBombCells.forEach((target) => {
          const targetCell = nextCube[faceKey].cells[target.row]?.[target.col];
          if (!targetCell || targetCell.value !== 'Undetermined') {
            return;
          }

          const nextFace = nextCube[faceKey];
          const nextCells = nextFace.cells.map((row) => [...row]);

          nextCells[target.row][target.col] = {
            ...targetCell,
            value: 'HBomb',
            isFlagged: true,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
            dedicatedBombCells: [],
            minDedicatedCells: {
              minDedicatedBombCount: 0,
              cells: [],
            },
            maxDedicatedCells: {
              maxDedicatedBombCount: 0,
              cells: [],
            },
          };

          nextCube[faceKey] = {
            ...nextFace,
            cells: nextCells,
          };
        });
      }
    }
  });

  return nextCube;
}

export function markUndeterminedAroundAsSafe(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];

    for (let rowIndex = 0; rowIndex < face.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < face.cols; colIndex += 1) {
        const cell = face.cells[rowIndex]?.[colIndex];

        if (!cell || cell.adjacentBombCount <= 0) {
          continue;
        }

        if (cell.remainDedicatedBombCount !== 0 || cell.dedicatedBombCells.length === 0) {
          continue;
        }

        cell.dedicatedBombCells.forEach((target) => {
          const targetCell = nextCube[faceKey].cells[target.row]?.[target.col];
          if (!targetCell || targetCell.value !== 'Undetermined') {
            return;
          }

          const nextFace = nextCube[faceKey];
          const nextCells = nextFace.cells.map((row) => [...row]);

          nextCells[target.row][target.col] = {
            ...targetCell,
            value: 'HSafe',
          };

          nextCube[faceKey] = {
            ...nextFace,
            cells: nextCells,
          };
        });

        const nextFace = nextCube[faceKey];
        const nextCells = nextFace.cells.map((row) => [...row]);
        const nextCell = nextCells[rowIndex][colIndex];

        nextCells[rowIndex][colIndex] = {
          ...nextCell,
          dedicatedBombCells: [],
        };

        nextCube[faceKey] = {
          ...nextFace,
          cells: nextCells,
        };
      }
    }
  });

  return nextCube;
}

// Extension point for dedicated-bomb reasoning rules.
export function preprocessHighComplexity(cube: CubeModel): CubeModel {
  const nextCube: CubeModel = { ...cube };

  FACE_KEYS.forEach((faceKey) => {
    const face = cube[faceKey];
    const nextCells = face.cells.map((row) =>
      row.map((cell) => {
        const hasMaxInfo =
          !!cell.maxDedicatedCells &&
          (cell.maxDedicatedCells.maxDedicatedBombCount > 0 ||
            cell.maxDedicatedCells.cells.length > 0);
        const hasMinInfo =
          !!cell.minDedicatedCells &&
          (cell.minDedicatedCells.minDedicatedBombCount > 0 ||
            cell.minDedicatedCells.cells.length > 0);
        const hasHistoryInfo = !!cell.historyCheck && cell.historyCheck.length > 0;

        return {
          ...cell,
          historyCheck: hasHistoryInfo ? cell.historyCheck : [],
          maxDedicatedCells: hasMaxInfo
            ? cell.maxDedicatedCells
            : {
                maxDedicatedBombCount: cell.remainDedicatedBombCount,
                cells: cell.dedicatedBombCells,
              },
          minDedicatedCells: hasMinInfo
            ? cell.minDedicatedCells
            : {
                minDedicatedBombCount: cell.remainDedicatedBombCount,
                cells: cell.dedicatedBombCells,
              },
        };
      })
    );

    nextCube[faceKey] = {
      ...face,
      cells: nextCells,
    };
  });

  return nextCube;
}

export function applyDedicatedHints(cube: CubeModel): CubeModel {
  let nextCube = preprocessDedicated(cube);
  nextCube = reduceDedicated(nextCube);
  nextCube = markUndeterminedAroundAsBomb(nextCube);
  nextCube = markUndeterminedAroundAsSafe(nextCube);

  nextCube = preprocessHighComplexity(nextCube);
  nextCube = highComplexityBomb(nextCube);
  nextCube = highComplexitySafe(nextCube);

  return nextCube;
}
