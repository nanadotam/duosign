"""
Security tests for DuoSign backend.
Covers: VULN-01, VULN-03, VULN-04, VULN-05, VULN-06, VULN-07

Run:
    cd backend
    pip install pytest httpx pytest-asyncio
    pytest tests/test_security.py -v
"""

import io
import json
import pytest
from httpx import AsyncClient, ASGITransport

from api.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ── VULN-01: Path Traversal in /api/video and /api/pose ────────────────

class TestPathTraversal:
    @pytest.mark.asyncio
    async def test_video_path_traversal_etc_passwd(self, client):
        r = await client.get("/api/video/../../../../etc/passwd")
        assert r.status_code in (400, 404)

    @pytest.mark.asyncio
    async def test_video_path_traversal_parent(self, client):
        r = await client.get("/api/video/../glosses")
        assert r.status_code in (400, 404)

    @pytest.mark.asyncio
    async def test_pose_path_traversal_etc_shadow(self, client):
        r = await client.get("/api/pose/../../../../etc/shadow")
        assert r.status_code in (400, 404)

    @pytest.mark.asyncio
    async def test_pose_path_traversal_parent(self, client):
        r = await client.get("/api/pose/../data/glosses")
        assert r.status_code in (400, 404)

    @pytest.mark.asyncio
    async def test_video_valid_gloss_not_rejected(self, client):
        # Valid gloss should not be rejected — 404 means not found (no file), not blocked
        r = await client.get("/api/video/HELLO")
        assert r.status_code != 400


# ── VULN-03: Audio Upload Size Limit ──────────────────────────────────

class TestAudioSizeLimit:
    @pytest.mark.asyncio
    async def test_audio_too_large_returns_413(self, client):
        large_audio = io.BytesIO(b"X" * (26_214_400 + 1))  # > 25 MB
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("audio.webm", large_audio, "audio/webm")},
        )
        assert r.status_code == 413

    @pytest.mark.asyncio
    async def test_audio_exe_rejected(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("payload.exe", b"MZ", "application/octet-stream")},
        )
        assert r.status_code == 415


# ── VULN-04: Video Export Limits ──────────────────────────────────────

class TestVideoExportLimits:
    @pytest.mark.asyncio
    async def test_fps_zero_rejected(self, client):
        r = await client.post(
            "/api/export/video",
            data={"frames": json.dumps(["data:image/jpeg;base64,/9j/4A=="]), "fps": "0"},
        )
        assert r.status_code == 400

    @pytest.mark.asyncio
    async def test_fps_too_high_rejected(self, client):
        r = await client.post(
            "/api/export/video",
            data={"frames": json.dumps(["data:image/jpeg;base64,/9j/4A=="]), "fps": "9999"},
        )
        assert r.status_code == 400

    @pytest.mark.asyncio
    async def test_too_many_frames_rejected(self, client):
        frames = ["data:image/jpeg;base64,/9j/4A=="] * 4000
        r = await client.post(
            "/api/export/video",
            data={"frames": json.dumps(frames), "fps": "30"},
        )
        assert r.status_code == 400

    @pytest.mark.asyncio
    async def test_video_too_large_rejected(self, client):
        large_video = io.BytesIO(b"X" * (524_288_000 + 1))  # > 500 MB
        r = await client.post(
            "/api/export/video",
            files={"video": ("recording.webm", large_video, "video/webm")},
        )
        assert r.status_code == 413


# ── VULN-05: Vocabulary Search Limit ──────────────────────────────────

class TestVocabLimit:
    @pytest.mark.asyncio
    async def test_limit_too_high_returns_422(self, client):
        r = await client.get("/api/vocabulary/search?q=&limit=999999")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_limit_zero_returns_422(self, client):
        r = await client.get("/api/vocabulary/search?q=&limit=0")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_valid_limit_accepted(self, client):
        r = await client.get("/api/vocabulary/search?q=HE&limit=5")
        assert r.status_code == 200
        data = r.json()
        assert len(data["results"]) <= 5

    @pytest.mark.asyncio
    async def test_default_limit_applies(self, client):
        r = await client.get("/api/vocabulary/search?q=")
        assert r.status_code == 200
        data = r.json()
        assert len(data["results"]) <= 50


# ── VULN-06: Rate Limiting ──────────────────────────────────────────────

class TestRateLimiting:
    @pytest.mark.asyncio
    async def test_translate_fast_rate_limited_after_120(self, client):
        for _ in range(120):
            await client.post("/api/translate/fast", json={"text": "hello"})
        r = await client.post("/api/translate/fast", json={"text": "hello"})
        assert r.status_code == 429

    @pytest.mark.asyncio
    async def test_audio_rate_limited_after_10(self, client):
        tiny_audio = io.BytesIO(b"RIFF" + b"\x00" * 44)
        for _ in range(10):
            await client.post(
                "/api/translate/audio",
                files={"audio": ("audio.webm", tiny_audio, "audio/webm")},
            )
            tiny_audio.seek(0)
        tiny_audio.seek(0)
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("audio.webm", tiny_audio, "audio/webm")},
        )
        assert r.status_code == 429


# ── VULN-07: Audio Content-Type Validation ────────────────────────────

class TestAudioContentType:
    @pytest.mark.asyncio
    async def test_exe_rejected(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        )
        assert r.status_code == 415

    @pytest.mark.asyncio
    async def test_pdf_rejected(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        )
        assert r.status_code == 415

    @pytest.mark.asyncio
    async def test_py_rejected(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("exploit.py", b"import os", "text/plain")},
        )
        assert r.status_code == 415

    @pytest.mark.asyncio
    async def test_webm_accepted_format(self, client):
        # Will likely fail transcription (no real audio data), but must NOT be 415
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("audio.webm", b"\x1a\x45\xdf\xa3", "audio/webm")},
        )
        assert r.status_code != 415

    @pytest.mark.asyncio
    async def test_mp3_accepted_format(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("audio.mp3", b"\xff\xfb", "audio/mpeg")},
        )
        assert r.status_code != 415

    @pytest.mark.asyncio
    async def test_wav_accepted_format(self, client):
        r = await client.post(
            "/api/translate/audio",
            files={"audio": ("audio.wav", b"RIFF", "audio/wav")},
        )
        assert r.status_code != 415
