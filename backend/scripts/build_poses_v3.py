#!/usr/bin/env python3
"""
Build bucket/poses_v3/ — slimmed .pose files with contour-only face landmarks.

Changes vs poses/:
  - FACE_LANDMARKS reduced from 478 → 128 points (73% fewer face points)
  - Only face oval, eyebrows, eyes, and lips landmarks are kept
  - Limbs replaced with clean contour connections (no mesh triangulation)
  - All other components (POSE, hands, POSE_WORLD) unchanged
  - File size drops ~40-50% as a result

Run:
    /opt/anaconda3/bin/python build_poses_v3.py
    /opt/anaconda3/bin/python build_poses_v3.py --workers 6
    /opt/anaconda3/bin/python build_poses_v3.py --gloss HELLO
    /opt/anaconda3/bin/python build_poses_v3.py --overwrite
"""

from __future__ import annotations

import argparse
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import chain
from pathlib import Path

import numpy as np
from pose_format import Pose
from pose_format.pose_header import PoseHeader, PoseHeaderComponent

REPO_ROOT  = Path(__file__).resolve().parents[2]
POSES_DIR  = REPO_ROOT / "bucket" / "poses"
OUT_DIR    = REPO_ROOT / "bucket" / "poses_v3"

ALL_COMPONENTS = [
    "POSE_LANDMARKS",
    "FACE_LANDMARKS",
    "LEFT_HAND_LANDMARKS",
    "RIGHT_HAND_LANDMARKS",
    "POSE_WORLD_LANDMARKS",
]

# ── Face contour landmark indices (MediaPipe face mesh) ───────────────────────

FACE_OVAL     = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
LEFT_EYEBROW  = [276,283,282,295,285,300,293,334,296,336]
RIGHT_EYEBROW = [46,53,52,65,55,107,66,105,63,70]
LEFT_EYE      = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
RIGHT_EYE     = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
LIPS_OUTER    = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146]
LIPS_INNER    = [78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]

# Sorted unique indices — these become the new 128-point face component
KEEP = sorted(set(
    FACE_OVAL + LEFT_EYEBROW + RIGHT_EYEBROW +
    LEFT_EYE + RIGHT_EYE + LIPS_OUTER + LIPS_INNER
))
# old landmark index → new index in the 128-point set
REMAP = {old: new for new, old in enumerate(KEEP)}
# Point names for get_components (face points are named "0", "1", ...)
KEEP_NAMES = [str(i) for i in KEEP]


# ── Contour limb builder ──────────────────────────────────────────────────────

def _contour(indices: list[int], closed: bool = True) -> list[tuple[int, int]]:
    remapped = [REMAP[i] for i in indices]
    pairs = [(remapped[i], remapped[i + 1]) for i in range(len(remapped) - 1)]
    if closed:
        pairs.append((remapped[-1], remapped[0]))
    return pairs


NEW_LIMBS = (
    _contour(FACE_OVAL)
    + _contour(LEFT_EYEBROW,  closed=False)
    + _contour(RIGHT_EYEBROW, closed=False)
    + _contour(LEFT_EYE)
    + _contour(RIGHT_EYE)
    + _contour(LIPS_OUTER)
    + _contour(LIPS_INNER)
)

# Colors per contour group (RGB — pose-format stores RGB, reverses to BGR for cv2)
_OVAL_C    = (200, 200, 200)
_BROW_C    = (220, 180, 80)
_EYE_C     = (80, 200, 220)
_LIP_C     = (220, 100, 140)

NEW_COLORS = (
    [_OVAL_C]  * len(_contour(FACE_OVAL))
    + [_BROW_C] * len(_contour(LEFT_EYEBROW,  closed=False))
    + [_BROW_C] * len(_contour(RIGHT_EYEBROW, closed=False))
    + [_EYE_C]  * len(_contour(LEFT_EYE))
    + [_EYE_C]  * len(_contour(RIGHT_EYE))
    + [_LIP_C]  * len(_contour(LIPS_OUTER))
    + [_LIP_C]  * len(_contour(LIPS_INNER))
)


# ── Convert one file ──────────────────────────────────────────────────────────

def convert_one(src: Path, dst: Path) -> str:
    try:
        with src.open("rb") as f:
            pose = Pose.read(f.read())

        # get_components selects the 128 contour points and remaps body data
        slim = pose.get_components(
            ALL_COMPONENTS,
            points={"FACE_LANDMARKS": KEEP_NAMES},
        )

        # Replace auto-remapped limbs with clean contour connections
        for component in slim.header.components:
            if component.name == "FACE_LANDMARKS":
                component.limbs  = NEW_LIMBS
                component.colors = NEW_COLORS
                break

        dst.parent.mkdir(parents=True, exist_ok=True)
        with dst.open("wb") as f:
            slim.write(f)

        orig_kb = src.stat().st_size / 1024
        new_kb  = dst.stat().st_size / 1024
        return f"OK    {src.name}  {orig_kb:.0f}KB → {new_kb:.0f}KB"

    except Exception:
        return f"FAIL  {src.name}\n{traceback.format_exc(limit=3)}"


# ── Batch driver ──────────────────────────────────────────────────────────────

def run(gloss: str | None, overwrite: bool, workers: int) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if gloss:
        name = gloss.upper().replace(" ", "_")
        src = POSES_DIR / f"{name}.pose"
        if not src.exists():
            sys.exit(f"No pose file for '{name}' in {POSES_DIR}")
        jobs = [(src, OUT_DIR / f"{name}.pose")]
    else:
        jobs = [
            (p, OUT_DIR / p.name)
            for p in sorted(POSES_DIR.glob("*.pose"))
            if overwrite or not (OUT_DIR / p.name).exists()
        ]

    skipped = 2000 - len(jobs) if not gloss else 0
    print(f"Converting {len(jobs)} poses → {OUT_DIR}  (skipped {skipped})\n")

    if not jobs:
        print("Nothing to do. Pass --overwrite to re-convert.")
        return

    ok = fail = 0

    if workers == 1:
        for i, (src, dst) in enumerate(jobs, 1):
            status = convert_one(src, dst)
            ok   += status.startswith("OK")
            fail += status.startswith("FAIL")
            print(f"[{i}/{len(jobs)}] {status}")
    else:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            fut_map = {pool.submit(convert_one, s, d): (i, s)
                       for i, (s, d) in enumerate(jobs, 1)}
            for fut in as_completed(fut_map):
                i, _ = fut_map[fut]
                status = fut.result()
                ok   += status.startswith("OK")
                fail += status.startswith("FAIL")
                print(f"[{i}/{len(jobs)}] {status}")

    print(f"\nDone: {ok} OK  {fail} failed  {skipped} skipped")


def main() -> None:
    p = argparse.ArgumentParser(description="Build poses_v3 contour-only .pose files")
    p.add_argument("--gloss",     default=None, help="Single gloss (default: all)")
    p.add_argument("--overwrite", action="store_true")
    p.add_argument("--workers",   type=int, default=1,
                   help="Parallel workers (default 1; use 4-6 on M-series)")
    args = p.parse_args()
    run(args.gloss, args.overwrite, args.workers)


if __name__ == "__main__":
    main()
