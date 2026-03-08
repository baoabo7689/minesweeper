import type { FaceModel } from '@/models/FaceModel';

export interface CubeModel {
  width: number;
  height: number;
  deep: number;
  bombCount: number;

  up: FaceModel;
  down: FaceModel;
  left: FaceModel;
  right: FaceModel;
  front: FaceModel;
  back: FaceModel;
}

export function setCubeModelDimension(
  cubeModel: CubeModel,
  width: number,
  height: number,
  deep: number
): CubeModel {
  return {
    ...cubeModel,
    width,
    height,
    deep,
  };
}

export function setCubeModelBombCount(cubeModel: CubeModel, bombCount: number): CubeModel {
  return {
    ...cubeModel,
    bombCount,
  };
}
