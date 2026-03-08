import { Bomb, Flag as FlagIcon } from 'lucide-react';

import type { CubeModel } from '@/models/CubeModel';
import type { FaceModel } from '@/models/FaceModel';

interface _3DCubeComponentProps {
  cube: CubeModel;
  className?: string;
}

type VisibleFaceKey = 'front' | 'right' | 'up' | 'back' | 'left' | 'down';

const CELL_SIZE = 28;
const CELL_GAP = 4;

function getDimensionPixels(dimension: number) {
  return Math.max(1, dimension) * (CELL_SIZE + CELL_GAP) - CELL_GAP;
}

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

function FacePlane({
  face,
  faceKey,
  transform,
}: {
  face: FaceModel;
  faceKey: VisibleFaceKey;
  transform: string;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 rounded-md bg-white/90 shadow-sm"
      style={{ transform, transformOrigin: 'center center', backfaceVisibility: 'hidden' }}
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${face.cols}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: face.rows }).flatMap((_, rowIndex) =>
          Array.from({ length: face.cols }).map((__, colIndex) => {
            const sourceRowIndex = rowIndex;
            const sourceColIndex = colIndex;

            return (
              <div
                key={`${face.faceName}-${sourceRowIndex}-${sourceColIndex}`}
                className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold ${getCellStyleClass(
                  face,
                  sourceRowIndex,
                  sourceColIndex
                )}`}
              >
                {renderCellContent(face, sourceRowIndex, sourceColIndex)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function _3DCubeComponent({ cube, className = '' }: _3DCubeComponentProps) {
  const widthPx = getDimensionPixels(cube.width);
  const heightPx = getDimensionPixels(cube.height);
  const depthPx = getDimensionPixels(cube.deep);

  const sceneWidth = widthPx + depthPx + 96;
  const sceneHeight = heightPx + depthPx + 96;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className="relative"
        style={{
          width: `${sceneWidth}px`,
          height: `${sceneHeight}px`,
          perspective: '900px',
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(-26deg) rotateY(-30deg)',
          }}
        >
          <FacePlane
            face={cube.front}
            faceKey="front"
            transform={`translate(-50%, -50%) translateZ(${depthPx / 2}px)`}
          />
          <FacePlane
            face={cube.back}
            faceKey="back"
            transform={`translate(-50%, -50%) rotateY(180deg) translateZ(${depthPx / 2}px)`}
          />
          <FacePlane
            face={cube.left}
            faceKey="left"
            transform={`translate(-50%, -50%) rotateY(-90deg) translateZ(${widthPx / 2}px)`}
          />
          <FacePlane
            face={cube.right}
            faceKey="right"
            transform={`translate(-50%, -50%) rotateY(90deg) translateZ(${widthPx / 2}px)`}
          />
          <FacePlane
            face={cube.down}
            faceKey="down"
            transform={`translate(-50%, -50%) rotateX(-90deg) translateZ(${heightPx / 2}px)`}
          />
          <FacePlane
            face={cube.up}
            faceKey="up"
            transform={`translate(-50%, -50%) rotateX(90deg) translateZ(${heightPx / 2}px)`}
          />
        </div>
      </div>
    </div>
  );
}
