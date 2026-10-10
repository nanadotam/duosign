// DsanimPlayer: plays baked .dsanim clips on a three-vrm (v3) avatar.
// No solving at runtime: canonical local rotations are written to normalized bones,
// with a per-model rest-direction correction so one clip fits any VRM.
import * as THREE from 'three';

const B64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function decodeF16(u16) {
  const out = new Float32Array(u16.length);
  for (let i = 0; i < u16.length; i++) {
    const h = u16[i];
    const s = (h & 0x8000) ? -1 : 1;
    const e = (h >> 10) & 0x1f;
    const f = h & 0x3ff;
    out[i] = e === 0 ? s * 2 ** -14 * (f / 1024)
      : e === 31 ? (f ? NaN : s * Infinity)
      : s * 2 ** (e - 15) * (1 + f / 1024);
  }
  return out;
}

export function decodeClip(clip) {
  const rb = B64(clip.rotations.data);
  const i16 = new Int16Array(rb.buffer, rb.byteOffset, rb.byteLength / 2);
  const rot = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) rot[i] = i16[i] / clip.rotations.scale;
  let face = null;
  if (clip.face) {
    const fb = B64(clip.face.data);
    face = new Float32Array(fb.length);
    for (let i = 0; i < fb.length; i++) face[i] = fb[i] / 255;
  }
  let reach = null;
  if (clip.reach) {
    const b = B64(clip.reach.data);
    reach = decodeF16(new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2));
  }
  let ref = null;
  if (clip.reference) {
    const b = B64(clip.reference.data);
    ref = decodeF16(new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2));
  }
  return { ...clip, rot, faceData: face, ref, reachData: reach, nBones: clip.bones.length };
}

// main child used to measure each bone's rest direction
const MAIN_CHILD = {
  hips: 'spine', spine: 'chest', chest: 'neck', neck: 'head',
  leftShoulder: 'leftUpperArm', leftUpperArm: 'leftLowerArm', leftLowerArm: 'leftHand', leftHand: 'leftMiddleProximal',
  rightShoulder: 'rightUpperArm', rightUpperArm: 'rightLowerArm', rightLowerArm: 'rightHand', rightHand: 'rightMiddleProximal',
};
for (const side of ['left', 'right']) {
  for (const f of ['Thumb']) {
    MAIN_CHILD[`${side}${f}Metacarpal`] = `${side}${f}Proximal`;
    MAIN_CHILD[`${side}${f}Proximal`] = `${side}${f}Distal`;
  }
  for (const f of ['Index', 'Middle', 'Ring', 'Little']) {
    MAIN_CHILD[`${side}${f}Proximal`] = `${side}${f}Intermediate`;
    MAIN_CHILD[`${side}${f}Intermediate`] = `${side}${f}Distal`;
  }
}

// ARKit -> VRM preset fallbacks for avatars without "perfect sync" expressions
const PRESET_MAP = [
  ['aa', (f) => f.jawOpen * 0.9],
  ['ou', (f) => Math.max(f.mouthPucker, f.mouthFunnel) * 0.7],
  ['ih', (f) => (f.mouthStretchLeft + f.mouthStretchRight) * 0.4],
  ['blinkLeft', (f) => f.eyeBlinkLeft],
  ['blinkRight', (f) => f.eyeBlinkRight],
  ['surprised', (f) => Math.max(0, f.browInnerUp - 0.15) * 0.8],
  ['angry', (f) => Math.max(0, (f.browDownLeft + f.browDownRight) / 2 - 0.15) * 0.8],
  ['happy', (f) => Math.max(0, (f.mouthSmileLeft + f.mouthSmileRight) / 2 - 0.2) * 0.6],
];

export class DsanimPlayer {
  constructor(vrm) {
    this.vrm = vrm;
    this.isVRM0 = vrm.meta?.metaVersion === '0';
    this.nodes = new Map();
    this.correction = new Map();
    this.ready = false;
    this.mirror = false;
    this.useFace = true;
    this._q = new THREE.Quaternion();
    this.useReach = true;
    this.faceDepthLimit = 0.12; // in shoulder widths (~4 cm) in front of the nose tip
    this.restWorld = this._captureRestPositions();
    this._measureBody();
  }

  /** Avatar proportions + a nose anchor, used to retarget contact locations. */
  _measureBody() {
    const P = (n) => this.restWorld.get(n);
    const W = (n) => this.nodes.get(n)?.getWorldPosition(new THREE.Vector3());
    this.body = null;
    if (!P('leftUpperArm') || !P('rightUpperArm') || !P('head')) return;
    const sw = P('leftUpperArm').distanceTo(P('rightUpperArm'));
    const arm = ['left', 'right'].map((s) =>
      P(`${s}UpperArm`).distanceTo(P(`${s}LowerArm`)) + P(`${s}LowerArm`).distanceTo(P(`${s}Hand`)));
    const k = sw / 0.34; // avatar size relative to an average adult
    const head = this.nodes.get('head');
    const headW = W('head');
    const eyes = this.nodes.get('leftEye') && this.nodes.get('rightEye')
      ? W('leftEye').add(W('rightEye')).multiplyScalar(0.5) : null;
    const nose = this._meshNoseTip(headW, k)
      || (eyes ? eyes.clone().add(new THREE.Vector3(0, -0.035 * k, 0.035 * k))
        : headW.clone().add(new THREE.Vector3(0, 0.07 * k, 0.09 * k)));
    const hipsY = P('hips').y;
    const shY = (P('leftUpperArm').y + P('rightUpperArm').y) / 2;
    this.body = {
      shoulderWidth: sw,
      torsoHeight: shY - hipsY,
      armLength: (arm[0] + arm[1]) / 2,
      noseOffset: nose.sub(headW),                       // world, rest
      headRestInv: head.getWorldQuaternion(new THREE.Quaternion()).invert(),
    };
  }

  /** Real nose tip from the mesh (rest pose): the front-most skin vertex on the head's centre line.
   *  Clips measure face contacts from MediaPipe's nose-tip landmark, so this is the right anchor. */
  _meshNoseTip(headW, k) {
    // the avatar faces +Z in world space (VRM 1.0 convention; VRM 0.x is rotated by rotateVRM0)
    let best = null;
    const v = new THREE.Vector3();
    this.vrm.scene.updateMatrixWorld(true);
    this.vrm.scene.traverse((m) => {
      if (!m.isMesh || !m.geometry?.attributes?.position || /hair|lash|brow|teeth|tongue|eye/i.test(m.name)) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        if (Math.abs(v.x - headW.x) > 0.025 * k) continue;
        if (v.y < headW.y - 0.03 * k || v.y > headW.y + 0.16 * k) continue;
        if (!best || v.z > best.z) best = v.clone();
      }
    });
    if (best && best.z - headW.z > 0.03 * k && best.z - headW.z < 0.2 * k) return best;
    return null;
  }

  /** Move each active wrist to its body-relative target (two-bone IK), keeping hand orientation. */
  applyReach(d, t) {
    if (!this.useReach || !d.reachData || !this.body) return;
    const scene = this.vrm.scene;
    scene.updateMatrixWorld(true);
    const fi = Math.max(0, Math.min(d.frames - 1, Math.round(t)));
    const wp = (n) => this.nodes.get(n).getWorldPosition(new THREE.Vector3());
    const wq = (n) => this.nodes.get(n).getWorldQuaternion(new THREE.Quaternion());
    const head = this.nodes.get('head');
    const nose = wp('head').add(this.body.noseOffset.clone()
      .applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()).multiply(this.body.headRestInv)));
    const mid = wp('leftUpperArm').add(wp('rightUpperArm')).multiplyScalar(0.5);

    for (const [h, side] of [[0, 'left'], [1, 'right']]) {
      const src = this.mirror ? 1 - h : h;
      const o = (fi * 2 + src) * 8;
      const r = d.reachData;
      const ik = r[o + 7];
      if (!(ik > 0.01) || !this.nodes.get(`${side}UpperArm`)) continue;
      const m = this.mirror ? -1 : 1;
      const relHead = new THREE.Vector3(m * r[o], r[o + 1], r[o + 2]);
      const relChest = new THREE.Vector3(m * r[o + 3], r[o + 4], r[o + 5]);
      const wHead = r[o + 6];
      // Contact prior: monocular depth exaggerates how far in front of the face a hand is.
      // Signs located at the face are (near-)contact signs, so cap the forward offset there.
      if (wHead > 0) relHead.z = Math.min(relHead.z, this.faceDepthLimit);
      relChest.multiply(new THREE.Vector3(this.body.shoulderWidth, this.body.torsoHeight, this.body.armLength));
      const target = nose.clone().addScaledVector(relHead, this.body.shoulderWidth).multiplyScalar(wHead)
        .add(mid.clone().add(relChest).multiplyScalar(1 - wHead));

      const ua = this.nodes.get(`${side}UpperArm`), la = this.nodes.get(`${side}LowerArm`);
      const hand = this.nodes.get(`${side}Hand`);
      const handWorld = wq(`${side}Hand`);
      const S = wp(`${side}UpperArm`), E = wp(`${side}LowerArm`), Wr = wp(`${side}Hand`);
      const a = S.distanceTo(E), b = E.distanceTo(Wr);
      const toT = target.clone().sub(S);
      const dist = THREE.MathUtils.clamp(toT.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
      const dir = toT.normalize();
      const pole = E.clone().sub(S);
      pole.addScaledVector(dir, -pole.dot(dir));
      if (pole.lengthSq() < 1e-8) pole.set(0, -1, 0).addScaledVector(dir, -dir.y);
      pole.normalize();
      const cosA = THREE.MathUtils.clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1);
      const newE = S.clone().addScaledVector(dir, a * cosA).addScaledVector(pole, a * Math.sqrt(1 - cosA * cosA));

      const setWorld = (node, qWorld) => {
        const pw = node.parent.getWorldQuaternion(new THREE.Quaternion());
        node.quaternion.copy(pw.invert().multiply(qWorld));
        node.updateMatrixWorld(true);
      };
      const swingTo = (from, to) => new THREE.Quaternion().setFromUnitVectors(from.normalize(), to.normalize());
      // upper arm
      const uaW = wq(`${side}UpperArm`);
      const uaNew = swingTo(E.clone().sub(S), newE.clone().sub(S)).multiply(uaW);
      setWorld(ua, uaW.clone().slerp(uaNew, ik));
      // lower arm
      const E2 = wp(`${side}LowerArm`), W2 = wp(`${side}Hand`);
      const goal = S.clone().addScaledVector(dir, dist);
      const laW = wq(`${side}LowerArm`);
      const laNew = swingTo(W2.clone().sub(E2), goal.sub(E2)).multiply(laW);
      setWorld(la, laW.clone().slerp(laNew, ik));
      // hand keeps its world orientation (palm direction is part of the sign)
      setWorld(hand, handWorld);
    }
  }

  _captureRestPositions() {
    const scene = this.vrm.scene;
    scene.updateMatrixWorld(true);
    const inv = scene.matrixWorld.clone().invert();
    const pos = new Map();
    for (const name of Object.keys(this.vrm.humanoid.humanBones)) {
      const node = this.vrm.humanoid.getNormalizedBoneNode(name);
      if (!node) continue;
      const p = node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
      if (this.isVRM0) { p.x = -p.x; p.z = -p.z; } // into canonical (VRM 1.0) axes
      pos.set(name, p);
      this.nodes.set(name, node);
    }
    return pos;
  }

  /** Per-bone swing taking the model's rest direction onto the clip's canonical rest direction. */
  prepare(clip) {
    if (this.ready && this.skeleton === clip.skeleton) return;
    this.skeleton = clip.skeleton;
    this.boneOrder = clip.bones;
    this.parentIdx = clip.parents.map((p) => (p === null ? -1 : clip.bones.indexOf(p)));
    this.correction.clear();
    for (const bone of clip.bones) {
      const rc = clip.restDirections[bone];
      const child = MAIN_CHILD[bone];
      const a = this.restWorld.get(bone);
      const b = child && this.restWorld.get(child);
      const s = new THREE.Quaternion();
      if (rc && a && b) {
        const rm = b.clone().sub(a);
        if (rm.lengthSq() > 1e-10) s.setFromUnitVectors(rm.normalize(), new THREE.Vector3(...rc).normalize());
      }
      this.correction.set(bone, s);
    }
    // left<->right index map for mirroring
    this.mirrorIdx = clip.bones.map((b) => {
      const m = b.startsWith('left') ? 'right' + b.slice(4) : b.startsWith('right') ? 'left' + b.slice(5) : b;
      return clip.bones.indexOf(m);
    });
    this.ready = true;
  }

  /** Canonical local quaternion of bone i at fractional frame t. */
  sample(d, t, i, out) {
    const f0 = Math.max(0, Math.min(d.frames - 1, Math.floor(t)));
    const f1 = Math.min(d.frames - 1, f0 + 1);
    const w = Math.min(1, Math.max(0, t - f0));
    const src = this.mirror ? this.mirrorIdx[i] : i;
    const o0 = (f0 * d.nBones + src) * 4;
    const o1 = (f1 * d.nBones + src) * 4;
    const qa = new THREE.Quaternion(d.rot[o0], d.rot[o0 + 1], d.rot[o0 + 2], d.rot[o0 + 3]);
    const qb = new THREE.Quaternion(d.rot[o1], d.rot[o1 + 1], d.rot[o1 + 2], d.rot[o1 + 3]);
    out.copy(qa).slerp(qb, w);
    if (this.mirror) { out.y = -out.y; out.z = -out.z; } // reflect across the YZ plane
    return out.normalize();
  }

  /** Canonical locals for a whole frame (array of quaternions). */
  framePose(d, t) {
    const pose = [];
    for (let i = 0; i < d.nBones; i++) pose.push(this.sample(d, t, i, new THREE.Quaternion()));
    return pose;
  }

  /** Write canonical locals onto the avatar (rest-corrected). */
  applyPose(pose) {
    const wc = new Array(pose.length);
    const wm = new Array(pose.length);
    for (let i = 0; i < pose.length; i++) {
      const p = this.parentIdx[i];
      const parentWc = p < 0 ? new THREE.Quaternion() : wc[p];
      const parentWm = p < 0 ? new THREE.Quaternion() : wm[p];
      wc[i] = parentWc.clone().multiply(pose[i]);
      wm[i] = wc[i].clone().multiply(this.correction.get(this.boneOrder[i]));
      const node = this.nodes.get(this.boneOrder[i]);
      if (!node) continue;
      const local = parentWm.clone().invert().multiply(wm[i]);
      if (this.isVRM0) { local.x = -local.x; local.z = -local.z; }
      node.quaternion.copy(local);
    }
  }

  applyFace(d, t) {
    const em = this.vrm.expressionManager;
    if (!em) return;
    if (!this.useFace || !d.faceData) {
      for (const [name] of PRESET_MAP) if (em.getExpression(name)) em.setValue(name, 0);
      return;
    }
    const n = d.face.channels.length;
    const fi = Math.max(0, Math.min(d.frames - 1, Math.round(t)));
    // 5-frame triangular smoothing: face tracks from low-res video jitter frame to frame
    const W = [1, 2, 3, 2, 1];
    const f = {};
    d.face.channels.forEach((c, k) => {
      let name = c;
      if (this.mirror) name = c.replace('Left', '#').replace('Right', 'Left').replace('#', 'Right');
      let sum = 0, wsum = 0;
      for (let o = -2; o <= 2; o++) {
        const j = fi + o;
        if (j < 0 || j >= d.frames) continue;
        sum += d.faceData[j * n + k] * W[o + 2]; wsum += W[o + 2];
      }
      f[name] = sum / wsum;
    });
    let perfectSync = false;
    for (const c of d.face.channels) {
      if (em.getExpression(c)) { em.setValue(c, f[c]); perfectSync = true; }
    }
    if (!perfectSync) for (const [name, fn] of PRESET_MAP) if (em.getExpression(name)) em.setValue(name, fn(f));
  }

  /** Reference landmark positions (canonical metres) at frame t, or null. */
  reference(d, t) {
    if (!d.ref) return null;
    const nj = d.reference.joints.length;
    const fi = Math.max(0, Math.min(d.frames - 1, Math.round(t)));
    return d.ref.subarray(fi * nj * 3, (fi + 1) * nj * 3);
  }
}

/** Blend two canonical poses (arrays of quaternions). */
export function blendPose(a, b, w) {
  return a.map((q, i) => q.clone().slerp(b[i], w));
}
