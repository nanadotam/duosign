"""
Fingerspell — ASL Manual Alphabet Handler
==========================================
Converts unknown English words into individual letter-sign sequences.
Each letter A–Z maps to a distinct ASL handshape with a corresponding
pose file / video in the lexicon.

Used by text_to_gloss.py whenever a word is not found in the vocabulary.

Example:
    "Nana"  → ["N", "A", "N", "A"]
    "Ghana" → ["G", "H", "A", "N", "A"]

Author: Nana Kwaku Amoako
"""

# All 26 letters of the ASL manual alphabet
MANUAL_ALPHABET: frozenset[str] = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def fingerspell_word(word: str) -> list[str]:
    """
    Break a word into individual ASL letter tokens.

    Strips anything that isn't A–Z (digits, punctuation, spaces).
    Returns an empty list for words with no alphabetic characters.

    Examples:
        fingerspell_word("Nana")   → ["N", "A", "N", "A"]
        fingerspell_word("Ghana")  → ["G", "H", "A", "N", "A"]
        fingerspell_word("C3PO")   → ["C", "P", "O"]
    """
    return [ch.upper() for ch in word if ch.upper() in MANUAL_ALPHABET]


def to_hyphenated(word: str) -> str:
    """
    Convert a word to the ASL hyphenated notation used in LLM output.

    Examples:
        to_hyphenated("Nana")  → "N-A-N-A"
        to_hyphenated("Ghana") → "G-H-A-N-A"
    """
    letters = fingerspell_word(word)
    return "-".join(letters) if letters else word.upper()


def is_fingerspelled(token: str) -> bool:
    """
    Return True if a gloss token is already in hyphenated fingerspell form.

    A token is fingerspelled when it contains hyphens and every segment
    between hyphens is a single A–Z letter: "N-A-N-A", "G-O", etc.

    Examples:
        is_fingerspelled("N-A-N-A")  → True
        is_fingerspelled("HELLO")    → False
        is_fingerspelled("IX-1")     → False   ← pronoun marker, not fingerspelling
    """
    if "-" not in token:
        return False
    parts = token.split("-")
    return all(len(p) == 1 and p.upper() in MANUAL_ALPHABET for p in parts)


def expand_tokens(tokens: list[str]) -> list[str]:
    """
    Expand any hyphenated fingerspelled tokens into individual letter tokens.

    This ensures each letter maps to its own pose/video sign in the avatar.

    Examples:
        expand_tokens(["I", "NAME", "N-A-N-A"])
            → ["I", "NAME", "N", "A", "N", "A"]

        expand_tokens(["TOMORROW", "IX-1", "G-H-A-N-A", "GO"])
            → ["TOMORROW", "I", "G", "H", "A", "N", "A", "GO"]
            (Note: "IX-1" is NOT expanded — it's a pronoun marker, not fingerspelling)
    """
    expanded: list[str] = []
    for token in tokens:
        if is_fingerspelled(token):
            expanded.extend(token.split("-"))
        else:
            expanded.append(token)
    return expanded
