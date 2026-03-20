#!/usr/bin/env python3
"""
Extract .pose files from sign videos with MediaPipe Holistic tuned for DuoSign.

Kalidokit is not part of extraction itself; it consumes the resulting 3D
landmarks later in the browser. Cleaner MediaPipe output improves Kalidokit's
arm, wrist, and hand solves downstream.
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from interpolate_missing import interpolate_pose_file


VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MEDIAPIPE_CONFIG = (
    "model_complexity=2,"
    "smooth_landmarks=true,"
    "refine_face_landmarks=true,"
    "min_detection_confidence=0.7,"
    "min_tracking_confidence=0.7"
)


def extract_one(video_path: Path, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "video_to_pose",
            "--format",
            "mediapipe",
            "-i",
            str(video_path),
            "-o",
            str(output_path),
            "--additional-config",
            MEDIAPIPE_CONFIG,
        ],
        check=True,
    )

    interpolated = interpolate_pose_file(output_path)
    print(f"{video_path.name} -> {output_path.name} (interpolated={interpolated})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract DuoSign-ready .pose files from videos.")
    parser.add_argument("input", help="A video file or directory of videos.")
    parser.add_argument("output", help="A .pose file or output directory.")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if input_path.is_dir():
        output_path.mkdir(parents=True, exist_ok=True)
        videos = [path for path in sorted(input_path.iterdir()) if path.suffix.lower() in VIDEO_EXTENSIONS]
        for video in videos:
            extract_one(video, output_path / f"{video.stem}.pose")
        return

    extract_one(input_path, output_path)


if __name__ == "__main__":
    main()
