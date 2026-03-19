#!/usr/bin/env python3
"""
WLASL Pose Extraction & Gloss Ranking Pipeline
===============================================

Uses pose-format's built-in MediaPipe extraction (video_to_pose CLI under the hood)
to produce .pose files from WLASL videos, then ranks each gloss's videos by
hand detection quality — because Kalidokit's accuracy degrades significantly
when hands are undetected or partially visible.

The "best" video per gloss is the one with the highest combined hand detection
score. A ranked fallback list is also written so the frontend can try the next
best if the primary fails to animate cleanly.

Output structure (mirrors a storage bucket):
    output_dir/
        poses/          ← all raw .pose files named by video ID
        best/           ← top-ranked .pose per gloss, named by gloss
                           e.g. HELLO.pose, THANK_YOU.pose
        poses-backup/   ← 2nd/3rd best .pose per gloss
        videos/         ← source videos matched to best poses
        rankings.json   ← full ranked list per gloss with scores

Usage:
    python wlasl_pose_pipeline.py \
        --class_list code-to-be-implemented/wlasl/WLASL_v0.3.json \
        --video_dir  /Users/nanaamoako/wlasl-processed/videos \
        --output_dir bucket \
        --workers    6

    # Skip extraction if poses already exist, just re-rank:
    python wlasl_pose_pipeline.py \
        --class_list code-to-be-implemented/wlasl/WLASL_v0.3.json \
        --video_dir  /Users/nanaamoako/wlasl-processed/videos \
        --output_dir bucket \
        --skip_extraction

Recommended workers by machine:
    M4 Pro 14-core / 24GB  → 6
    M4 Max 14-core / 36GB  → 8
    M1/M2 8-core  / 16GB   → 3

Requirements:
    pip install pose-format mediapipe tqdm psutil
"""

import json
import shutil
import argparse
import subprocess
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from dataclasses import dataclass, asdict

from tqdm import tqdm

try:
    from pose_format import Pose
except ImportError:
    raise SystemExit("pose-format not installed. Run: pip install pose-format mediapipe")


# ── Scoring weights ────────────────────────────────────────────────────────────
#
# Hand detection is the primary quality signal for Kalidokit compatibility.
# When MediaPipe can't find a hand, Kalidokit has nothing to work with and
# produces broken/frozen bone rotations on the VRM. Right hand is weighted
# higher because WLASL signers are predominantly right-dominant (extraction
# report: 61% right vs 28% left average detection across videos).
#
WEIGHT_RIGHT_HAND = 0.50
WEIGHT_LEFT_HAND  = 0.30
WEIGHT_POSE       = 0.15
WEIGHT_FACE       = 0.05

# Videos below this composite score are flagged as unusable for live animation.
# 0.40 means: at minimum, the dominant hand must be visible in ~80% of frames.
MIN_USABLE_SCORE = 0.40


@dataclass
class VideoScore:
    video_id:   str
    gloss:      str
    pose_file:  str
    frames:     int
    pose_det:   float
    face_det:   float
    right_hand: float
    left_hand:  float
    score:      float

    def to_dict(self):
        return asdict(self)


# ── Step 1: Parallel extraction ────────────────────────────────────────────────

def _extract_one(args: tuple) -> tuple[str, bool, str]:
    """
    Top-level worker function — must be module-level to be picklable
    by ProcessPoolExecutor.

    Runs video_to_pose for a single video as a subprocess. Each worker
    runs a completely independent MediaPipe process so there is no shared
    state or GIL contention between workers.

    Returns:
        (video_name, success, error_message)
    """
    import subprocess
    from pathlib import Path

    video_path, out_pose_path = args
    video_path    = Path(video_path)
    out_pose_path = Path(out_pose_path)

    # Resumable: skip if already extracted
    if out_pose_path.exists():
        return (video_path.name, True, "skipped")

    result = subprocess.run(
        [
            "video_to_pose",
            "--format", "mediapipe",
            "-i", str(video_path),
            "-o", str(out_pose_path),
            "--additional-config",
            "model_complexity=2,smooth_landmarks=false,refine_face_landmarks=true",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        err = (result.stderr.strip().splitlines()[-1]
               if result.stderr.strip() else "unknown error")
        return (video_path.name, False, err)

    return (video_path.name, True, "")


def extract_poses(video_dir: Path, poses_dir: Path, workers: int):
    """
    Extracts .pose files in parallel using ProcessPoolExecutor.

    Each worker calls video_to_pose as a subprocess, so MediaPipe model
    instances are fully isolated per process. On an M4 Pro with 6 workers
    this cuts extraction time from ~30h to ~5-6h for the full WLASL dataset.

    The run is fully resumable — any video that already has a .pose file
    is skipped automatically, so you can safely interrupt and restart.
    """
    poses_dir.mkdir(parents=True, exist_ok=True)

    VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"}
    all_videos = [f for f in video_dir.iterdir() if f.suffix.lower() in VIDEO_EXTS]

    if not all_videos:
        raise RuntimeError(f"No video files found in {video_dir}")

    pending = [
        v for v in all_videos
        if not (poses_dir / f"{v.stem}.pose").exists()
    ]
    already_done = len(all_videos) - len(pending)

    print(f"\n[1/3] Extraction")
    print(f"      Total videos   : {len(all_videos)}")
    print(f"      Already done   : {already_done} (skipping)")
    print(f"      To process     : {len(pending)}")
    print(f"      Workers        : {workers}")

    if not pending:
        print(f"      Nothing to do — all .pose files already exist.")
        return

    # Pass strings only — Path objects aren't always picklable across processes
    work = [(str(v), str(poses_dir / f"{v.stem}.pose")) for v in pending]

    failed  = []
    success = 0

    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(_extract_one, args): args[0] for args in work}

        with tqdm(total=len(pending), desc="Extracting", unit="video") as bar:
            for future in as_completed(futures):
                name, ok, msg = future.result()
                if ok:
                    success += 1
                else:
                    failed.append((name, msg))
                bar.update(1)
                bar.set_postfix({"failed": len(failed)})

    total_pose_files = len(list(poses_dir.glob("*.pose")))
    print(f"\n    ✓ {success} extracted this run")
    print(f"      {already_done} skipped (already existed)")
    print(f"      {len(failed)} failed")
    print(f"      {total_pose_files} total .pose files in {poses_dir}")

    if failed:
        print(f"\n    Failed videos ({len(failed)}):")
        for name, err in failed[:20]:
            print(f"       ✗ {name}: {err}")
        if len(failed) > 20:
            print(f"       ... and {len(failed) - 20} more")


# ── Step 2: Score each .pose file ─────────────────────────────────────────────

def score_pose_file(pose_path: Path) -> dict | None:
    """
    Load a .pose file and compute per-component detection rates.

    pose-format stores landmarks as a masked numpy array (T, 1, N, 3).
    A masked entry means MediaPipe did not detect that landmark in that frame.
    A frame is "detected" for a component if at least one landmark is unmasked.

    Returns None if the file has 0 frames (corrupt or empty video).
    """
    with open(pose_path, "rb") as f:
        pose = Pose.read(f.read())

    conf = pose.body.confidence  # (T, 1, N) masked array
    T    = conf.shape[0]

    if T == 0:
        return None

    component_ranges = {}
    cursor = 0
    for comp in pose.header.components:
        n = len(comp.points)
        component_ranges[comp.name] = (cursor, cursor + n)
        cursor += n

    def detection_rate(name: str) -> float:
        if name not in component_ranges:
            return 0.0
        s, e = component_ranges[name]
        chunk = conf[:, 0, s:e]
        import numpy.ma as ma
        if isinstance(chunk, ma.MaskedArray):
            frames_detected = (~chunk.mask).any(axis=1)
        else:
            # Plain ndarray means no missing data — all frames detected
            frames_detected = (chunk > 0).any(axis=1)
        return float(frames_detected.sum()) / T

    pose_det   = detection_rate("POSE_LANDMARKS")
    face_det   = detection_rate("FACE_LANDMARKS")
    right_hand = detection_rate("RIGHT_HAND_LANDMARKS")
    left_hand  = detection_rate("LEFT_HAND_LANDMARKS")

    score = (
        WEIGHT_RIGHT_HAND * right_hand +
        WEIGHT_LEFT_HAND  * left_hand  +
        WEIGHT_POSE       * pose_det   +
        WEIGHT_FACE       * face_det
    )

    return {
        "frames":     T,
        "pose_det":   round(pose_det,   3),
        "face_det":   round(face_det,   3),
        "right_hand": round(right_hand, 3),
        "left_hand":  round(left_hand,  3),
        "score":      round(score,      4),
    }


# ── Step 3: Map video IDs → glosses, rank, copy best ──────────────────────────

def build_gloss_map(class_list_path: Path) -> dict[str, list[str]]:
    """
    Parse WLASL JSON and return {GLOSS: [video_id, ...]} mapping.

    Supports both WLASL_v0.3.json and nslt_*.json (same structure):
        [{"gloss": "hello", "instances": [{"video_id": "05730", ...}]}, ...]
    """
    with open(class_list_path) as f:
        data = json.load(f)

    return {
        entry["gloss"].upper(): [str(i["video_id"]) for i in entry["instances"]]
        for entry in data
    }


def rank_and_export(
    gloss_map:  dict,
    poses_dir:  Path,
    best_dir:   Path,
    backup_dir: Path,
    videos_src: Path,
    videos_dst: Path,
    output_dir: Path,
):
    """
    For each gloss:
      1. Score all available .pose files
      2. Sort by composite score (hand-detection-weighted)
      3. Copy best to best/<GLOSS>.pose
      4. Copy 2nd/3rd best to poses-backup/<GLOSS>_2.pose, <GLOSS>_3.pose
      5. Copy matching source video to videos/<GLOSS>.<ext>
      6. Write rankings.json with full sorted list per gloss
    """
    best_dir.mkdir(parents=True, exist_ok=True)
    backup_dir.mkdir(parents=True, exist_ok=True)
    videos_dst.mkdir(parents=True, exist_ok=True)

    print(f"\n[2/3] Scoring and ranking poses per gloss …")

    rankings = {}
    unusable = []

    for gloss, video_ids in tqdm(gloss_map.items(), desc="Ranking", unit="gloss"):
        scored = []

        for vid_id in video_ids:
            pose_path = poses_dir / f"{vid_id}.pose"
            if not pose_path.exists():
                continue

            metrics = score_pose_file(pose_path)
            if metrics is None:
                continue

            scored.append(VideoScore(
                video_id  = vid_id,
                gloss     = gloss,
                pose_file = str(pose_path),
                **metrics,
            ))

        if not scored:
            unusable.append(gloss)
            continue

        scored.sort(key=lambda s: s.score, reverse=True)
        rankings[gloss] = [s.to_dict() for s in scored]

        best = scored[0]
        gloss_safe = gloss.replace(" ", "_")

        if best.score >= MIN_USABLE_SCORE:
            shutil.copy2(best.pose_file, best_dir / f"{gloss_safe}.pose")

            for ext in (".mp4", ".mov", ".avi", ".mkv", ".webm"):
                src_video = videos_src / f"{best.video_id}{ext}"
                if src_video.exists():
                    shutil.copy2(src_video, videos_dst / f"{gloss_safe}{ext}")
                    break

            for rank, entry in enumerate(scored[1:3], start=2):
                if entry.score >= MIN_USABLE_SCORE * 0.7:
                    shutil.copy2(entry.pose_file, backup_dir / f"{gloss_safe}_{rank}.pose")
        else:
            unusable.append(gloss)

    with open(output_dir / "rankings.json", "w") as f:
        json.dump(rankings, f, indent=2)

    return rankings, unusable


# ── Summary ────────────────────────────────────────────────────────────────────

def print_summary(rankings: dict, unusable: list, best_dir: Path, output_dir: Path):
    print(f"\n[3/3] Summary")
    print(f"    Glosses ranked:   {len(rankings)}")
    print(f"    Best poses saved: {len(list(best_dir.glob('*.pose')))}")
    print(f"    Unusable glosses: {len(unusable)}")

    if unusable:
        print(f"\n    ⚠ Below score threshold ({MIN_USABLE_SCORE}) — will fingerspell:")
        for g in unusable[:20]:
            print(f"       - {g}")
        if len(unusable) > 20:
            print(f"       ... and {len(unusable) - 20} more")

    if rankings:
        top = sorted(
            [(g, v[0]["score"], v[0]["video_id"]) for g, v in rankings.items()],
            key=lambda x: x[1], reverse=True,
        )

        print("\n    Best 5 (hand detection):")
        for g, s, v in top[:5]:
            print(f"       {g:<22} score={s:.3f}  video={v}")

        print("\n    Worst 5 (hand detection):")
        for g, s, v in top[-5:]:
            print(f"       {g:<22} score={s:.3f}  video={v}")

    print(f"\n    rankings.json → {output_dir / 'rankings.json'}")
    print(f"    Best poses    → {best_dir}/\n")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="WLASL pose extraction + gloss ranking",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--class_list", required=True,
                        help="WLASL class list JSON (WLASL_v0.3.json or nslt_*.json)")
    parser.add_argument("--video_dir",  required=True,
                        help="Directory of raw WLASL videos")
    parser.add_argument("--output_dir", required=True,
                        help="Root output directory (bucket)")
    parser.add_argument("--workers", type=int, default=6,
                        help="Parallel extraction workers (default: 6, safe for M4 Pro / 24GB)")
    parser.add_argument("--skip_extraction", action="store_true",
                        help="Skip extraction; score and rank existing .pose files only")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    poses_dir  = output_dir / "poses"
    best_dir   = output_dir / "best"
    backup_dir = output_dir / "poses-backup"
    videos_dst = output_dir / "videos"
    videos_src = Path(args.video_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 55)
    print("  WLASL Pose Pipeline  (powered by pose-format)")
    print(f"  Workers: {args.workers}")
    print("=" * 55)

    if not args.skip_extraction:
        extract_poses(videos_src, poses_dir, args.workers)
    else:
        print("\n[1/3] Skipping extraction (--skip_extraction)")
        existing = list(poses_dir.glob("*.pose")) if poses_dir.exists() else []
        print(f"      Found {len(existing)} existing .pose files")

    gloss_map = build_gloss_map(Path(args.class_list))
    rankings, unusable = rank_and_export(
        gloss_map, poses_dir, best_dir,
        backup_dir, videos_src, videos_dst, output_dir,
    )
    print_summary(rankings, unusable, best_dir, output_dir)


if __name__ == "__main__":
    main()