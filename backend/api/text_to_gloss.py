"""
Text-to-Gloss Converter
========================
Converts English text → ASL Gloss using a two-path approach:

  FAST PATH (rule-based, <50ms):
    Parse with spaCy → filter grammar words → targeted reordering → glossify.
    Keeps tokens in their original parse order and applies targeted swaps
    (SOV reorder, time-fronting, negation-final) rather than deconstructing
    into category buckets. This preserves natural modifier-noun relationships.
    Handles ~80% of sentences.

  SLOW PATH (LLM fallback, 500-2000ms):
    Triggered when confidence is low: idioms, complex grammar, questions.
    Uses Groq AI with ASL-specific prompt engineering.

  BACKGROUND LLM QUALITY CHECK:
    For all non-trivial sentences, an LLM call fires in the background
    to verify/improve the rule-based result. If it returns within the
    timeout, the improved result replaces the rule-based one. This gives
    instant results on slow networks with progressive enhancement on fast ones.

Author: Nana Kwaku Amoako
Date: February 2026
"""

import asyncio
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

import spacy
from spacy.tokens import Token

from .vocabulary import VocabularyManager, NUMBER_WORDS
from .llm import llm_translate
from .fingerspell import fingerspell_word, is_fingerspelled, expand_tokens, resolve_tokens

logger = logging.getLogger(__name__)

# ── Load spaCy model ─────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_spacy():
    """Load spaCy English model (cached)."""
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        logger.error("spaCy model not found. Run: python -m spacy download en_core_web_sm")
        raise


# ── Constants ────────────────────────────────────────────────────────

# Pronoun → IX mapping (internal representation)
PRONOUN_TO_IX: dict[str, str] = {
    "i": "IX-1", "me": "IX-1", "myself": "IX-1",
    "you": "IX-2", "yourself": "IX-2",
    "he": "IX-3", "him": "IX-3",
    "she": "IX-3", "her": "IX-3",
    "it": "IX-3",
    "we": "IX-1+", "us": "IX-1+",
    "they": "IX-3+", "them": "IX-3+",
}

# Possessive pronouns — skip when they modify a noun (dep=poss)
POSSESSIVE_PRONOUNS: set[str] = {"my", "your", "his", "her", "its", "our", "their"}

# IX → readable display form (swapped at output layer)
IX_DISPLAY: dict[str, str] = {
    "IX-1": "I", "IX-2": "YOU", "IX-3": "HE/SHE",
    "IX-1+": "WE", "IX-3+": "THEY",
}

# Time words that get moved to the front
TIME_WORDS: set[str] = {
    "today", "tomorrow", "yesterday", "now", "later", "soon",
    "recently", "already", "morning", "afternoon", "evening",
    "night", "tonight", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday", "sunday",
    "weekly", "daily", "monthly", "yearly",
}

# WH-question words that move to the end
WH_WORDS: set[str] = {"what", "where", "who", "whom", "when", "why", "how", "which"}

# Spatial prepositions whose noun children are locations
SPATIAL_PREPS: set[str] = {"at", "in", "on"}

# Copular "be" forms — dropped when acting as linking verb
# "The car IS fast" → drop "is". "Where IS the bathroom" → drop "is".
BE_LEMMAS: set[str] = {"be"}

# Filler/politeness words to always drop
FILLER_WORDS: set[str] = {"please", "just", "really", "very"}

# Common idioms → ASL gloss
IDIOM_MAP: dict[str, str] = {
    "raining cats and dogs": "RAIN HEAVY",
    "break a leg": "GOOD LUCK",
    "piece of cake": "EASY",
    "hit the sack": "SLEEP GO",
    "under the weather": "SICK FEEL",
    "cost an arm and a leg": "EXPENSIVE VERY",
    "let the cat out of the bag": "SECRET TELL",
    "once in a blue moon": "RARE HAPPEN",
}

# Confidence thresholds
VOCAB_COVERAGE_THRESHOLD = 0.8

# Background LLM quality check timeout (seconds)
LLM_QUALITY_TIMEOUT = 3.0

# Minimum token count to trigger background LLM quality check
# (don't waste LLM calls on single-word inputs)
LLM_QUALITY_MIN_TOKENS = 2


# ── Data structures ──────────────────────────────────────────────────

@dataclass
class GlossResult:
    """Result of a text-to-gloss conversion."""
    input_text: str
    gloss: str                         # Final ASL gloss (display form)
    gloss_internal: str                # Internal form with IX markers
    tokens: list[str] = field(default_factory=list)
    method: str = "rule_based"         # "rule_based", "llm", or "llm_quality"
    confidence: float = 1.0
    needs_llm: bool = False
    llm_reason: str = ""


# ── Main converter class ─────────────────────────────────────────────

class TextToGloss:
    """
    English → ASL Gloss converter.

    Usage:
        converter = TextToGloss(vocab)
        result = await converter.convert("I am searching for a doctor")
        # result.gloss → "I DOCTOR SEARCH"
    """

    def __init__(self, vocab: VocabularyManager):
        self.vocab = vocab
        self.nlp = _load_spacy()
        self._cache: dict[str, GlossResult] = {}

    # ── Public API ───────────────────────────────────────────────────

    async def convert(self, text: str, llm_quality_check: bool = True) -> GlossResult:
        """
        Convert English text to ASL Gloss.

        Steps:
          1. Cache check
          2. Idiom check
          3. spaCy parse → filter → reorder → glossify (rule-based)
          4. If confidence LOW → mandatory LLM fallback (wait for it)
          5. If confidence OK + llm_quality_check → background LLM with timeout
          6. Finalize and cache
        """
        text = text.strip()
        if not text:
            return GlossResult(input_text=text, gloss="", gloss_internal="")

        # 1. Cache check — key includes llm_quality_check flag so fast-mode
        #    results never pollute full-mode results and vice versa.
        cache_key = f"{text.lower()}|llm={llm_quality_check}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 2. Idiom check — short-circuit for known idioms
        idiom_result = self._check_idioms(text)
        if idiom_result:
            result = GlossResult(
                input_text=text,
                gloss=idiom_result,
                gloss_internal=idiom_result,
                tokens=idiom_result.split(),
                method="rule_based",
                confidence=1.0,
            )
            self._cache[cache_key] = result
            return result

        # 3. Rule-based conversion (instant, <50ms)
        result = self._rule_based(text)

        # 4. Mandatory LLM fallback — confidence is too low
        if result.needs_llm:
            llm_gloss = await self._call_llm(text, result)
            if llm_gloss:
                self._apply_llm_result(result, llm_gloss, method="llm")
            self._cache[cache_key] = result
            return result

        # 5. Background LLM quality check — confidence is OK but let's
        #    see if LLM can improve the result within the timeout.
        #    If network is slow (common in Africa), we just return
        #    the rule-based result. If fast, user gets LLM-polished output.
        if (llm_quality_check
            and (len(result.tokens) >= LLM_QUALITY_MIN_TOKENS
                 or text.strip().endswith("?"))):
            llm_gloss = await self._call_llm_with_timeout(
                text, result, timeout=LLM_QUALITY_TIMEOUT
            )
            if llm_gloss and llm_gloss != result.gloss_internal:
                self._apply_llm_result(result, llm_gloss, method="llm_quality")
                logger.info(
                    f"LLM quality improved: '{result.input_text}' → '{result.gloss}'"
                )

        # 6. Cache and return
        self._cache[cache_key] = result
        return result

    def convert_sync(self, text: str) -> GlossResult:
        """Synchronous rule-based only (no LLM). Useful for testing."""
        text = text.strip()
        if not text:
            return GlossResult(input_text=text, gloss="", gloss_internal="")

        idiom_result = self._check_idioms(text)
        if idiom_result:
            return GlossResult(
                input_text=text, gloss=idiom_result,
                gloss_internal=idiom_result, tokens=idiom_result.split(),
            )

        return self._rule_based(text)

    # ── Rule-based pipeline ──────────────────────────────────────────
    #
    # Core approach: keep tokens in original parse order, then apply
    # targeted moves for ASL grammar. This preserves natural modifier
    # relationships (adjectives stay near nouns, numbers stay near nouns)
    # without explicit rules for every modifier type.
    #
    # Pipeline:
    #   1. Filter — remove grammar words, keep content words in order
    #   2. Glossify — lemmatize, pronouns→IX, plurals→+, numbers→signs
    #   3. Reorder — SOV swap, adj-after-noun, num-after-noun,
    #                time→front, location→after-time, WH→end, NOT→end

    def _rule_based(self, text: str) -> GlossResult:
        """Apply ASL grammar rules to convert English → Gloss."""
        doc = self.nlp(text)

        # ── Step 1: Filter — keep content words in original order ────
        kept = self._filter_tokens(doc)

        # ── Step 2: Glossify — convert each token to its gloss form ──
        glossed = self._glossify(kept)

        # ── Step 2b: Expand fingerspelled tokens into individual letters ──
        # "N-A-N-A" → [("N", t), ("A", t), ("N", t), ("A", t)]
        # so each letter maps to its own pose file in the avatar.
        expanded: list[tuple[str, object]] = []
        for g, t in glossed:
            if is_fingerspelled(g):
                for letter in g.split("-"):
                    expanded.append((letter, t))
            else:
                expanded.append((g, t))
        glossed = expanded

        # ── Step 3: Targeted reordering for ASL grammar ──────────────

        # 3a. SOV — move verb after its object
        glossed = self._reorder_sov(glossed)

        # 3b. Adjectives after their head noun (as a group, preserving order)
        glossed = self._modifiers_after_noun(glossed, modifier_dep="amod", modifier_pos="ADJ")

        # 3c. Numbers after their head noun
        glossed = self._modifiers_after_noun(glossed, modifier_dep="nummod", modifier_pos="NUM")

        # 3d. Time words to front (ASL: time sets context first)
        glossed = self._move_to_front(glossed, self._is_time_word)

        # 3e. Spatial locations to front — BUT after time words (FIX #2)
        glossed = self._insert_after_group(
            glossed,
            to_move=self._is_location,
            after=self._is_time_word,
        )

        # 3f. WH-question words to end
        glossed = self._move_to_end(glossed, self._is_wh_word)

        # 3g. Negation (NOT) to very end
        glossed = self._move_to_end(glossed, lambda g, t: g == "NOT")

        # ── Step 4: Build result ─────────────────────────────────────
        gloss_tokens = [g for g, t in glossed]
        gloss_internal = " ".join(gloss_tokens)
        gloss_display = self._to_display_form(gloss_internal)

        # ── Step 5: Confidence check ─────────────────────────────────
        # Exclude structural tokens (IX markers, NOT) from coverage calc
        real_tokens = [t for t in gloss_tokens if not t.startswith("IX-") and t != "NOT"]
        coverage = self.vocab.coverage(real_tokens) if real_tokens else 1.0
        needs_llm, llm_reason = self._check_confidence(text, doc, gloss_tokens, coverage)

        return GlossResult(
            input_text=text,
            gloss=gloss_display,
            gloss_internal=gloss_internal,
            tokens=gloss_tokens,
            method="rule_based",
            confidence=coverage,
            needs_llm=needs_llm,
            llm_reason=llm_reason,
        )

    # ── Step 1: Token filtering ──────────────────────────────────────

    def _filter_tokens(self, doc) -> list[Token]:
        """
        Remove grammar words, keep content words in original parse order.

        Drops: punctuation, articles, determiners, prepositions,
               auxiliaries (by dep label), copular "be" verbs,
               particles, filler words, possessive pronouns, conjunctions.
        Keeps: nouns, verbs, adjectives, adverbs, pronouns, numbers,
               negation words, WH-words.
        """
        kept = []
        for token in doc:
            word = token.text.lower()
            pos = token.pos_
            dep = token.dep_
            lemma = token.lemma_.lower()

            # ALWAYS keep WH-words — no matter what POS spaCy assigns
            if word in WH_WORDS:
                kept.append(token)
                continue

            # Drop: punctuation, whitespace, symbols
            if pos in ("PUNCT", "SPACE", "SYM", "X"):
                continue
            # Drop: determiners (a, an, the, this, that)
            if pos == "DET":
                continue
            # Drop: prepositions (in, on, at, to, for, with, by)
            if pos == "ADP":
                continue
            # Drop: auxiliaries by dependency label
            # "do" as aux → drop. "do" as ROOT main verb → keep.
            # "have" as aux → drop. "have" as main verb → keep.
            if dep in ("aux", "auxpass"):
                continue

            # ── FIX #1: Drop copular "be" (linking verb) ─────────────
            # "The car IS fast" → "is" is ROOT with acomp/attr child → drop
            # "Where IS the bathroom" → "is" is ROOT linking subj to adv → drop
            # But "I will BE there" as aux is already caught above.
            if lemma in BE_LEMMAS and self._is_copular(token):
                continue

            # Drop: particles ("up" in "give up") but keep "not"/"n't"
            if pos == "PART" and word not in ("not", "n't"):
                continue
            # Drop: filler words (please, just, really, very)
            if word in FILLER_WORDS:
                continue
            # Drop: possessive pronouns modifying a noun
            if word in POSSESSIVE_PRONOUNS and dep == "poss":
                continue
            # Drop: conjunctions (and, or, but, if, because)
            if pos in ("CCONJ", "SCONJ"):
                continue

            kept.append(token)

        return kept

    @staticmethod
    def _is_copular(token: Token) -> bool:
        """
        Check if a "be" verb is copular (linking verb, not meaningful).

        Copular "be" connects subject to complement:
          "The car is fast" → is + acomp(fast) → copular, drop
          "Where is the bathroom" → is + nsubj + advmod → copular, drop
          "This is important" → is + acomp → copular, drop

        Non-copular (rare, but keep):
          "Let it be" → be is the main content verb
        """
        child_deps = {c.dep_ for c in token.children}
        # Has adjectival/nominal complement → it's a linking verb
        if child_deps & {"acomp", "attr", "oprd"}:
            return True
        # ROOT "be" with a subject but no real object → linking verb
        if token.dep_ == "ROOT" and (child_deps & {"nsubj", "nsubjpass"}) and not (child_deps & {"dobj", "obj"}):
            return True
        return False

    # ── Step 2: Glossification ───────────────────────────────────────

    def _glossify(self, tokens: list[Token]) -> list[tuple[str, Token]]:
        """
        Convert each spaCy token to its ASL gloss form.

        Returns list of (gloss_string, original_token) pairs.
        Token is kept for dependency info used in reordering.
        """
        glossed = []
        for token in tokens:
            word = token.text.lower()
            lemma = token.lemma_.lower()
            pos = token.pos_

            # Negation → NOT
            if word in ("not", "n't", "no", "never"):
                glossed.append(("NOT", token))
                continue

            # WH-words → uppercase as-is (FIX #6: ensure they survive)
            if word in WH_WORDS:
                glossed.append((word.upper(), token))
                continue

            # Numbers → sign token (0-20) or fingerspell
            if pos == "NUM" or word in NUMBER_WORDS:
                sign = NUMBER_WORDS.get(word) or NUMBER_WORDS.get(lemma)
                glossed.append((sign or self._fingerspell(word), token))
                continue

            # Pronouns → IX markers
            if pos == "PRON" and word in PRONOUN_TO_IX:
                glossed.append((PRONOUN_TO_IX[word], token))
                continue

            # Nouns / proper nouns → lemmatize + plural marker.
            # If the base gloss is not in the vocabulary (e.g. a name like
            # "Nana", "Ghana"), fingerspell it as individual letter tokens.
            if pos in ("NOUN", "PROPN"):
                base = lemma.upper()
                if not self.vocab.has(base):
                    # Unknown word — produce hyphenated fingerspell form
                    # (will be expanded to individual letters after glossify)
                    letters = fingerspell_word(token.text)
                    gloss = "-".join(letters) if letters else base
                else:
                    gloss = base
                    is_plural = "Plur" in (token.morph.get("Number") or [])
                    has_number = any(c.pos_ == "NUM" for c in token.children)
                    if is_plural and not has_number:
                        gloss += "+"
                glossed.append((gloss, token))
                continue

            # Verbs → base form; fingerspell if not in vocabulary
            if pos == "VERB":
                base = lemma.upper()
                if not self.vocab.has(base):
                    letters = fingerspell_word(token.text)
                    gloss = "-".join(letters) if letters else base
                else:
                    gloss = base
                glossed.append((gloss, token))
                continue

            # Adjectives, adverbs, everything else → lemmatize;
            # fingerspell if not in vocabulary
            base = lemma.upper()
            if not self.vocab.has(base):
                letters = fingerspell_word(token.text)
                gloss = "-".join(letters) if letters else base
            else:
                gloss = base
            glossed.append((gloss, token))

        return glossed

    # ── Step 3: Reordering ───────────────────────────────────────────

    def _reorder_sov(
        self, glossed: list[tuple[str, Token]]
    ) -> list[tuple[str, Token]]:
        """
        Reorder Subject-Verb-Object → Subject-Object-Verb.

        Finds the main verb (ROOT) and its direct/prepositional objects.
        If the verb appears before any of its objects, moves it to just
        after the last object. Only the verb moves — modifiers stay in
        place relative to their head noun.
        """
        # Find the main verb (ROOT of the sentence)
        verb_pair = None
        verb_idx = -1
        for i, (g, t) in enumerate(glossed):
            if t.dep_ == "ROOT" and t.pos_ in ("VERB", "AUX"):
                verb_pair = (g, t)
                verb_idx = i
                break

        if verb_pair is None:
            return glossed

        # Find all objects of this verb
        object_indices = []
        for i, (g, t) in enumerate(glossed):
            if t.dep_ in ("dobj", "obj", "attr", "oprd") and t.head == verb_pair[1]:
                object_indices.append(i)
            # pobj under non-spatial preposition that's a child of our verb
            elif (t.dep_ == "pobj"
                  and t.head.pos_ == "ADP"
                  and t.head.head == verb_pair[1]
                  and t.head.text.lower() not in SPATIAL_PREPS):
                object_indices.append(i)

        if not object_indices:
            return glossed

        last_obj_idx = max(object_indices)

        # Only move if verb is currently before the last object (SVO → SOV)
        if verb_idx < last_obj_idx:
            result = list(glossed)
            entry = result.pop(verb_idx)
            # After popping, last_obj_idx shifts left by 1
            result.insert(last_obj_idx, entry)
            return result

        return glossed

    def _modifiers_after_noun(
        self,
        glossed: list[tuple[str, Token]],
        modifier_dep: str,
        modifier_pos: str,
    ) -> list[tuple[str, Token]]:
        """
        Move modifiers (adjectives or numbers) to after their head noun,
        preserving their relative order as a group.

        FIX #3: Moves all modifiers of the same noun together, so
        "big red car" → "CAR BIG RED" (not "CAR RED BIG").

        FIX #4: Also handles numbers — "three dogs" → "DOG THREE".

        Args:
            modifier_dep: spaCy dependency label (e.g. "amod" for adj, "nummod" for num)
            modifier_pos: spaCy POS tag (e.g. "ADJ", "NUM")
        """
        result = list(glossed)

        # Group modifiers by their head noun, preserving original order
        # key = id(head_token), value = list of (index, gloss, token)
        noun_modifiers: dict[int, list[tuple[int, str, Token]]] = {}
        for i, (g, t) in enumerate(result):
            if t.pos_ == modifier_pos and t.dep_ == modifier_dep:
                head_id = id(t.head)
                if head_id not in noun_modifiers:
                    noun_modifiers[head_id] = []
                noun_modifiers[head_id].append((i, g, t))

        if not noun_modifiers:
            return result

        # For each noun, move its modifier group to after the noun
        # Process nouns right-to-left so index shifts don't cascade
        for head_id, mods in noun_modifiers.items():
            # Find head noun position in current result
            noun_pos = None
            for j, (gj, tj) in enumerate(result):
                if id(tj) == head_id:
                    noun_pos = j
                    break

            if noun_pos is None:
                continue

            # Collect modifier indices that are BEFORE the noun
            before_noun = [(i, g, t) for i, g, t in mods if i < noun_pos]
            if not before_noun:
                continue

            # Remove modifiers from their current positions (reverse order to keep indices valid)
            entries = []
            for idx, g, t in sorted(before_noun, key=lambda x: x[0], reverse=True):
                # Find current position (might have shifted)
                for cur_i, (cur_g, cur_t) in enumerate(result):
                    if cur_t is t:
                        entries.insert(0, result.pop(cur_i))
                        break

            # Find noun's new position after removals
            for j, (gj, tj) in enumerate(result):
                if id(tj) == head_id:
                    noun_pos = j
                    break

            # Insert modifiers after noun, in their original relative order
            for offset, entry in enumerate(entries):
                result.insert(noun_pos + 1 + offset, entry)

        return result

    # ── Move helpers ─────────────────────────────────────────────────

    @staticmethod
    def _is_time_word(g: str, t: Token) -> bool:
        """Check if token is a time word."""
        return t.lemma_.lower() in TIME_WORDS or t.text.lower() in TIME_WORDS

    @staticmethod
    def _is_location(g: str, t: Token) -> bool:
        """Check if token is a spatial location (noun under at/in/on)."""
        return (
            t.dep_ == "pobj"
            and t.head.pos_ == "ADP"
            and t.head.text.lower() in SPATIAL_PREPS
            and t.pos_ in ("NOUN", "PROPN")
        )

    @staticmethod
    def _is_wh_word(g: str, t: Token) -> bool:
        """Check if token is a WH-question word."""
        return t.text.lower() in WH_WORDS

    @staticmethod
    def _move_to_front(
        glossed: list[tuple[str, Token]], condition
    ) -> list[tuple[str, Token]]:
        """Move tokens matching condition to the front of the list."""
        front = [(g, t) for g, t in glossed if condition(g, t)]
        rest = [(g, t) for g, t in glossed if not condition(g, t)]
        return front + rest

    @staticmethod
    def _move_to_end(
        glossed: list[tuple[str, Token]], condition
    ) -> list[tuple[str, Token]]:
        """Move tokens matching condition to the end of the list."""
        end = [(g, t) for g, t in glossed if condition(g, t)]
        rest = [(g, t) for g, t in glossed if not condition(g, t)]
        return rest + end

    @staticmethod
    def _insert_after_group(
        glossed: list[tuple[str, Token]],
        to_move,
        after,
    ) -> list[tuple[str, Token]]:
        """
        Move tokens matching `to_move` to just after the last token
        matching `after`. If no `after` tokens exist, moves to front.

        FIX #2: This ensures LOCATION goes after TIME, not before it.
        "Yesterday at the hospital she visited" →
          TIME first: [YESTERDAY, HOSPITAL, IX-3, FRIEND, VISIT]
          LOC after TIME: [YESTERDAY, HOSPITAL, IX-3, FRIEND, VISIT]
        """
        moving = [(g, t) for g, t in glossed if to_move(g, t)]
        rest = [(g, t) for g, t in glossed if not to_move(g, t)]

        if not moving:
            return glossed

        # Find where the last `after` token is in `rest`
        insert_pos = 0
        for i, (g, t) in enumerate(rest):
            if after(g, t):
                insert_pos = i + 1

        # Insert the moving tokens at that position
        return rest[:insert_pos] + moving + rest[insert_pos:]

    # ── Confidence check ─────────────────────────────────────────────

    def _check_confidence(
        self, text: str, doc, gloss_tokens: list[str], coverage: float
    ) -> tuple[bool, str]:
        """
        Determine if this sentence needs mandatory LLM fallback.

        Returns (needs_llm, reason).
        """
        if coverage < VOCAB_COVERAGE_THRESHOLD:
            return True, f"low_coverage ({coverage:.0%})"

        # Complex grammar (conditionals, multi-clause)
        text_lower = text.lower()
        if any(m in text_lower for m in ("if ", "unless ", "although ", "because ", "while ")):
            return True, "complex_grammar"

        # Complex questions (simple WH-questions handled by rules)
        if text.strip().endswith("?") and len(doc) > 6:
            return True, "complex_question"

        return False, ""

    # ── LLM helpers ──────────────────────────────────────────────────

    async def _call_llm(self, text: str, rule_result: GlossResult) -> Optional[str]:
        """Call LLM with relevant vocabulary subset. No timeout."""
        input_words = text.lower().split()
        relevant_vocab = self.vocab.filter_relevant(input_words)
        return await llm_translate(
            sentence=text,
            relevant_vocab=relevant_vocab,
            rule_based_attempt=rule_result.gloss_internal,
        )

    async def _call_llm_with_timeout(
        self, text: str, rule_result: GlossResult, timeout: float
    ) -> Optional[str]:
        """
        Call LLM with a timeout. Returns None if the call doesn't
        complete in time (e.g. slow network). The rule-based result
        is used as fallback.

        This is the background quality check — fire and forget if slow,
        use the result if fast.
        """
        try:
            return await asyncio.wait_for(
                self._call_llm(text, rule_result),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            logger.info(
                f"LLM quality check timed out ({timeout}s) for: '{text[:50]}...'"
            )
            return None
        except Exception as e:
            logger.warning(f"LLM quality check failed: {e}")
            return None

    def _apply_llm_result(self, result: GlossResult, llm_gloss: str, method: str) -> None:
        """Apply LLM gloss to an existing result, updating all fields.

        The LLM uses hyphenated notation for fingerspelling (N-A-N-A).
        We expand those into individual letter tokens so each maps to
        its own sign in the avatar.
        """
        result.gloss_internal = llm_gloss
        result.gloss = TextToGloss._to_display_form(llm_gloss)
        result.tokens = resolve_tokens(llm_gloss.split(), self.vocab)
        result.method = method

    # ── Other helpers ────────────────────────────────────────────────

    def _check_idioms(self, text: str) -> Optional[str]:
        """Check if text contains a known idiom. Returns gloss or None."""
        text_lower = text.lower()
        for idiom, gloss in IDIOM_MAP.items():
            if idiom in text_lower:
                return gloss
        return None

    @staticmethod
    def _fingerspell(word: str) -> str:
        """Convert a word to fingerspelled form: hello → H-E-L-L-O"""
        return "-".join(word.upper())

    @staticmethod
    def _to_display_form(gloss: str) -> str:
        """Convert internal IX markers to readable pronouns for display."""
        return " ".join(IX_DISPLAY.get(t, t) for t in gloss.split())

    def clear_cache(self) -> None:
        """Clear the translation cache."""
        self._cache.clear()
