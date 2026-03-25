#!/usr/bin/env python3
"""
Extract .pose files from bucket/videos/ using pose-format's video_to_pose.

Usage:
    python extract_from_videos.py                   # process all videos
    python extract_from_videos.py --gloss HELLO     # single gloss
    python extract_from_videos.py --overwrite       # re-extract even if pose exists
    python extract_from_videos.py --workers 4       # parallel (default: 1, safe default)

Output: bucket/poses/{GLOSS}.pose  (overwrites existing)

Requires:
    pip install pose-format mediapipe
    (video_to_pose CLI is installed as part of pose-format)
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from pose_format import Pose


# ── Paths ──────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
VIDEOS_DIR = REPO_ROOT / "bucket" / "videos"
POSES_DIR = REPO_ROOT / "bucket" / "poses"

# ── MediaPipe config (same settings that produced the existing poses) ──────────

MEDIAPIPE_CONFIG = (
    "model_complexity=2,"
    "smooth_landmarks=true,"
    "refine_face_landmarks=true,"
    "min_detection_confidence=0.7,"
    "min_tracking_confidence=0.7"
)


# ── Interpolation (fills temporal gaps where landmarks drop out) ───────────────

def _interpolate_component(
    data: np.ndarray, confidence: np.ndarray
) -> tuple[np.ndarray, np.ndarray, int]:
    filled = data.copy()
    conf = confidence.copy()
    count = 0
    frames, people, points, dims = filled.shape
    for person in range(people):
        for point in range(points):
            valid_idx = np.flatnonzero(conf[:, person, point] > 0)
            if valid_idx.size < 2:
                continue
            for start, end in zip(valid_idx[:-1], valid_idx[1:]):
                if end - start <= 1:
                    continue
                gap = np.arange(start + 1, end)
                for dim in range(dims):
                    filled[gap, person, point, dim] = np.interp(
                        gap,
                        [start, end],
                        [filled[start, person, point, dim], filled[end, person, point, dim]],
                    )
                conf[gap, person, point] = np.minimum(
                    conf[start, person, point], conf[end, person, point]
                )
                count += gap.size
    return filled, conf, count


def interpolate_pose(pose_path: Path) -> int:
    """Fill interior missing-landmark gaps in place. Returns number of frames filled."""
    with pose_path.open("rb") as f:
        pose = Pose.read(f.read())

    data = np.asarray(pose.body.data.filled(0), dtype=np.float32)
    conf = np.asarray(pose.body.confidence, dtype=np.float32)
    filled, new_conf, count = _interpolate_component(data, conf)

    pose.body.data = pose.body.data.__class__(
        filled, mask=np.stack([new_conf == 0] * filled.shape[-1], axis=3)
    )
    pose.body.confidence = new_conf

    with pose_path.open("wb") as f:
        pose.write(f)

    return count


# ── Core extraction ────────────────────────────────────────────────────────────

def extract_one(video_path: Path, output_path: Path) -> str:
    """
    Extract a single video → .pose file using pose-format's video_to_pose CLI.

    Returns a status string for logging.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        subprocess.run(
            [
                "video_to_pose",
                "--format", "mediapipe",
                "-i", str(video_path),
                "-o", str(output_path),
                "--additional-config", MEDIAPIPE_CONFIG,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        return f"FAIL  {video_path.name}: {exc.stderr.strip()[:120]}"
    except FileNotFoundError:
        return "FAIL  video_to_pose not found — run: pip install pose-format"

    # Interpolate missing landmarks in the freshly-written file
    try:
        filled = interpolate_pose(output_path)
    except Exception as exc:  # noqa: BLE001
        return f"WARN  {video_path.name}: extracted but interpolation failed ({exc})"

    return f"OK    {video_path.name} -> {output_path.name}  (interpolated={filled})"


# ── Batch driver ───────────────────────────────────────────────────────────────

def collect_videos(gloss: str | None) -> list[Path]:
    if gloss:
        name = gloss.upper().replace(" ", "_")
        candidates = [
            VIDEOS_DIR / f"{name}.mp4",
            VIDEOS_DIR / f"{name}.mov",
        ]
        found = [p for p in candidates if p.exists()]
        if not found:
            sys.exit(f"No video found for gloss '{name}' in {VIDEOS_DIR}")
        return found

    return sorted(
        p for p in VIDEOS_DIR.iterdir()
        if p.suffix.lower() in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    )


def run(
    gloss: str | None = None,
    overwrite: bool = False,
    workers: int = 1,
) -> None:
    POSES_DIR.mkdir(parents=True, exist_ok=True)

    videos = collect_videos(gloss)
    jobs: list[tuple[Path, Path]] = []
    skipped = 0

    for video in videos:
        out = POSES_DIR / f"{video.stem}.pose"
        if out.exists() and not overwrite:
            skipped += 1
            continue
        jobs.append((video, out))

    total = len(jobs)
    print(f"Videos to process : {total}  (skipped {skipped} already-extracted)")

    if not jobs:
        print("Nothing to do. Pass --overwrite to re-extract existing poses.")
        return

    ok = fail = 0

    if workers == 1:
        for i, (video, out) in enumerate(jobs, 1):
            status = extract_one(video, out)
            print(f"[{i}/{total}] {status}")
            if status.startswith("OK"):
                ok += 1
            else:
                fail += 1
    else:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(extract_one, v, o): (i, v) for i, (v, o) in enumerate(jobs, 1)}
            for fut in as_completed(futures):
                i, _ = futures[fut]
                status = fut.result()
                print(f"[{i}/{total}] {status}")
                if status.startswith("OK"):
                    ok += 1
                else:
                    fail += 1

    print(f"\nDone: {ok} OK, {fail} failed, {skipped} skipped")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract .pose files from bucket/videos/ for DuoSign."
    )
    parser.add_argument(
        "--gloss",
        metavar="WORD",
        default=None,
        help="Extract a single gloss (e.g. --gloss HELLO). Default: all videos.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-extract even if a .pose file already exists.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Parallel workers. Default: 1 (safe). Use 4-6 on M-series Macs.",
    )
    args = parser.parse_args()
    run(gloss=args.gloss, overwrite=args.overwrite, workers=args.workers)


if __name__ == "__main__":
    main()
