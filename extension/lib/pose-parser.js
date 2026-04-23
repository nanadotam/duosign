/**
 * Pose binary format parser — matches pose_format Python library v0.2
 * =====================================================================
 * Actual binary layout (all little-endian):
 *
 * HEADER:
 *   float32   version (0.2)
 *   uint16    width, height, depth
 *   uint16    numComponents
 *   For each component:
 *     [uint16 len + bytes]  name
 *     [uint16 len + bytes]  format string (e.g. "XYZC")
 *     uint16  numPoints, numLimbs, numColors  — THREE together
 *     For each point:    [uint16 len + bytes] pointName
 *     For each limb:     uint16 from, uint16 to
 *     For each color:    uint16 R, uint16 G, uint16 B  (NOT uint8!)
 *
 * BODY:
 *   float32   fps
 *   uint32    numFrames   (NOT uint16!)
 *   uint16    numPeople
 *   float32[] data:        (numFrames × numPeople × totalPoints × numDims)
 *   float32[] confidence:  (numFrames × numPeople × totalPoints)
 *
 * numDims = max(len(format) - 1) across components
 *   e.g. "XYZC" → 3 spatial dims; confidence is separate
 */

function parsePose(buffer) {
  const view = new DataView(buffer);
  let offset = 0;

  function readFloat32() { const v = view.getFloat32(offset, true); offset += 4; return v; }
  function readUint32()  { const v = view.getUint32(offset, true);  offset += 4; return v; }
  function readUint16()  { const v = view.getUint16(offset, true);  offset += 2; return v; }
  function readString() {
    const len = readUint16();
    const bytes = new Uint8Array(buffer, offset, len);
    offset += len;
    return new TextDecoder().decode(bytes);
  }

  // ── Header ──────────────────────────────────────────────
  const version    = readFloat32();
  const width      = readUint16();
  const height     = readUint16();
  const depth      = readUint16();
  const numComponents = readUint16();

  let totalPoints = 0;
  const components = [];

  for (let c = 0; c < numComponents; c++) {
    const name   = readString();
    const format = readString(); // "XYZC" — stored as a STRING, not a uint16

    // numPoints, numLimbs, numColors written together as triple uint16
    const numPoints = readUint16();
    const numLimbs  = readUint16();
    const numColors = readUint16();

    const points = [];
    for (let p = 0; p < numPoints; p++) points.push(readString());

    const limbs = [];
    for (let l = 0; l < numLimbs; l++) {
      limbs.push({ from: readUint16(), to: readUint16() });
    }

    const colors = [];
    for (let cl = 0; cl < numColors; cl++) {
      // Colors stored as uint16 R, G, B — values in 0–255 range
      colors.push({ R: readUint16(), G: readUint16(), B: readUint16() });
    }

    components.push({
      name,
      format,
      numPoints,
      pointOffset: totalPoints, // offset into the flat points array
      points,
      limbs,
      colors,
    });
    totalPoints += numPoints;
  }

  const header = { version, width, height, depth, components };

  // ── Body ────────────────────────────────────────────────
  const fps       = readFloat32();
  const numFrames = readUint32();  // uint32 — NOT uint16!
  const numPeople = readUint16();

  // Number of spatial dims stored per point.
  // "XYZC" → len=4 → dims=3 (X,Y,Z). Confidence is a separate array.
  const numDims = Math.max(...components.map(c => c.format.length - 1));

  // Data: flat float32 block — (numFrames × numPeople × totalPoints × numDims)
  const dataCount = numFrames * numPeople * totalPoints * numDims;
  const data = new Float32Array(buffer.slice(offset, offset + dataCount * 4));
  offset += dataCount * 4;

  // Confidence: flat float32 block — (numFrames × numPeople × totalPoints)
  const confCount = numFrames * numPeople * totalPoints;
  const conf = new Float32Array(buffer.slice(offset, offset + confCount * 4));

  /**
   * Returns one frame as { people: [{ COMPONENT_NAME: [{X,Y,Z,C}, ...] }] }
   * Compatible with skeleton-renderer.js drawSkeleton(ctx, frame, header, w, h).
   */
  function getFrame(frameIdx) {
    if (frameIdx < 0 || frameIdx >= numFrames) return null;

    const pIdx = 0; // DuoSign always records 1 person
    const person = {};

    for (const comp of components) {
      const pts = [];
      for (let p = 0; p < comp.numPoints; p++) {
        const gp = comp.pointOffset + p; // global point index across all components
        const di = ((frameIdx * numPeople + pIdx) * totalPoints + gp) * numDims;
        const ci = (frameIdx * numPeople + pIdx) * totalPoints + gp;

        pts.push({
          X: data[di],
          Y: data[di + 1],
          Z: numDims >= 3 ? data[di + 2] : 0,
          C: conf[ci],
        });
      }
      person[comp.name] = pts;
    }

    return { people: [person] };
  }

  return { header, fps, frameCount: numFrames, getFrame };
}

window.parsePose = parsePose;
