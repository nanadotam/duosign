from __future__ import annotations

from pathlib import Path

from backend.api.vocabulary import FINGERSPELL_ALPHABET, VocabularyManager


def test_vocabulary_manager_loads_from_all_sources(tmp_path: Path) -> None:
    tsv_path = tmp_path / "glosses.tsv"
    lexicon_dir = tmp_path / "lexicon"
    poses_dir = tmp_path / "poses"

    lexicon_dir.mkdir()
    poses_dir.mkdir()

    tsv_path.write_text("1\tcat\n2\thello\n3\tworld\n", encoding="utf-8")
    (lexicon_dir / "doctor.json").write_text("{}", encoding="utf-8")
    (poses_dir / "sleep.pose").write_bytes(b"pose")

    vocab = VocabularyManager(tsv_path=tsv_path, lexicon_dir=lexicon_dir, poses_dir=poses_dir)

    assert FINGERSPELL_ALPHABET.issubset(vocab.glosses)
    assert vocab.has("CAT") is True
    assert vocab.has("CAT+") is True
    assert vocab.has("N-A-N-A") is True
    assert vocab.has("XYZUNKNOWN") is False
    assert 0.0 <= vocab.coverage(["HELLO", "WORLD", "XYZUNKNOWN"]) <= 1.0
    assert vocab.coverage(["HELLO", "WORLD", "XYZUNKNOWN"]) == 2 / 3
    assert vocab.search("HE", limit=5) == ["HELLO"]
    assert vocab.search("HE", limit=0) == []
    assert vocab.has_pose("SLEEP") is True


def test_vocabulary_coverage_empty_input_returns_current_contract(vocab: VocabularyManager) -> None:
    assert vocab.coverage([]) == 1.0
