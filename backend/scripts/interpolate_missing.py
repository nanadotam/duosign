#!/usr/bin/env python3
"""
Fill missing landmarks inside .pose files by interpolating temporal gaps.

This keeps the original pose-format header/body structure intact and only fills
interior gaps where a landmark disappears between two valid detections.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from pose_format import Pose


def interpolate_component(data: np.ndarray, confidence: np.ndarray) -> tuple[np.ndarray, np.ndarray, int]:
    filled = data.copy()
    conf = confidence.copy()
    interpolated_points = 0

    frames, people, points, dims = filled.shape
    for person in range(people):
        for point in range(points):
            valid = conf[:, person, point] > 0
            valid_indices = np.flatnonzero(valid)
            if valid_indices.size < 2:
                continue

            for start_idx, end_idx in zip(valid_indices[:-1], valid_indices[1:]):
                if end_idx - start_idx <= 1:
                    continue

                gap_indices = np.arange(start_idx + 1, end_idx)
                for dim in range(dims):
                    filled[gap_indices, person, point, dim] = np.interp(
                        gap_indices,
                        [start_idx, end_idx],
                        [filled[start_idx, person, point, dim], filled[end_idx, person, point, dim]],
                    )

                conf[gap_indices, person, point] = np.minimum(
                    conf[start_idx, person, point],
                    conf[end_idx, person, point],
                )
                interpolated_points += gap_indices.size

    return filled, conf, interpolated_points


def interpolate_pose_file(input_path: Path, output_path: Path | None = None) -> int:
    output_path = output_path or input_path

    with input_path.open("rb") as handle:
        pose = Pose.read(handle.read())

    data = np.asarray(pose.body.data.filled(0), dtype=np.float32)
    confidence = np.asarray(pose.body.confidence, dtype=np.float32)
    filled, conf, count = interpolate_component(data, confidence)

    pose.body.data = pose.body.data.__class__(filled, mask=np.stack([conf == 0] * filled.shape[-1], axis=3))
    pose.body.confidence = conf

    with output_path.open("wb") as handle:
        pose.write(handle)

    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Interpolate missing landmarks inside .pose files.")
    parser.add_argument("paths", nargs="+", help="One or more .pose files to patch in place.")
    args = parser.parse_args()

    total = 0
    for raw_path in args.paths:
        path = Path(raw_path)
        count = interpolate_pose_file(path)
        total += count
        print(f"{path.name}: interpolated {count} landmark frames")

    print(f"total_interpolated={total}")


if __name__ == "__main__":
    main()
