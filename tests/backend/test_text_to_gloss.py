from __future__ import annotations

import time
from unittest.mock import MagicMock

import pytest

from backend.api.text_to_gloss import TextToGloss


def test_declarative_sentences(converter: TextToGloss) -> None:
    result = converter.convert_sync("I love you")
    assert "IX-1" in result.tokens
    assert "LOVE" in result.tokens
    assert "IX-2" in result.tokens

    sleeping = converter.convert_sync("The cat is sleeping")
    assert "CAT" in sleeping.tokens
    assert "SLEEP" in sleeping.tokens
    assert "THE" not in sleeping.tokens
    assert "IS" not in sleeping.tokens


@pytest.mark.parametrize(
    ("text", "token"),
    [
        ("I", "IX-1"),
        ("me", "IX-1"),
        ("you", "IX-2"),
        ("he", "IX-3"),
        ("him", "IX-3"),
        ("we", "IX-1+"),
        ("they", "IX-3+"),
    ],
)
def test_pronoun_substitution(converter: TextToGloss, text: str, token: str) -> None:
    assert converter.convert_sync(text).tokens == [token]


def test_negation_and_wh_questions(converter: TextToGloss) -> None:
    negative = converter.convert_sync("I do not like coffee")
    assert negative.tokens.index("NOT") > negative.tokens.index("LIKE")

    contraction = converter.convert_sync("She doesn't understand")
    assert "NOT" in contraction.tokens

    where = converter.convert_sync("Where is the bathroom?")
    what = converter.convert_sync("What do you want?")
    assert "WHERE" in where.tokens
    assert "WHAT" in what.tokens


def test_confidence_and_llm_fallback_detection(converter: TextToGloss) -> None:
    simple = converter.convert_sync("I love you")
    assert simple.confidence >= 0.80

    complex_result = converter.convert_sync("If it rains, I stay home because roads are bad")
    assert complex_result.needs_llm is True or complex_result.method == "llm"


@pytest.mark.asyncio
async def test_cache_reuses_previous_translation(vocab) -> None:
    converter = TextToGloss(vocab)
    original_nlp = converter.nlp
    converter.nlp = MagicMock(wraps=original_nlp)

    await converter.convert("I love you", llm_quality_check=False)
    await converter.convert("I love you", llm_quality_check=False)

    assert converter.nlp.call_count == 1


def test_rule_based_short_sentence_is_fast(converter: TextToGloss) -> None:
    converter.convert_sync("I love you")
    start = time.perf_counter()
    converter.clear_cache()
    converter.convert_sync("I love you")
    elapsed_ms = (time.perf_counter() - start) * 1000
    assert elapsed_ms < 100
