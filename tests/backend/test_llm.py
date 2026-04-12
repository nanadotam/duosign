from __future__ import annotations

import asyncio
import sys
import time
import types

import httpx
import pytest

from backend.api.llm import _clean_llm_output, llm_translate


class _FakeChoices:
    def __init__(self, content: str) -> None:
        self.message = types.SimpleNamespace(content=content)


class _FakeResponse:
    def __init__(self, content: str) -> None:
        self.choices = [_FakeChoices(content)]


def _install_fake_groq(monkeypatch: pytest.MonkeyPatch, create_impl):
    class AsyncGroq:
        def __init__(self, api_key: str) -> None:
            self.api_key = api_key
            self.chat = types.SimpleNamespace(
                completions=types.SimpleNamespace(create=create_impl)
            )

    fake_module = types.SimpleNamespace(AsyncGroq=AsyncGroq)
    monkeypatch.setitem(sys.modules, "groq", fake_module)


@pytest.mark.asyncio
async def test_llm_translate_returns_none_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    assert await llm_translate("hello", ["HELLO"]) is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("ASL: HELLO WORLD", "HELLO WORLD"),
        ("Gloss: HELLO", "HELLO"),
        ('"HELLO"', "HELLO"),
        ("HELLO WORLD\nExplanation", "HELLO WORLD"),
    ],
)
async def test_llm_translate_cleans_common_response_formats(
    monkeypatch: pytest.MonkeyPatch,
    raw: str,
    expected: str,
) -> None:
    async def create(**_: object):
        return _FakeResponse(raw)

    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    _install_fake_groq(monkeypatch, create)

    assert await llm_translate("hello", ["HELLO", "WORLD"]) == expected


@pytest.mark.asyncio
async def test_llm_translate_handles_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    async def create(**_: object):
        raise asyncio.TimeoutError

    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    _install_fake_groq(monkeypatch, create)

    start = time.perf_counter()
    result = await llm_translate("hello", ["HELLO"])

    assert result is None
    assert time.perf_counter() - start < 0.5


@pytest.mark.asyncio
async def test_llm_translate_handles_connect_error(monkeypatch: pytest.MonkeyPatch) -> None:
    async def create(**_: object):
        raise httpx.ConnectError("boom")

    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    _install_fake_groq(monkeypatch, create)

    assert await llm_translate("hello", ["HELLO"]) is None


def test_clean_llm_output_trims_prefixes_quotes_and_whitespace() -> None:
    assert _clean_llm_output(" Output: 'hello world' ") == "HELLO WORLD"
