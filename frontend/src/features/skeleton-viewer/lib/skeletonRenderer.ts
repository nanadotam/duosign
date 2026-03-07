/**
 * skeletonRenderer — Draw pose-format data as 2D skeleton on a canvas
 * ====================================================================
 * Renders joints (circles) and limbs (lines) using the header's limb
 * connections and colors, matching the default pose-format visualizer.
 */

import type {
  PoseHeaderModel,
  PoseHeaderComponentModel,
  PoseBodyFrameModel,
  PosePointModel,
} from "pose-format";

/** Line width per component — body is thick, hands/face thinner */
const LIMB_WIDTH: Record<string, number> = {
  POSE_LANDMARKS: 6,
  LEFT_HAND_LANDMARKS: 3,
  RIGHT_HAND_LANDMARKS: 3,
  FACE_LANDMARKS: 2,
};

const JOINT_RADIUS: Record<string, number> = {
  POSE_LANDMARKS: 4,
  LEFT_HAND_LANDMARKS: 2,
  RIGHT_HAND_LANDMARKS: 2,
  FACE_LANDMARKS: 1.5,
};

/** Minimum confidence to draw a point */
const MIN_CONFIDENCE = 0.01;

function rgbString(r: number, g: number, b: number, a = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Draw a single component's limbs and joints for one person.
 */
function drawComponent(
  ctx: CanvasRenderingContext2D,
  component: PoseHeaderComponentModel,
  points: PosePointModel[],
  scaleX: number,
  scaleY: number,
  lineWidth: number,
  jointRadius: number
) {
  if (!points || points.length === 0) return;

  // Draw limbs (lines between connected points)
  for (let i = 0; i < component.limbs.length; i++) {
    const limb = component.limbs[i];
    const from = points[limb.from];
    const to = points[limb.to];

    if (!from || !to) continue;
    if ((from.C ?? 0) < MIN_CONFIDENCE || (to.C ?? 0) < MIN_CONFIDENCE) continue;

    // Use the limb color from the header
    const color = component.colors[i] ?? component.colors[0];
    const alpha = Math.min((from.C ?? 1), (to.C ?? 1));

    ctx.beginPath();
    ctx.moveTo(from.X * scaleX, from.Y * scaleY);
    ctx.lineTo(to.X * scaleX, to.Y * scaleY);
    ctx.strokeStyle = color
      ? rgbString(color.R, color.G, color.B, alpha)
      : rgbString(180, 0, 0, alpha);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw joints (circles at each point)
  for (const pt of points) {
    if ((pt.C ?? 0) < MIN_CONFIDENCE) continue;
    const alpha = pt.C ?? 1;

    ctx.beginPath();
    ctx.arc(pt.X * scaleX, pt.Y * scaleY, jointRadius, 0, Math.PI * 2);
    ctx.fillStyle = rgbString(180, 0, 0, alpha);
    ctx.fill();
  }
}

/**
 * Draw an entire skeleton frame on the canvas.
 * Renders all components for the first person in the frame.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  frame: PoseBodyFrameModel,
  header: PoseHeaderModel,
  canvasWidth: number,
  canvasHeight: number
) {
  // Clear the canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Fill background white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (!frame || !frame.people || frame.people.length === 0) return;

  const person = frame.people[0];
  if (!person) return;

  // Uniform scale to maintain native aspect ratio (letterbox if needed)
  const scale = Math.min(canvasWidth / header.width, canvasHeight / header.height);
  const offsetX = (canvasWidth - header.width * scale) / 2;
  const offsetY = (canvasHeight - header.height * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw each component
  for (const component of header.components) {
    const points = person[component.name];
    if (!points) continue;

    const lw = LIMB_WIDTH[component.name] ?? 3;
    const jr = JOINT_RADIUS[component.name] ?? 2;

    drawComponent(ctx, component, points, scale, scale, lw, jr);
  }

  ctx.restore();
}
