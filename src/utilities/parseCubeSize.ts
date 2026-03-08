export interface FaceSize {
  rows: number;
  cols: number;
}

export interface ParsedCubeSize {
  width: number;
  height: number;
  deep: number;
  front: FaceSize;
  top: FaceSize;
  left: FaceSize;
  right: FaceSize;
  back: FaceSize;
  down: FaceSize;
}

export function parseCubeSize(input: string): ParsedCubeSize | null {
  const parts = input
    .split(/[^0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [width, height, deep] = parts;
  if (![width, height, deep].every((value) => Number.isInteger(value) && value > 0)) {
    return null;
  }

  return {
    width,
    height,
    deep,
    front: { rows: height, cols: width },
    top: { rows: deep, cols: width },
    left: { rows: height, cols: deep },
    right: { rows: height, cols: deep },
    back: { rows: height, cols: width },
    down: { rows: deep, cols: width },
  };
}
