import { Bomb, Flag as FlagIcon } from 'lucide-react';

import type { CubeModel } from '@/models/CubeModel';
import type { CellModel } from '@/models/CellModel';
import type { FaceModel } from '@/models/FaceModel';

interface FlattenCubeComponentProps {
  cube: CubeModel;
  className?: string;
  onCellClick?: (faceKey: CubeFaceKey, rowIndex: number, colIndex: number) => void;
  onCellAdjacentBombCountChange?: (
    faceKey: CubeFaceKey,
    rowIndex: number,
    colIndex: number,
    adjacentBombCount: number
  ) => void;
}

type CubeFaceKey = 'up' | 'down' | 'left' | 'right' | 'front' | 'back';

function renderCellContent(face: FaceModel, rowIndex: number, colIndex: number) {
  const cell = face.cells[rowIndex]?.[colIndex];

  if (!cell) {
    return null;
  }

  if (cell.value === 'HBomb') {
    return <Bomb className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if (cell.isFlagged || cell.value === 'Flag') {
    return <FlagIcon className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if (cell.value === 'Bomb') {
    return <Bomb className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if ((cell.value === 'Empty' || cell.value === 'Undetermined') && cell.adjacentBombCount > 0) {
    return cell.adjacentBombCount;
  }

  return null;
}

function getCellStyleClass(face: FaceModel, rowIndex: number, colIndex: number) {
  const cell = face.cells[rowIndex]?.[colIndex];

  if (!cell) {
    return 'border-gray-200 bg-gray-50 text-gray-700';
  }

  if (cell.value === 'HBomb') {
    return 'border-green-500 bg-green-300 text-green-900';
  }

  if (cell.value === 'HSafe') {
    return 'border-green-500 bg-green-300 text-green-900';
  }

  if (cell.isFlagged || cell.value === 'Flag') {
    return 'border-blue-300 bg-blue-100 text-blue-700';
  }

  if (cell.value === 'Bomb') {
    return 'border-red-300 bg-red-100 text-red-700';
  }

  if (cell.value === 'Undetermined') {
    return 'border-gray-200 bg-gray-100 text-gray-700';
  }

  return 'border-amber-300 bg-amber-100 text-amber-800';
}

function FaceBlock({
  face,
  faceKey,
  onCellClick,
  onCellAdjacentBombCountChange,
}: {
  face: FaceModel;
  faceKey: CubeFaceKey;
  onCellClick?: (faceKey: CubeFaceKey, rowIndex: number, colIndex: number) => void;
  onCellAdjacentBombCountChange?: (
    faceKey: CubeFaceKey,
    rowIndex: number,
    colIndex: number,
    adjacentBombCount: number
  ) => void;
}) {
  return (
    <div className="rounded-md border border-gray-300 bg-white p-2 shadow-sm">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${face.cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: face.rows }).flatMap((_, rowIndex) =>
          Array.from({ length: face.cols }).map((__, colIndex) => {
            const sourceRowIndex = rowIndex;
            const sourceColIndex = colIndex;
            const cell = face.cells[sourceRowIndex]?.[sourceColIndex];
            const isEmptyValueCell = !!cell && cell.value === 'Empty';
            const isEditableUnknownCell =
              !!cell &&
              !cell.isFlagged &&
              (cell.value === 'Empty' || cell.value === 'Undetermined');

            if (isEditableUnknownCell) {
              return (
                <input
                  key={`${face.faceName}-${sourceRowIndex}-${sourceColIndex}`}
                  type="text"
                  inputMode="numeric"
                  value={cell.adjacentBombCount > 0 ? cell.adjacentBombCount : ''}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, '');
                    const nextValue = digitsOnly === '' ? 0 : Number.parseInt(digitsOnly, 10);

                    onCellAdjacentBombCountChange?.(
                      faceKey,
                      sourceRowIndex,
                      sourceColIndex,
                      nextValue
                    );
                  }}
                  onClick={() => onCellClick?.(faceKey, sourceRowIndex, sourceColIndex)}
                  className={`h-7 w-7 rounded border text-center text-xs font-semibold ${getCellStyleClass(
                    face,
                    sourceRowIndex,
                    sourceColIndex
                  )}`}
                />
              );
            }

            return (
              <button
                key={`${face.faceName}-${sourceRowIndex}-${sourceColIndex}`}
                type="button"
                onClick={() => onCellClick?.(faceKey, sourceRowIndex, sourceColIndex)}
                className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold transition-colors ${getCellStyleClass(
                  face,
                  sourceRowIndex,
                  sourceColIndex
                )}`}
              >
                {renderCellContent(face, sourceRowIndex, sourceColIndex)}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function cellChar(face: FaceModel, rowIndex: number, colIndex: number): string {
  const cell = face.cells[rowIndex]?.[colIndex];
  if (!cell) return '?';
  if (cell.value === 'Bomb' || cell.value === 'HBomb') return 'B';
  if (cell.isFlagged || cell.value === 'Flag') return 'F';
  if (cell.value === 'HSafe') return 'S';
  if ((cell.value === 'Empty' || cell.value === 'Undetermined') && cell.adjacentBombCount > 0) {
    return String(cell.adjacentBombCount);
  }
  if (cell.value === 'Empty') return '.';
  return '?';
}

function faceRowString(face: FaceModel, rowIndex: number): string {
  return Array.from({ length: face.cols }, (_, colIndex) =>
    cellChar(face, rowIndex, colIndex)
  ).join(' ');
}

function emptyColString(cols: number): string {
  return 'x '.repeat(Math.max(1, cols)).trimEnd();
}

export function exportFlattenViewToString(cube: CubeModel): string {
  // Top band:    empty(back.cols) | empty(left.cols) | up     | empty(right.cols)
  // Middle band: back             | left             | front  | right
  // Bottom band: empty(back.cols) | empty(left.cols) | down   | empty(right.cols)

  const topLines: string[] = [];
  for (let rowIndex = 0; rowIndex < cube.up.rows; rowIndex++) {
    topLines.push(
      [
        emptyColString(cube.back.cols),
        emptyColString(cube.left.cols),
        faceRowString(cube.up, rowIndex),
        emptyColString(cube.right.cols),
      ].join(' | ')
    );
  }

  const middleLines: string[] = [];
  for (let rowIndex = 0; rowIndex < cube.front.rows; rowIndex++) {
    middleLines.push(
      [
        faceRowString(cube.back, rowIndex),
        faceRowString(cube.left, rowIndex),
        faceRowString(cube.front, rowIndex),
        faceRowString(cube.right, rowIndex),
      ].join(' | ')
    );
  }

  const bottomLines: string[] = [];
  for (let rowIndex = 0; rowIndex < cube.down.rows; rowIndex++) {
    bottomLines.push(
      [
        emptyColString(cube.back.cols),
        emptyColString(cube.left.cols),
        faceRowString(cube.down, rowIndex),
        emptyColString(cube.right.cols),
      ].join(' | ')
    );
  }

  return [...topLines, ...middleLines, ...bottomLines].join('\n');
}

export function parseFlattenViewFromString(text: string): CubeModel | null {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const parsedLines = lines.map((line) =>
    line.split(' | ').map((seg) => seg.split(' ').filter(Boolean))
  );

  if (!parsedLines.every((segs) => segs.length === 4)) return null;

  const isPadding = (tokens: string[]) => tokens.length > 0 && tokens.every((t) => t === 'x');

  const middleIndices: number[] = [];
  parsedLines.forEach((segs, i) => {
    if (!isPadding(segs[0])) middleIndices.push(i);
  });

  if (middleIndices.length === 0) return null;

  const firstMiddle = middleIndices[0];
  const lastMiddle = middleIndices[middleIndices.length - 1];

  const topBandLines = parsedLines.slice(0, firstMiddle);
  const middleBandLines = parsedLines.slice(firstMiddle, lastMiddle + 1);
  const bottomBandLines = parsedLines.slice(lastMiddle + 1);

  const height = middleBandLines.length;
  if (height === 0) return null;

  const width = middleBandLines[0][2].length;
  const deep = topBandLines.length;

  if (width <= 0 || deep <= 0) return null;
  if (!middleBandLines.every((segs) => segs[2].length === width)) return null;
  if (!topBandLines.every((segs) => segs[2].length === width)) return null;
  if (!bottomBandLines.every((segs) => segs[2].length === width)) return null;
  if (bottomBandLines.length !== deep) return null;

  function charToCell(ch: string, row: number, col: number): CellModel {
    const base: CellModel = {
      row,
      col,
      value: 'Undetermined',
      adjacentBombCount: 0,
      remainDedicatedBombCount: 0,
      dedicatedBombCells: [],
      minDedicatedCells: { minDedicatedBombCount: 0, cells: [] },
      maxDedicatedCells: { maxDedicatedBombCount: 0, cells: [] },
      isRevealed: true,
      isFlagged: false,
    };
    if (ch === 'B') return { ...base, value: 'Bomb' };
    if (ch === 'F') return { ...base, value: 'Flag', isFlagged: true };
    if (ch === 'S') return { ...base, value: 'HSafe' };
    if (ch === '.') return { ...base, value: 'Empty' };
    const digit = Number.parseInt(ch, 10);
    if (!Number.isNaN(digit) && digit > 0) {
      return { ...base, value: 'Empty', adjacentBombCount: digit, remainDedicatedBombCount: digit };
    }
    return base;
  }

  function buildFace(
    faceName: FaceModel['faceName'],
    lineSegs: string[][][],
    colIndex: number
  ): FaceModel {
    const cells = lineSegs.map((segs, row) =>
      segs[colIndex].map((ch, col) => charToCell(ch, row, col))
    );
    return { faceName, rows: cells.length, cols: cells[0]?.length ?? 0, cells };
  }

  const up = buildFace('Up', topBandLines, 2);
  const down = buildFace('Down', bottomBandLines, 2);
  const back = buildFace('Back', middleBandLines, 0);
  const left = buildFace('Left', middleBandLines, 1);
  const front = buildFace('Front', middleBandLines, 2);
  const right = buildFace('Right', middleBandLines, 3);

  const bombCount = [up, down, back, left, front, right]
    .flatMap((face) => face.cells.flat())
    .filter((cell) => cell.value === 'Bomb').length;

  return { width, height, deep, bombCount, up, down, left, right, front, back };
}

export default function FlattenCubeComponent({
  cube,
  className = '',
  onCellClick,
  onCellAdjacentBombCountChange,
}: FlattenCubeComponentProps) {
  const slots: Array<Array<CubeFaceKey | null>> = [
    [null, null, 'up', null],
    ['back', 'left', 'front', 'right'],
    [null, null, 'down', null],
  ];

  return (
    <div
      className={`inline-grid gap-2 ${className}`}
      style={{ gridTemplateColumns: 'repeat(4, max-content)' }}
    >
      {slots.flatMap((row, rowIndex) =>
        row.map((slot, colIndex) => {
          if (!slot) {
            return <div key={`empty-${rowIndex}-${colIndex}`} aria-hidden="true" />;
          }

          return (
            <FaceBlock
              key={`${slot}-${rowIndex}-${colIndex}`}
              faceKey={slot}
              face={cube[slot]}
              onCellClick={onCellClick}
              onCellAdjacentBombCountChange={onCellAdjacentBombCountChange}
            />
          );
        })
      )}
    </div>
  );
}
