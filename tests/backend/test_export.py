from __future__ import annotations

import asyncio
from io import BytesIO

import pytest
from fastapi import UploadFile
from fastapi import HTTPException

from backend.api import export as export_module


class FakeProcess:
    def __init__(self, returncode: int = 0) -> None:
        self.returncode = returncode

    async def communicate(self):
        return b"", b""


@pytest.mark.asyncio
async def test_export_video_invokes_ffmpeg_for_webm(monkeypatch: pytest.MonkeyPatch) -> None:
    recorded: list[list[str]] = []

    async def fake_create_subprocess_exec(*cmd, **kwargs):
        recorded.append(list(cmd))
        output_path = cmd[-1]
        with open(output_path, "wb") as handle:
            handle.write(b"mp4")
        return FakeProcess()

    monkeypatch.setattr(export_module.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    upload = UploadFile(filename="clip.webm", file=BytesIO(b"webm-bytes"))

    response = await export_module.export_video(video=upload, fps=15)

    assert response.media_type == "video/mp4"
    assert response.headers["content-disposition"].endswith('duosign-export.mp4"')
    assert "libx264" in recorded[0]
    assert "18" in recorded[0]
    assert str(recorded[0][-1]).endswith(".mp4")


@pytest.mark.asyncio
async def test_export_video_rejects_empty_upload() -> None:
    upload = UploadFile(filename="clip.webm", file=BytesIO(b""))
    with pytest.raises(HTTPException) as exc:
        await export_module.export_video(video=upload, fps=15)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_export_video_rejects_invalid_frame_array() -> None:
    with pytest.raises(HTTPException) as exc:
        await export_module.export_video(video=None, frames='["not-base64"]', fps=15)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_export_video_requires_one_input_mode() -> None:
    with pytest.raises(HTTPException) as exc:
        await export_module.export_video(video=None, frames=None)
    assert exc.value.status_code == 400
