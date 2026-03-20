export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FacePoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFaceBoundingBox(
  faceLandmarks: FacePoint[],
  imageWidth: number,
  imageHeight: number,
  padding = 0.1
): FaceBoundingBox {
  if (!faceLandmarks.length) {
    return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  }

  const xs = faceLandmarks.map((point) => point.x * imageWidth);
  const ys = faceLandmarks.map((point) => point.y * imageHeight);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padX = (maxX - minX) * padding;
  const padY = (maxY - minY) * padding;

  const x = clamp(minX - padX, 0, imageWidth);
  const y = clamp(minY - padY, 0, imageHeight);
  const width = clamp(maxX - minX + padX * 2, 1, imageWidth - x);
  const height = clamp(maxY - minY + padY * 2, 1, imageHeight - y);

  return { x, y, width, height };
}
