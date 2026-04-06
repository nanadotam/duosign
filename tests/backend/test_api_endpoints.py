from __future__ import annotations

import time

from backend.api import main as main_module


def test_translate_endpoint_returns_gloss_and_tokens(api_client) -> None:
    response = api_client.post("/api/translate", json={"text": "I love you"})
    assert response.status_code == 200
    payload = response.json()
    assert "gloss" in payload
    assert "tokens" in payload


def test_translate_endpoint_rejects_empty_body(api_client) -> None:
    response = api_client.post("/api/translate", json={})
    assert response.status_code == 422


def test_translate_fast_endpoint_is_available(api_client) -> None:
    start = time.perf_counter()
    response = api_client.post("/api/translate/fast", json={"text": "I love you"})
    elapsed_ms = (time.perf_counter() - start) * 1000
    assert response.status_code == 200
    assert elapsed_ms < 200


def test_translate_fast_endpoint_requires_text(api_client) -> None:
    response = api_client.post("/api/translate/fast", json={})
    assert response.status_code == 422


def test_translate_stream_emits_sse_events(api_client) -> None:
    with api_client.stream("POST", "/api/translate/stream", json={"text": "I love you"}) as response:
        body = b"".join(response.iter_bytes()).decode("utf-8")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        assert "event: rule_based" in body


def test_translate_audio_endpoint_missing_file(api_client) -> None:
    response = api_client.post("/api/translate/audio")
    assert response.status_code == 422


def test_translate_audio_endpoint_valid_file(api_client, monkeypatch) -> None:
    async def fake_transcribe(*args, **kwargs):
        return "I love you"

    monkeypatch.setattr(main_module, "transcribe_audio", fake_transcribe)
    response = api_client.post(
        "/api/translate/audio",
        files={"audio": ("audio.webm", b"audio", "audio/webm")},
    )
    assert response.status_code == 200


def test_vocabulary_endpoint_shape(api_client) -> None:
    response = api_client.get("/api/vocabulary")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["total"], int)
    assert isinstance(payload["has_full_alphabet"], bool)


def test_video_and_pose_endpoints(api_client) -> None:
    video_response = api_client.get("/api/video/HELLO", follow_redirects=False)
    pose_response = api_client.get("/api/pose/HELLO", follow_redirects=False)
    missing_video = api_client.get("/api/video/XYZNOTREAL", follow_redirects=False)
    missing_pose = api_client.get("/api/pose/XYZNOTREAL", follow_redirects=False)

    assert video_response.status_code in {200, 302}
    assert pose_response.status_code in {200, 302}
    assert missing_video.status_code == 404
    assert missing_pose.status_code == 404


def test_export_video_endpoint_empty_body(api_client) -> None:
    response = api_client.post("/api/export/video")
    assert response.status_code == 400


def test_health_endpoint(api_client) -> None:
    response = api_client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["vocabulary_loaded"] is True
    assert isinstance(payload["gloss_count"], int)
