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

## Your Process
Before translating, UNDERSTAND what the speaker means — not just their words.
1. Identify figurative language, idioms, and implied meaning.
2. Simplify to the core message the speaker is communicating.
3. Express that meaning in ASL gloss following the rules below.

For example: "I will be stepping out for a bit to catch some air. I am at wits end with her"
- The speaker means: I need to go outside briefly. She is frustrating me greatly.
- ASL gloss: I NEED LEAVE SHORT-TIME. OUTSIDE BREATHE. SHE FRUSTRATE ME VERY

## ASL Gloss Rules
- Output ALL CAPS, one word per sign, separated by spaces.
- Use period to separate distinct clauses/sentences.
- Remove articles (a, an, the), prepositions, and auxiliary verbs.
- Use base verb forms: "searching" → SEARCH, "went" → GO.
- Word order is TIME + LOCATION + SUBJECT + OBJECT + VERB + NEGATION.
- Pronouns: I→I, you→YOU, he/she/it→HE/SHE/IT, we→WE, they→THEY.
- Negation (NOT) goes at the END of the clause.
- WH-questions: move question word (WHAT, WHERE, WHO, WHEN, WHY, HOW) to the END.
- Adjectives come AFTER the noun: "big cat" → CAT BIG.
- Plurals: add + after the word: "cats" → CAT+.
- Numbers come AFTER the noun: "three dogs" → DOG THREE.
- Translate idioms and figurative speech by MEANING, not word-by-word.
- Strip conversational fluff ("I just wanted to", "thanks, noted", "you know").
- Only use signs from the provided vocabulary list. If a word is not available, fingerspell it as hyphenated letters: XYLOPHONE → X-Y-L-O-P-H-O-N-E.

## Examples
English: "I am searching for a doctor" → ASL: I DOCTOR SEARCH
English: "Tomorrow I will go to school" → ASL: TOMORROW I SCHOOL GO
English: "She doesn't like pizza" → ASL: SHE PIZZA LIKE NOT
English: "Where is the bathroom?" → ASL: BATHROOM WHERE
English: "It's raining cats and dogs" → ASL: RAIN HEAVY
English: "I have three dogs" → ASL: I DOG THREE HAVE
English: "The big red car is fast" → ASL: CAR BIG RED FAST
English: "I need to bring it to your attention that the deadline has passed" → ASL: INFORM YOU. DEADLINE FINISH PASS
English: "She's been giving me the cold shoulder all week" → ASL: ALL-WEEK SHE IGNORE ME
English: "I'm going to hit the gym before grabbing lunch" → ASL: FIRST I GYM GO. THEN LUNCH GET

## Instructions
1. Understand the speaker's MEANING (not literal words).
2. Map that meaning to signs from the AVAILABLE VOCABULARY LIST ONLY.
3. If a concept has no matching sign, find the closest available synonym. If no synonym exists, fingerspell it.
4. Output ONLY the ASL gloss — no explanations, no extra text."""


def _build_user_prompt(sentence: str, relevant_vocab: list[str]) -> str:
    """Build the user message with sentence and filtered vocabulary."""
    vocab_str = ", ".join(relevant_vocab[:80])
    return (
        f"AVAILABLE SIGNS (use ONLY these, fingerspell anything else):\n"
        f"{vocab_str}\n\n"
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


# ── Whisper Speech-to-Text ────────────────────────────────────────────

async def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    language: Optional[str] = "en",
) -> Optional[str]:
    """
    Transcribe audio using Groq Whisper.

    Args:
        audio_bytes: Raw audio file bytes (wav, mp3, webm, etc.)
        filename: Original filename — Groq uses the extension to detect
                  format. Browser MediaRecorder typically outputs .webm.
        language: BCP-47 language code passed to Whisper (e.g. "en", "tw",
                  "ee"). Pass None to let Whisper auto-detect the language.

    Returns:
        Transcribed text, or None on failure.
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