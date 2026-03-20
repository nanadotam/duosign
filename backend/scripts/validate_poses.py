#!/usr/bin/env python3
"""
Validate .pose files for DuoSign playback quality.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from pose_format import Pose


COMPONENTS = [
    "POSE_LANDMARKS",
    "POSE_WORLD_LANDMARKS",
    "FACE_LANDMARKS",
    "LEFT_HAND_LANDMARKS",
    "RIGHT_HAND_LANDMARKS",
]


def component_ranges(pose: Pose) -> dict[str, tuple[int, int]]:
    cursor = 0
    ranges: dict[str, tuple[int, int]] = {}
    for component in pose.header.components:
        count = len(component.points)
        ranges[component.name] = (cursor, cursor + count)
        cursor += count
    return ranges


def detection_rate(confidence: np.ndarray, start: int, end: int) -> float:
    chunk = confidence[:, 0, start:end]
    return float(((chunk > 0).any(axis=1)).mean()) if chunk.size else 0.0


def validate_pose(path: Path) -> dict[str, float | int | str]:
    with path.open("rb") as handle:
        pose = Pose.read(handle.read())

    confidence = np.asarray(pose.body.confidence, dtype=np.float32)
    ranges = component_ranges(pose)

    stats: dict[str, float | int | str] = {
        "file": path.name,
        "frames": confidence.shape[0],
        "fps": float(pose.body.fps),
    }

    for component in COMPONENTS:
        if component in ranges:
            start, end = ranges[component]
            stats[f"{component.lower()}_rate"] = round(detection_rate(confidence, start, end), 3)
        else:
            stats[f"{component.lower()}_rate"] = 0.0

    stats["usable_for_kalidokit"] = int(
        stats["left_hand_landmarks_rate"] >= 0.4 or stats["right_hand_landmarks_rate"] >= 0.4
    )
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Print quality stats for .pose files.")
    parser.add_argument("paths", nargs="+", help="Files or directories containing .pose files.")
    args = parser.parse_args()

    pose_files: list[Path] = []
    for raw_path in args.paths:
        path = Path(raw_path)
        if path.is_dir():
            pose_files.extend(sorted(path.glob("*.pose")))
        else:
            pose_files.append(path)

    for pose_file in pose_files:
        stats = validate_pose(pose_file)
        print(stats)


if __name__ == "__main__":
    main()
