'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import CellValueSelector, { type SelectableCellValue } from '@/components/CellValueSelector';
import FlattenCubeComponent, { exportFlattenViewToString } from '@/components/FlattenCubeComponent';
import ImportFlattenComponent from '@/components/ImportFlattenComponent';
import _3DCubeComponent from '@/components/_3DCubeComponent';
import { DefaultCubeDimension, type CellValueType } from '@/consts/minesweeper_types';
import { useLanguage } from '@/context/LanguageContext';
import { setCubeModelBombCount, setCubeModelDimension, type CubeModel } from '@/models/CubeModel';
import { parseCubeSize, type ParsedCubeSize } from '@/utilities/parseCubeSize';
import { rotateLR, rotateUD } from '@/utilities/rotateUtilities';
import { markUndeterminedHintsForWholeCube } from '@/utilities/solveUtilities';

type CubeFaceKey = 'up' | 'down' | 'left' | 'right' | 'front' | 'back';

interface CellTarget {
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
): CellTarget | null {
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

function getRelatedEdgeTargets(
  cubeModel: CubeModel,
  faceKey: CubeFaceKey,
  rowIndex: number,
  colIndex: number
): CellTarget[] {
  const relatedTargets: CellTarget[] = [];

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

export default function HomePage() {
  const defaultImportedBombCount = 10;
  const { translations } = useLanguage();
  const flattenViewRef = useRef<HTMLDivElement | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const skipBaseCubeModelEffect = useRef(false);
  const [selectedCellValue, setSelectedCellValue] = useState<SelectableCellValue>('Undetermined');
  const [cubeDimension, setCubeDimension] = useState(DefaultCubeDimension);
  const [bombCount, setBombCount] = useState('10');
  const [parsedCubeSize, setParsedCubeSize] = useState<ParsedCubeSize | null>(
    parseCubeSize(DefaultCubeDimension)
  );
  const [showDimensionHint, setShowDimensionHint] = useState(false);
  const [flattenViewHeight, setFlattenViewHeight] = useState<number>(0);
  const [exportText, setExportText] = useState('');
  const parsedBombCount = Number.parseInt(bombCount, 10) || 0;

  const handleCubeDimensionChange = (value: string) => {
    setCubeDimension(value);
    setParsedCubeSize(parseCubeSize(value));
  };

  const handleResetClick = () => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      const resetFace = (face: CubeModel[CubeFaceKey]) => ({
        ...face,
        cells: face.cells.map((row) =>
          row.map((cell) => ({
            ...cell,
            value: 'Undetermined' as CellValueType,
            isFlagged: false,
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
          }))
        ),
      });

      return {
        ...previousCubeModel,
        bombCount: 10,
        up: resetFace(previousCubeModel.up),
        down: resetFace(previousCubeModel.down),
        left: resetFace(previousCubeModel.left),
        right: resetFace(previousCubeModel.right),
        front: resetFace(previousCubeModel.front),
        back: resetFace(previousCubeModel.back),
      };
    });

    setSelectedCellValue('Undetermined');
    setCubeDimension(DefaultCubeDimension);
    setParsedCubeSize(parseCubeSize(DefaultCubeDimension));
    setBombCount('10');
    setShowDimensionHint(false);
  };

  const handleExportClick = () => {
    if (!parsedCubeModel) {
      return;
    }

    setExportText(exportFlattenViewToString(parsedCubeModel));
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleImportFromText = (imported: CubeModel) => {
    skipBaseCubeModelEffect.current = true;
    setParsedCubeModel(setCubeModelBombCount(imported, defaultImportedBombCount));
    setCubeDimension(`${imported.width}x${imported.height}x${imported.deep}`);
    setParsedCubeSize(parseCubeSize(`${imported.width}x${imported.height}x${imported.deep}`));
    setBombCount(String(defaultImportedBombCount));
  };

  const handleRotateLRClick = () => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      return rotateLR(previousCubeModel);
    });
  };

  const handleRotateUDClick = () => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      return rotateUD(previousCubeModel);
    });
  };

  const handleHintClick = () => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      return markUndeterminedHintsForWholeCube(previousCubeModel);
    });
  };

  const baseCubeModel = useMemo<CubeModel | null>(() => {
    if (!parsedCubeSize) {
      return null;
    }

    const createFace = (
      faceName: CubeModel['up']['faceName'],
      rows: number,
      cols: number
    ): CubeModel['up'] => ({
      faceName,
      rows,
      cols,
      cells: Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
          row,
          col,
          value: 'Undetermined',
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
          isRevealed: true,
          isFlagged: false,
        }))
      ),
    });

    const cubeModel: CubeModel = {
      width: 0,
      height: 0,
      deep: 0,
      bombCount: 0,
      up: createFace('Up', parsedCubeSize.top.rows, parsedCubeSize.top.cols),
      down: createFace('Down', parsedCubeSize.down.rows, parsedCubeSize.down.cols),
      left: createFace('Left', parsedCubeSize.left.rows, parsedCubeSize.left.cols),
      right: createFace('Right', parsedCubeSize.right.rows, parsedCubeSize.right.cols),
      front: createFace('Front', parsedCubeSize.front.rows, parsedCubeSize.front.cols),
      back: createFace('Back', parsedCubeSize.back.rows, parsedCubeSize.back.cols),
    };

    const cubeModelWithDimension = setCubeModelDimension(
      cubeModel,
      parsedCubeSize.width,
      parsedCubeSize.height,
      parsedCubeSize.deep
    );

    return setCubeModelBombCount(cubeModelWithDimension, parsedBombCount);
  }, [parsedBombCount, parsedCubeSize]);

  const [parsedCubeModel, setParsedCubeModel] = useState<CubeModel | null>(baseCubeModel);

  useEffect(() => {
    if (skipBaseCubeModelEffect.current) {
      skipBaseCubeModelEffect.current = false;
      return;
    }
    setParsedCubeModel(baseCubeModel);
  }, [baseCubeModel]);

  useEffect(() => {
    const element = flattenViewRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setFlattenViewHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [parsedCubeModel]);

  const handleCubeCellClick = (faceKey: CubeFaceKey, rowIndex: number, colIndex: number) => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      const targets: CellTarget[] = [
        { faceKey, rowIndex, colIndex },
        ...getRelatedEdgeTargets(previousCubeModel, faceKey, rowIndex, colIndex),
      ];

      const uniqueTargetMap = new Map<string, CellTarget>();
      targets.forEach((target) => {
        uniqueTargetMap.set(`${target.faceKey}-${target.rowIndex}-${target.colIndex}`, target);
      });

      const nextCubeModel: CubeModel = { ...previousCubeModel };
      const nextFaceCellsByFace = new Map<CubeFaceKey, CubeModel[CubeFaceKey]['cells']>();

      uniqueTargetMap.forEach((target) => {
        const face = previousCubeModel[target.faceKey];
        const targetCell = face.cells[target.rowIndex]?.[target.colIndex];
        if (!targetCell) {
          return;
        }

        const cachedCells = nextFaceCellsByFace.get(target.faceKey);
        const nextCells = cachedCells ?? face.cells.map((row) => [...row]);

        if (selectedCellValue === 'Bomb') {
          nextCells[target.rowIndex][target.colIndex] = {
            ...targetCell,
            value: 'Bomb',
            isFlagged: false,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
          };
        } else if (selectedCellValue === 'Flag') {
          nextCells[target.rowIndex][target.colIndex] = {
            ...targetCell,
            value: 'Flag',
            isFlagged: true,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
          };
        } else if (selectedCellValue === 'Undetermined') {
          nextCells[target.rowIndex][target.colIndex] = {
            ...targetCell,
            value: 'Undetermined',
            isFlagged: false,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
          };
        } else {
          nextCells[target.rowIndex][target.colIndex] = {
            ...targetCell,
            value: 'Empty',
            isFlagged: false,
            adjacentBombCount: 0,
            remainDedicatedBombCount: 0,
          };
        }

        nextFaceCellsByFace.set(target.faceKey, nextCells);
      });

      nextFaceCellsByFace.forEach((cells, updatedFaceKey) => {
        nextCubeModel[updatedFaceKey] = {
          ...previousCubeModel[updatedFaceKey],
          cells,
        };
      });

      return nextCubeModel;
    });
  };

  const handleCellAdjacentBombCountChange = (
    faceKey: CubeFaceKey,
    rowIndex: number,
    colIndex: number,
    adjacentBombCount: number
  ) => {
    setParsedCubeModel((previousCubeModel) => {
      if (!previousCubeModel) {
        return previousCubeModel;
      }

      const face = previousCubeModel[faceKey];
      const targetCell = face.cells[rowIndex]?.[colIndex];
      if (!targetCell) {
        return previousCubeModel;
      }

      if (
        (targetCell.value !== 'Empty' && targetCell.value !== 'Undetermined') ||
        targetCell.isFlagged
      ) {
        return previousCubeModel;
      }

      const nextCells = face.cells.map((row) => [...row]);
      nextCells[rowIndex][colIndex] = {
        ...targetCell,
        adjacentBombCount,
        remainDedicatedBombCount: adjacentBombCount,
      };

      return {
        ...previousCubeModel,
        [faceKey]: {
          ...face,
          cells: nextCells,
        },
      };
    });
  };

  return (
    <>
      {showImportModal && (
        <ImportFlattenComponent
          onImport={handleImportFromText}
          onClose={() => setShowImportModal(false)}
        />
      )}
      <main className="flex-1 bg-gradient-to-br from-blue-100 via-white to-pink-100">
        <section className="w-full h-full border border-gray-200 bg-white shadow-xl pl-6">
          <div className="mt-2 pt-2 flex items-center gap-3 flex-wrap">
            <h2 className="w-48 text-lg text-right font-semibold text-gray-900">
              {translations.home.cellValueSelectorTitle}
            </h2>
            <CellValueSelector
              value={selectedCellValue}
              onChange={setSelectedCellValue}
              className="w-[384px]"
            />
          </div>

          <div className="mt-4 pt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label
                htmlFor="cube-dimension"
                className="w-48 text-right text-lg font-semibold text-gray-900"
              >
                {translations.home.cubeDimensionLabel}
              </label>
              <input
                id="cube-dimension"
                type="text"
                inputMode="numeric"
                value={cubeDimension}
                onChange={(event) => handleCubeDimensionChange(event.target.value)}
                placeholder={translations.home.cubeDimensionPlaceholder}
                className="h-9 w-24 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none ring-offset-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <label
                htmlFor="bomb-count"
                className="w-32 text-right text-lg font-semibold text-gray-900"
              >
                {translations.home.bombCountLabel}
              </label>
              <input
                id="bomb-count"
                type="text"
                inputMode="numeric"
                value={bombCount}
                onChange={(event) => setBombCount(event.target.value.replace(/\D/g, ''))}
                placeholder={translations.home.bombCountPlaceholder}
                className="h-9 w-24 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none ring-offset-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button type="button" onClick={handleResetClick} className="btn-blue h-9">
                {translations.home.resetButton}
              </button>
              <button type="button" onClick={handleHintClick} className="btn-blue h-9">
                {translations.home.hintButton}
              </button>
              <Link
                href={{
                  pathname: '/playgame',
                  query: {
                    dimension: cubeDimension,
                    bombs: bombCount,
                  },
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-white hover:bg-blue-700 transition-colors"
              >
                {translations.home.playNow}
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="w-48 text-right text-lg font-semibold text-gray-900">Rotate</span>
              <button type="button" onClick={handleRotateLRClick} className="btn-blue h-9 w-16">
                LR
              </button>
              <button type="button" onClick={handleRotateUDClick} className="btn-blue h-9 w-16">
                UD
              </button>
              <span className="text-lg font-semibold text-gray-900">IO</span>
              <button type="button" onClick={handleImportClick} className="btn-blue h-9">
                Import
              </button>
              <button type="button" onClick={handleExportClick} className="btn-blue h-9">
                Export
              </button>
            </div>
            {showDimensionHint && (
              <p className="mt-2 text-sm text-gray-600">{translations.home.cubeDimensionHint}</p>
            )}
          </div>

          <div className="mt-6 pt-3 flex items-start gap-6 flex-wrap md:flex-nowrap">
            {parsedCubeModel && <_3DCubeComponent cube={parsedCubeModel} />}
            {parsedCubeModel && (
              <div className="flex items-stretch gap-4">
                <div ref={flattenViewRef}>
                  <FlattenCubeComponent
                    cube={parsedCubeModel}
                    onCellClick={handleCubeCellClick}
                    onCellAdjacentBombCountChange={handleCellAdjacentBombCountChange}
                  />
                </div>
                <textarea
                  value={exportText || translations.home.flattenCubeMessage}
                  readOnly
                  style={flattenViewHeight > 0 ? { height: `${flattenViewHeight}px` } : undefined}
                  className="w-80 shrink-0 resize-none rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 outline-none"
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
