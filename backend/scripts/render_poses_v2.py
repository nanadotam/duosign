#!/usr/bin/env python3
"""
Batch render all .pose files in bucket/poses/ → bucket/poses_v2/{GLOSS}.mp4

Face rendering: filled mask style (oval outline + filled eyebrows, eyes, lips)
on white background. Videos are yuv420p H.264, browser-compatible.

~8x smaller than raw .pose files (300-600KB → 30-80KB per sign).

Run:
    /opt/anaconda3/bin/python render_poses_v2.py
    /opt/anaconda3/bin/python render_poses_v2.py --workers 6   # faster on M-series
    /opt/anaconda3/bin/python render_poses_v2.py --gloss HELLO  # single gloss
    /opt/anaconda3/bin/python render_poses_v2.py --overwrite    # re-render existing
"""

from __future__ import annotations

import argparse
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import cv2
import numpy as np
from pose_format import Pose
from pose_format.pose_visualizer import PoseVisualizer
from pose_format.utils.generic import pose_normalization_info, normalize_pose_size
from vidgear.gears import WriteGear

REPO_ROOT  = Path(__file__).resolve().parents[2]
POSES_DIR  = REPO_ROOT / "bucket" / "poses"
OUT_DIR    = REPO_ROOT / "bucket" / "poses_v2"

# ── MediaPipe face mesh feature indices ─────────────────────────────────────

FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
]
LEFT_EYEBROW  = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]
RIGHT_EYEBROW = [46,  53,  52,  65,  55,  107, 66,  105, 63,  70 ]
LEFT_EYE  = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE = [33,  7,   163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
              375, 321, 405, 314, 17, 84, 181, 91, 146]
LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
              324, 318, 402, 317, 14, 87, 178, 88, 95]

# BGR colors (PoseVisualizer frames are OpenCV BGR)
FACE_COLOR = (28, 28, 180)    # dark crimson
FACE_BG    = (255, 255, 255)  # white — clears skeleton bleed-through inside oval

FACE_OFFSET = 33  # POSE_LANDMARKS has 33 pts; face data starts at index 33


# ── Drawing helpers ───────────────────────────────────────────────────────────

def _pts(face_data: np.ndarray, indices: list[int]) -> np.ndarray | None:
    pts = np.array([[int(face_data[i, 0]), int(face_data[i, 1])] for i in indices],
                   dtype=np.int32)
    return pts if len(pts) >= 3 else None


def draw_face(frame: np.ndarray, face_data: np.ndarray) -> None:
    c = FACE_COLOR
    oval = _pts(face_data, FACE_OVAL)
    if oval is not None:
        cv2.fillPoly(frame, [oval], color=FACE_BG)                               # clear interior
        cv2.polylines(frame, [oval], isClosed=True, color=c, thickness=4,
                      lineType=cv2.LINE_AA)
    for brow in (LEFT_EYEBROW, RIGHT_EYEBROW):
        pts = _pts(face_data, brow)
        if pts is not None:
            cv2.fillPoly(frame, [cv2.convexHull(pts)], color=c)
    for eye in (LEFT_EYE, RIGHT_EYE):
        pts = _pts(face_data, eye)
        if pts is not None:
            cv2.fillPoly(frame, [cv2.convexHull(pts)], color=c)
    outer = _pts(face_data, LIPS_OUTER)
    if outer is not None:
        cv2.fillPoly(frame, [outer], color=c)
    inner = _pts(face_data, LIPS_INNER)
    if inner is not None:
        inner_c = (int(c[0] * 0.55), int(c[1] * 0.55), int(c[2] * 0.55))
        cv2.fillPoly(frame, [inner], color=inner_c)


# ── Frame generator ───────────────────────────────────────────────────────────

def frames(pose: Pose):
    body_data = np.array(pose.body.data.filled(0))
    for component in pose.header.components:
        if component.name == "FACE_LANDMARKS":
            component.limbs  = []
            component.colors = [FACE_BG]
            break
    v = PoseVisualizer(pose)
    for i, frame in enumerate(v.draw(background_color=(255, 255, 255))):
        draw_face(frame, body_data[i, 0, FACE_OFFSET: FACE_OFFSET + 478])
        yield frame


# ── Render one file ───────────────────────────────────────────────────────────

def render_one(pose_path: Path, out_path: Path) -> str:
    try:
        with pose_path.open("rb") as f:
            pose = Pose.read(f.read())

        pose = pose.normalize(pose_normalization_info(pose.header))
        normalize_pose_size(pose)

        fps = float(getattr(pose.body, "fps", 25))
        params = {
            "-vcodec": "libx264",
            "-crf": "23",
            "-preset": "fast",
            "-pix_fmt": "yuv420p",
            "-input_framerate": fps,
        }
        writer = WriteGear(output=str(out_path), logging=False, **params)
        for frame in frames(pose):
            writer.write(frame)
        writer.close()
        return f"OK    {pose_path.name}"
    except Exception:
        return f"FAIL  {pose_path.name}\n{traceback.format_exc(limit=3)}"


# ── Batch driver ──────────────────────────────────────────────────────────────

def run(gloss: str | None, overwrite: bool, workers: int) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if gloss:
        name = gloss.upper().replace(" ", "_")
        src = POSES_DIR / f"{name}.pose"
        if not src.exists():
            sys.exit(f"No pose file for gloss '{name}' in {POSES_DIR}")
        jobs = [(src, OUT_DIR / f"{name}.mp4")]
    else:
        jobs = [
            (p, OUT_DIR / f"{p.stem}.mp4")
            for p in sorted(POSES_DIR.glob("*.pose"))
            if overwrite or not (OUT_DIR / f"{p.stem}.mp4").exists()
        ]

    skipped = 2000 - len(jobs) if not gloss else 0
    print(f"Rendering {len(jobs)} poses → {OUT_DIR}  (skipped {skipped} existing)\n")

    if not jobs:
        print("Nothing to do. Use --overwrite to re-render.")
        return

    ok = fail = 0

    if workers == 1:
        for i, (src, dst) in enumerate(jobs, 1):
            status = render_one(src, dst)
            ok += status.startswith("OK")
            fail += status.startswith("FAIL")
            print(f"[{i}/{len(jobs)}] {status}")
    else:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            fut_map = {pool.submit(render_one, s, d): (i, s)
                       for i, (s, d) in enumerate(jobs, 1)}
            for fut in as_completed(fut_map):
                i, _ = fut_map[fut]
                status = fut.result()
                ok += status.startswith("OK")
                fail += status.startswith("FAIL")
                print(f"[{i}/{len(jobs)}] {status}")

    print(f"\nDone: {ok} OK  {fail} failed  {skipped} skipped")


def main() -> None:
    p = argparse.ArgumentParser(description="Render poses_v2 MP4s from bucket/poses/")
    p.add_argument("--gloss",     default=None, help="Single gloss (default: all)")
    p.add_argument("--overwrite", action="store_true")
    p.add_argument("--workers",   type=int, default=1,
                   help="Parallel workers (default 1; use 4-6 on M-series)")
    args = p.parse_args()
    run(args.gloss, args.overwrite, args.workers)


if __name__ == "__main__":
    main()
