from __future__ import annotations

from backend.api.fingerspell import (
    expand_tokens,
    fingerspell_word,
    is_fingerspelled,
    resolve_tokens,
)


class StubVocab:
    def __init__(self, known: set[str]) -> None:
        self.known = known

    def has(self, gloss: str) -> bool:
        return gloss in self.known


def test_fingerspell_word_handles_letters_only() -> None:
    assert fingerspell_word("hello") == ["H", "E", "L", "L", "O"]
    assert fingerspell_word("123") == []
    assert fingerspell_word("") == []
    assert fingerspell_word("hi!") == ["H", "I"]


def test_is_fingerspelled_excludes_ix_markers() -> None:
    assert is_fingerspelled("N-A-N-A") is True
    assert is_fingerspelled("IX-1") is False
    assert is_fingerspelled("IX-3+") is False
    assert is_fingerspelled("HELLO") is False


def test_expand_tokens_expands_hyphenated_letters_only() -> None:
    assert expand_tokens(["N-A-N-A", "HELLO", "IX-2"]) == ["N", "A", "N", "A", "HELLO", "IX-2"]
    assert expand_tokens([]) == []


def test_resolve_tokens_falls_back_to_fingerspelling_for_unknown_tokens() -> None:
    vocab = StubVocab({"HELLO"})
    assert resolve_tokens(["HELLO", "NETFLIX"], vocab) == ["HELLO", "N", "E", "T", "F", "L", "I", "X"]
