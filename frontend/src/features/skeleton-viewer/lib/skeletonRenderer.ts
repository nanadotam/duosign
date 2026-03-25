/**
 * skeletonRenderer — Draw pose-format data as 2D skeleton on a canvas
 * ====================================================================
 * Body & hands: thin lines, no joint dots.
 * Face: filled mask style — white oval interior, crimson outline,
 *       filled eyebrows/eyes/lips — matching the Python PoseVisualizer output.
 */

import type {
  PoseHeaderModel,
  PoseHeaderComponentModel,
  PoseBodyFrameModel,
  PosePointModel,
} from "pose-format";

// ── Line widths — no joint dots ──────────────────────────────────────────────
const LIMB_WIDTH: Record<string, number> = {
  POSE_LANDMARKS:       3,
  LEFT_HAND_LANDMARKS:  2,
  RIGHT_HAND_LANDMARKS: 2,
  FACE_LANDMARKS:       2,
};

const MIN_CONFIDENCE = 0.01;

// ── Face feature landmark indices (original MediaPipe 478-point numbering) ───
// poses_v3 stores points named by their original index, so we can look them up.
const FACE_OVAL      = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const LEFT_EYEBROW   = [276,283,282,295,285,300,293,334,296,336];
const RIGHT_EYEBROW  = [46,53,52,65,55,107,66,105,63,70];
const LEFT_EYE       = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398];
const RIGHT_EYE      = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246];
const LIPS_OUTER     = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
const LIPS_INNER     = [78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95];

const FACE_CRIMSON = "rgb(180, 28, 28)";
const FACE_CRIMSON_INNER = "rgb(99, 15, 15)";

function rgbString(r: number, g: number, b: number, a = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ── Body / hand component renderer (lines only, no dots) ─────────────────────
function drawComponent(
  ctx: CanvasRenderingContext2D,
  component: PoseHeaderComponentModel,
  points: PosePointModel[],
  scale: number,
  lineWidth: number,
) {
  if (!points || points.length === 0) return;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < component.limbs.length; i++) {
    const limb = component.limbs[i];
    const from = points[limb.from];
    const to   = points[limb.to];
    if (!from || !to) continue;
    if ((from.C ?? 0) < MIN_CONFIDENCE || (to.C ?? 0) < MIN_CONFIDENCE) continue;

    const color = component.colors[i] ?? component.colors[0];
    const alpha = Math.min(from.C ?? 1, to.C ?? 1);

    ctx.beginPath();
    ctx.moveTo(from.X * scale, from.Y * scale);
    ctx.lineTo(to.X  * scale, to.Y  * scale);
    ctx.strokeStyle = color
      ? rgbString(color.R, color.G, color.B, alpha)
      : rgbString(180, 0, 0, alpha);
    ctx.stroke();
  }
}

// ── Face mask renderer ────────────────────────────────────────────────────────

/** Build a lookup from original landmark name (e.g. "109") → local index */
function buildNameMap(component: PoseHeaderComponentModel): Map<string, number> {
  const map = new Map<string, number>();
  component.points.forEach((name, i) => map.set(name, i));
  return map;
}

/** Get (x, y) pixel coords for a list of original landmark indices */
function featurePts(
  indices: number[],
  nameMap: Map<string, number>,
  points: PosePointModel[],
  scale: number,
): [number, number][] {
  return indices
    .map(i => {
      const idx = nameMap.get(String(i));
      if (idx === undefined) return null;
      const pt = points[idx];
      if (!pt || (pt.C ?? 0) < MIN_CONFIDENCE) return null;
      return [pt.X * scale, pt.Y * scale] as [number, number];
    })
    .filter((p): p is [number, number] => p !== null);
}

/** Trace a closed polygon path (no stroke/fill — caller decides) */
function tracePoly(ctx: CanvasRenderingContext2D, pts: [number, number][]): void {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

/** Convex hull (Graham scan) for filled blobs like eyebrows and eyes */
function convexHull(pts: [number, number][]): [number, number][] {
  if (pts.length <= 3) return pts;
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number,number], a: [number,number], b: [number,number]) =>
    (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const lower: [number,number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: [number,number][] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0,-1), ...upper.slice(0,-1)];
}

function drawFaceMask(
  ctx: CanvasRenderingContext2D,
  component: PoseHeaderComponentModel,
  points: PosePointModel[],
  scale: number,
) {
  if (!points || points.length === 0) return;

  const nm = buildNameMap(component);
  const get = (indices: number[]) => featurePts(indices, nm, points, scale);

  // 1. Fill face oval white to wipe skeleton bleed-through
  const oval = get(FACE_OVAL);
  if (oval.length >= 3) {
    tracePoly(ctx, oval);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    // Oval outline
    tracePoly(ctx, oval);
    ctx.strokeStyle = FACE_CRIMSON;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // 2. Eyebrows — filled convex hull
  ctx.fillStyle = FACE_CRIMSON;
  for (const brow of [get(LEFT_EYEBROW), get(RIGHT_EYEBROW)]) {
    const hull = convexHull(brow);
    if (hull.length >= 3) { tracePoly(ctx, hull); ctx.fill(); }
  }

  // 3. Eyes — filled convex hull
  for (const eye of [get(LEFT_EYE), get(RIGHT_EYE)]) {
    const hull = convexHull(eye);
    if (hull.length >= 3) { tracePoly(ctx, hull); ctx.fill(); }
  }

  // 4. Lips outer — filled polygon
  const lOuter = get(LIPS_OUTER);
  if (lOuter.length >= 3) { tracePoly(ctx, lOuter); ctx.fill(); }

  // 5. Lips inner — darker cutout
  const lInner = get(LIPS_INNER);
  if (lInner.length >= 3) {
    tracePoly(ctx, lInner);
    ctx.fillStyle = FACE_CRIMSON_INNER;
    ctx.fill();
  }
}

// ── Public draw function ─────────────────────────────────────────────────────

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  frame: PoseBodyFrameModel,
  header: PoseHeaderModel,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!frame?.people?.length) return;
  const person = frame.people[0];
  if (!person) return;

  const scale   = Math.min(canvasWidth / header.width, canvasHeight / header.height);
  const offsetX = (canvasWidth  - header.width  * scale) / 2;
  const offsetY = (canvasHeight - header.height * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  for (const component of header.components) {
    const points = person[component.name] as PosePointModel[] | undefined;
    if (!points) continue;

    if (component.name === "FACE_LANDMARKS") {
      drawFaceMask(ctx, component, points, scale);
    } else if (component.name !== "POSE_WORLD_LANDMARKS") {
      // Skip POSE_WORLD — it's a duplicate of POSE in 3D space, not needed for 2D render
      drawComponent(ctx, component, points, scale, LIMB_WIDTH[component.name] ?? 2);
    }
  }

  ctx.restore();
}
