"""
Voice — Groq Whisper Speech-to-Text
=====================================
Handles audio transcription via Groq's whisper-large-v3-turbo model.

Accepts any format the browser's MediaRecorder produces (webm, ogg, mp4).
Language can be pinned (e.g. "en", "tw", "ee") or left as None for
Whisper auto-detection — useful when adding multilingual support later.

Author: Nana Kwaku Amoako
Date: February 2026
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    language: Optional[str] = "en",
) -> Optional[str]:
    """
    Transcribe audio using Groq Whisper.

    Args:
        audio_bytes: Raw audio file bytes (wav, mp3, webm, ogg, mp4, etc.)
        filename: Original filename — Groq uses the extension to detect the
                  format. Browser MediaRecorder typically outputs .webm.
        language: BCP-47 language code passed to Whisper (e.g. "en", "tw",
                  "ee"). Pass None to let Whisper auto-detect the language.

    Returns:
        Transcribed text string, or None on failure.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — Whisper unavailable")
        return None

    try:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        create_kwargs: dict = {
            "model": "whisper-large-v3-turbo",
            "file": (filename, audio_bytes),
            "response_format": "text",
            "temperature": 0.0,
            "prompt": "Transcribe the speech. The speaker may be discussing "
                      "everyday topics, asking questions, or giving commands.",
        }
        if language:
            create_kwargs["language"] = language

        response = await client.audio.transcriptions.create(**create_kwargs)

        text = response.strip()
        if text:
            logger.info(f"Whisper transcription (lang={language}): '{text[:80]}'")
        return text if text else None

    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return None
