from __future__ import annotations

import sys
import types
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile

from backend.api import main as main_module
from backend.api.voice import transcribe_audio


def _install_fake_groq(monkeypatch: pytest.MonkeyPatch, recorder: list[dict], return_text: str = "hello world") -> None:
    async def create(**kwargs):
        recorder.append(kwargs)
        return return_text

    class AsyncGroq:
        def __init__(self, api_key: str) -> None:
            self.audio = types.SimpleNamespace(
                transcriptions=types.SimpleNamespace(create=create)
            )

    monkeypatch.setitem(sys.modules, "groq", types.SimpleNamespace(AsyncGroq=AsyncGroq))


@pytest.mark.asyncio
@pytest.mark.parametrize("filename", ["audio.webm", "audio.mp3", "audio.wav"])
async def test_transcribe_audio_accepts_common_formats(
    monkeypatch: pytest.MonkeyPatch,
    filename: str,
) -> None:
    recorder: list[dict] = []
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    _install_fake_groq(monkeypatch, recorder)

    result = await transcribe_audio(b"audio", filename=filename, language="en")

    assert result == "hello world"
    assert recorder[0]["file"][0] == filename
    assert recorder[0]["language"] == "en"


@pytest.mark.asyncio
async def test_transcribe_audio_forwards_language_or_omits_it(monkeypatch: pytest.MonkeyPatch) -> None:
    recorder: list[dict] = []
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    _install_fake_groq(monkeypatch, recorder)

    await transcribe_audio(b"audio", filename="audio.webm", language="tw")
    await transcribe_audio(b"audio", filename="audio.webm", language=None)

    assert recorder[0]["language"] == "tw"
    assert "language" not in recorder[1]


@pytest.mark.asyncio
async def test_translate_audio_rejects_empty_upload(api_client, monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_transcribe(*args, **kwargs):
        return "hello"

    monkeypatch.setattr(main_module, "transcribe_audio", fake_transcribe)
    response = api_client.post(
        "/api/translate/audio",
        files={"audio": ("audio.webm", b"", "audio/webm")},
    )

    assert response.status_code == 400
    assert "Empty audio file" in response.text
