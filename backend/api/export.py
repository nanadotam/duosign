"""
Video Export — FFmpeg Conversion
=================================
Accepts a WebM blob (from captureStream on Chrome/Firefox/Edge)
or a JSON array of base64 JPEG frames (Safari/iOS fallback),
converts to H.264 MP4 via FFmpeg, and returns the file.

Run FFmpeg install check:
  ffmpeg -version

Author: Nana Kwaku Amoako
"""

import asyncio
import base64
import json
import logging
import tempfile
from pathlib import Path
from typing import Optional

import imageio_ffmpeg
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)
router = APIRouter()

# imageio-ffmpeg bundles its own binary — no system ffmpeg needed
FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()


@router.post("/api/export/video")
async def export_video(
    video: Optional[UploadFile] = File(None),
    frames: Optional[str] = Form(None),
    fps: int = Form(15),
):
    """
    Convert an avatar recording to MP4.

    Two input modes (send exactly one):
      - `video`  — WebM file from MediaRecorder.captureStream()  [Chrome/Firefox/Edge]
      - `frames` — JSON array of base64 JPEG strings + `fps`     [Safari/iOS fallback]

    Returns raw MP4 bytes as video/mp4.
    """
    if not video and not frames:
        raise HTTPException(
            400, "Provide either 'video' (WebM file) or 'frames' (base64 JPEG array)"
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        output_path = tmp / "output.mp4"

        if video:
            # ── Mode 1: WebM blob → H.264 MP4 ──────────────────────────
            video_bytes = await video.read()
            if not video_bytes:
                raise HTTPException(400, "Empty video file")

            input_path = tmp / "input.webm"
            input_path.write_bytes(video_bytes)

            cmd = [
                FFMPEG_BIN, "-y",
                "-i", str(input_path),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-movflags", "+faststart",
                "-pix_fmt", "yuv420p",
                str(output_path),
            ]

        else:
            # ── Mode 2: JPEG frames → H.264 MP4 ────────────────────────
            try:
                frame_list: list[str] = json.loads(frames)  # type: ignore[arg-type]
            except (json.JSONDecodeError, TypeError):
                raise HTTPException(400, "Invalid frames JSON")

            if not frame_list:
                raise HTTPException(400, "Empty frames array")

            for i, frame_b64 in enumerate(frame_list):
                # Strip data URI prefix (data:image/jpeg;base64,...)
                if "," in frame_b64:
                    frame_b64 = frame_b64.split(",", 1)[1]
                frame_bytes = base64.b64decode(frame_b64)
                (tmp / f"frame{i:04d}.jpg").write_bytes(frame_bytes)

            cmd = [
                FFMPEG_BIN, "-y",
                "-framerate", str(fps),
                "-i", str(tmp / "frame%04d.jpg"),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-movflags", "+faststart",
                "-pix_fmt", "yuv420p",
                str(output_path),
            ]

        # ── Run FFmpeg ──────────────────────────────────────────────────
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

            if proc.returncode != 0:
                logger.error(f"FFmpeg stderr: {stderr.decode()}")
                raise HTTPException(500, "Video conversion failed")

            mp4_bytes = output_path.read_bytes()
            logger.info(f"Export: converted {len(mp4_bytes):,} bytes to MP4")

            return Response(
                content=mp4_bytes,
                media_type="video/mp4",
                headers={
                    "Content-Disposition": 'attachment; filename="duosign-export.mp4"',
                    "Content-Length": str(len(mp4_bytes)),
                    "Cache-Control": "no-store",
                },
            )

        except asyncio.TimeoutError:
            raise HTTPException(504, "Video conversion timed out (>120s)")
