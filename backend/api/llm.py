"""
LLM Fallback — Groq AI Client
==============================
Handles complex translations that rule-based processing can't:
idioms, conditionals, complex grammar, low-confidence outputs.

Uses prompt engineering with ASL grammar rules and few-shot examples
baked into the system prompt. Sends only relevant vocabulary subset
to keep prompts small (~300 tokens) for free-tier efficiency.

Author: Nana Kwaku Amoako
Date: February 2026
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── System prompt with ASL rules + few-shot examples ─────────────────

SYSTEM_PROMPT = """You are an expert English-to-ASL Gloss translator for the DuoSign system.

## ASL Gloss Rules
- Output ALL CAPS, one word per sign, separated by spaces.
- Remove articles (a, an, the), prepositions, and auxiliary verbs.
- Use base verb forms: "searching" → SEARCH, "went" → GO.
- Word order is TIME + LOCATION + SUBJECT + OBJECT + VERB + NEGATION.
- Pronouns: I→I, you→YOU, he/she/it→HE/SHE/IT, we→WE, they→THEY.
- Negation (NOT) goes at the END of the clause.
- WH-questions: move question word (WHAT, WHERE, WHO, WHEN, WHY, HOW) to the END.
- Adjectives come AFTER the noun: "big cat" → CAT BIG.
- Plurals: add + after the word: "cats" → CAT+.
- Numbers come AFTER the noun: "three dogs" → DOG THREE.
- Translate idioms by MEANING, not word-by-word.
- Only use signs from the provided vocabulary list. If a word is not available, fingerspell it as hyphenated letters: XYLOPHONE → X-Y-L-O-P-H-O-N-E.

## Examples
English: "I am searching for a doctor" → ASL: I DOCTOR SEARCH
English: "Tomorrow I will go to school" → ASL: TOMORROW I SCHOOL GO
English: "She doesn't like pizza" → ASL: SHE PIZZA LIKE NOT
English: "Where is the bathroom?" → ASL: BATHROOM WHERE
English: "The cats are sleeping on the bed" → ASL: CAT+ BED SLEEP
English: "It's raining cats and dogs" → ASL: RAIN HEAVY
English: "If it rains tomorrow, I will stay home" → ASL: TOMORROW RAIN IF I HOME STAY
English: "I have three dogs" → ASL: I DOG THREE HAVE
English: "The big red car is fast" → ASL: CAR BIG RED FAST
English: "Do you like chocolate?" → ASL: YOU CHOCOLATE LIKE
English: "Yesterday at the hospital she visited her friend" → ASL: YESTERDAY HOSPITAL SHE FRIEND VISIT

## Instructions
Given an English sentence, output ONLY the ASL gloss — no explanations, no extra text.
Prefer signs from the available vocabulary list below. Fingerspell unknown words."""


def _build_user_prompt(sentence: str, relevant_vocab: list[str]) -> str:
    """Build the user message with sentence and filtered vocabulary."""
    vocab_str = ", ".join(relevant_vocab[:80])
    return (
        f"Available vocabulary: {vocab_str}\n\n"
        f"Translate to ASL gloss: \"{sentence}\""
    )


async def llm_translate(
    sentence: str,
    relevant_vocab: list[str],
    rule_based_attempt: Optional[str] = None,
) -> Optional[str]:
    """
    Call Groq LLM to translate English → ASL Gloss.

    Args:
        sentence: Original English sentence.
        relevant_vocab: Filtered list of available signs (~50-80 words).
        rule_based_attempt: Optional rule-based result for LLM to improve on.

    Returns:
        ASL gloss string, or None if LLM call fails.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — LLM fallback unavailable")
        return None

    try:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        # Build messages
        user_content = _build_user_prompt(sentence, relevant_vocab)
        if rule_based_attempt:
            user_content += f"\n\nRule-based attempt (may need fixing): {rule_based_attempt}"

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,  # Low temp for consistent translations
            max_tokens=200,
        )

        raw = response.choices[0].message.content.strip()

        # Clean: keep only uppercase words, +, and hyphens (fingerspelling)
        gloss = _clean_llm_output(raw)
        logger.info(f"LLM translation: '{sentence}' → '{gloss}'")
        return gloss

    except ImportError:
        logger.error("groq package not installed. Run: pip install groq")
        return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None


def _clean_llm_output(raw: str) -> str:
    """
    Clean LLM response to extract only the gloss tokens.
    Removes any explanatory text the LLM might add.
    """
    # Take just the first line (LLM sometimes adds explanation after)
    first_line = raw.strip().split("\n")[0]

    # Remove common prefixes the LLM might add
    for prefix in ["ASL:", "ASL Gloss:", "Gloss:", "Output:", "→"]:
        if first_line.upper().startswith(prefix.upper()):
            first_line = first_line[len(prefix):].strip()

    # Remove quotes if present
    first_line = first_line.strip("\"'")

    return first_line.upper().strip()


# ── Whisper Speech-to-Text (placeholder) ─────────────────────────────

async def transcribe_audio(audio_bytes: bytes) -> Optional[str]:
    """
    Transcribe audio to English text using Groq Whisper.

    Args:
        audio_bytes: Raw audio file bytes (wav, mp3, etc.)

    Returns:
        Transcribed English text, or None on failure.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — Whisper unavailable")
        return None

    try:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=api_key)

        # Groq's Whisper endpoint
        response = await client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=("audio.wav", audio_bytes),
            response_format="text",
            language="en",
        )

        text = response.strip()
        logger.info(f"Whisper transcription: '{text[:80]}...'")
        return text

    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return None
