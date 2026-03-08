import type { CubeModel } from '@/models/CubeModel';
import { applyDedicatedHints } from './solutions/dedicatedHints';
import { applyPatternHints } from './solutions/patternHints';

export type { CubeFaceKey, CellRef } from './solutions/cellFunctions';
export { applyPatternHints } from './solutions/patternHints';
export { applyDedicatedHints } from './solutions/dedicatedHints';

export function markUndeterminedHintsForWholeCube(cube: CubeModel): CubeModel {
  let nextCube = cube;

  nextCube = applyDedicatedHints(nextCube);
  nextCube = applyPatternHints(nextCube);

  return nextCube;
}
