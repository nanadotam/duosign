/**
 * Minimal .pose binary format parser
 * ====================================
 * Parses the binary .pose file format used by DuoSign.
 *
 * File format (little-endian):
 *   Header:
 *     float32  version
 *     uint16   width
 *     uint16   height
 *     uint16   depth (z-axis, usually 0 for 2D)
 *     uint16   numComponents
 *     For each component:
 *       uint16  nameLength → UTF-8 name
 *       uint16  format (1 = XY, 2 = XYC, 3 = XYZ, 4 = XYZC)
 *       uint16  numPoints
 *       For each point:
 *         uint16 pointNameLength → UTF-8 pointName
 *       uint16  numLimbs
 *       For each limb:
 *         uint16 from
 *         uint16 to
 *       uint16  numColors
 *       For each color:
 *         uint8  R, G, B
 *   Body:
 *     float32  fps
 *     uint16   numFrames (old) — but modern files use the remaining bytes
 *     For each frame:
 *       For each component:
 *         uint8  numPeople (≤1 for DuoSign)
 *         For each person:
 *           float32[] data — (numPoints * valuesPerPoint) floats
 *
 * This parser is a simplified port of the `pose-format` npm package.
 */

/**
 * Parse a .pose ArrayBuffer into a structured object.
 * @param {ArrayBuffer} buffer
 * @returns {{ header: Object, fps: number, frameCount: number, getFrame: (i: number) => Object }}
 */
function parsePose(buffer) {
  const view = new DataView(buffer);
  let offset = 0;

  // ── Helpers ─────────────────────────────────────────────
  function readFloat32() {
    const v = view.getFloat32(offset, true);
    offset += 4;
    return v;
  }
  function readUint16() {
    const v = view.getUint16(offset, true);
    offset += 2;
    return v;
  }
  function readUint8() {
    const v = view.getUint8(offset);
    offset += 1;
    return v;
  }
  function readString() {
    const len = readUint16();
    const bytes = new Uint8Array(buffer, offset, len);
    offset += len;
    return new TextDecoder().decode(bytes);
  }

  // ── Header ──────────────────────────────────────────────
  const version = readFloat32();
  const width = readUint16();
  const height = readUint16();
  const depth = readUint16();
  const numComponents = readUint16();

  const components = [];
  for (let c = 0; c < numComponents; c++) {
    const name = readString();
    const format = readUint16();
    const numPoints = readUint16();

    const points = [];
    for (let p = 0; p < numPoints; p++) {
      points.push(readString());
    }

    const numLimbs = readUint16();
    const limbs = [];
    for (let l = 0; l < numLimbs; l++) {
      limbs.push({ from: readUint16(), to: readUint16() });
    }

    const numColors = readUint16();
    const colors = [];
    for (let cl = 0; cl < numColors; cl++) {
      colors.push({ R: readUint8(), G: readUint8(), B: readUint8() });
    }

    // Values per point: XY=2, XYC=3, XYZ=3, XYZC=4
    const valuesPerPoint = [0, 2, 3, 3, 4][format] || 3;

    components.push({
      name,
      format,
      numPoints,
      points,
      limbs,
      colors,
      valuesPerPoint,
    });
  }

  const header = { version, width, height, depth, components };

  // ── Body ────────────────────────────────────────────────
  const fps = readFloat32();
  const _numFramesDeclared = readUint16();

  // Calculate frame data size
  let bytesPerFrame = 0;
  for (const comp of components) {
    bytesPerFrame += 1; // numPeople byte
    bytesPerFrame += comp.numPoints * comp.valuesPerPoint * 4; // float32 data
  }

  const bodyStart = offset;
  const remainingBytes = buffer.byteLength - bodyStart;
  const frameCount =
    bytesPerFrame > 0 ? Math.floor(remainingBytes / bytesPerFrame) : 0;

  /**
   * Read a single frame at index `i`.
   * Returns { people: [{ COMPONENT_NAME: [{X, Y, C?}, ...], ... }] }
   */
  function getFrame(i) {
    if (i < 0 || i >= frameCount) return null;
    const frameOffset = bodyStart + i * bytesPerFrame;
    const fv = new DataView(buffer);
    let fOff = frameOffset;

    const people = [];

    for (const comp of components) {
      const numPeople = fv.getUint8(fOff);
      fOff += 1;

      if (numPeople === 0) {
        // Skip the data block — there's still space reserved
        fOff += comp.numPoints * comp.valuesPerPoint * 4;
        continue;
      }

      for (let person = 0; person < numPeople; person++) {
        if (!people[person]) people[person] = {};

        const pts = [];
        for (let p = 0; p < comp.numPoints; p++) {
          const point = {};
          if (comp.valuesPerPoint >= 2) {
            point.X = fv.getFloat32(fOff, true);
            fOff += 4;
            point.Y = fv.getFloat32(fOff, true);
            fOff += 4;
          }
          if (comp.format === 2) {
            // XYC
            point.C = fv.getFloat32(fOff, true);
            fOff += 4;
          } else if (comp.format === 3) {
            // XYZ
            point.Z = fv.getFloat32(fOff, true);
            fOff += 4;
          } else if (comp.format === 4) {
            // XYZC
            point.Z = fv.getFloat32(fOff, true);
            fOff += 4;
            point.C = fv.getFloat32(fOff, true);
            fOff += 4;
          }
          // Default confidence if not present
          if (point.C === undefined) point.C = 1;
          pts.push(point);
        }

        people[person][comp.name] = pts;
      }
    }

    return { people };
  }

  return { header, fps, frameCount, getFrame };
}

// Make available globally for script-tag loading
window.parsePose = parsePose;
