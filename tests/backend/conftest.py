from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.api.text_to_gloss import TextToGloss
from backend.api.vocabulary import VocabularyManager, reset_vocabulary


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DATA = REPO_ROOT / "backend" / "data"


@pytest.fixture
def vocab() -> VocabularyManager:
    return VocabularyManager(tsv_path=BACKEND_DATA / "glosses.tsv")


@pytest.fixture
def converter(vocab: VocabularyManager) -> TextToGloss:
    return TextToGloss(vocab)


@pytest.fixture
def api_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    from backend.api import main as main_module

    bucket_dir = tmp_path / "bucket"
    videos_dir = bucket_dir / "videos"
    poses_v3_dir = bucket_dir / "poses_v3"
    poses_dir = bucket_dir / "poses"
    lexicon_dir = tmp_path / "lexicon"

    videos_dir.mkdir(parents=True)
    poses_v3_dir.mkdir(parents=True)
    poses_dir.mkdir(parents=True)
    lexicon_dir.mkdir(parents=True)

    (videos_dir / "HELLO.mp4").write_bytes(b"mp4")
    (poses_v3_dir / "HELLO.pose").write_bytes(b"pose-v3")
    (poses_dir / "HELLO.pose").write_bytes(b"pose")
    (lexicon_dir / "HELLO.json").write_text("{}", encoding="utf-8")

    reset_vocabulary()
    monkeypatch.setattr(main_module, "TSV_PATH", BACKEND_DATA / "glosses.tsv")
    monkeypatch.setattr(main_module, "LEXICON_DIR", lexicon_dir)
    monkeypatch.setattr(main_module, "BUCKET_DIR", bucket_dir)
    monkeypatch.setattr(main_module, "_SUPABASE_STORAGE", "")
    main_module.vocab = None
    main_module.converter = None

    with TestClient(main_module.app) as client:
        yield client

    reset_vocabulary()
    main_module.vocab = None
    main_module.converter = None
