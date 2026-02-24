"""
Vocabulary Manager
==================
Loads available ASL glosses from a TSV file, JSON lexicon directory,
and/or .pose file directory (ground truth for available animations).
Provides lookup, search, and semantic filtering for LLM prompt construction.

TSV format (tab-separated, no header):
    0	book
    1	drink
    2	computer

Author: Nana Kwaku Amoako
Date: February 2026
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ── Alphabet for fingerspelling ──────────────────────────────────────
FINGERSPELL_ALPHABET = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

# ── Number words (0-20) that map to individual signs ─────────────────
NUMBER_WORDS: dict[str, str] = {
    "zero": "ZERO", "one": "ONE", "two": "TWO", "three": "THREE",
    "four": "FOUR", "five": "FIVE", "six": "SIX", "seven": "SEVEN",
    "eight": "EIGHT", "nine": "NINE", "ten": "TEN", "eleven": "ELEVEN",
    "twelve": "TWELVE", "thirteen": "THIRTEEN", "fourteen": "FOURTEEN",
    "fifteen": "FIFTEEN", "sixteen": "SIXTEEN", "seventeen": "SEVENTEEN",
    "eighteen": "EIGHTEEN", "nineteen": "NINETEEN", "twenty": "TWENTY",
    # Digit forms
    "0": "ZERO", "1": "ONE", "2": "TWO", "3": "THREE", "4": "FOUR",
    "5": "FIVE", "6": "SIX", "7": "SEVEN", "8": "EIGHT", "9": "NINE",
    "10": "TEN", "11": "ELEVEN", "12": "TWELVE", "13": "THIRTEEN",
    "14": "FOURTEEN", "15": "FIFTEEN", "16": "SIXTEEN", "17": "SEVENTEEN",
    "18": "EIGHTEEN", "19": "NINETEEN", "20": "TWENTY",
}


class VocabularyManager:
    """
    Manages available ASL gloss vocabulary.

    Loads from two sources (either or both):
    1. TSV file — simple id/gloss pairs (primary)
    2. Lexicon directory — scans *.json pose files (fallback/supplement)
    """

    def __init__(
        self,
        tsv_path: Optional[Path] = None,
        lexicon_dir: Optional[Path] = None,
        poses_dir: Optional[Path] = None,
    ):
        # All available glosses stored as uppercase strings
        self.glosses: set[str] = set()
        # Glosses that have actual .pose files (ground truth for animation)
        self._pose_glosses: set[str] = set()
        # Maps GLOSS → metadata (source file, id, etc.)
        self.gloss_info: dict[str, dict] = {}

        if tsv_path:
            self._load_tsv(tsv_path)
        if lexicon_dir:
            self._load_lexicon_dir(lexicon_dir)
        if poses_dir:
            self._load_poses_dir(poses_dir)

        # Always include alphabet letters and number signs
        self.glosses.update(FINGERSPELL_ALPHABET)
        self.glosses.update(NUMBER_WORDS.values())

        logger.info(f"Vocabulary loaded: {len(self.glosses)} glosses")

    # ── Loaders ──────────────────────────────────────────────────────

    def _load_tsv(self, path: Path) -> None:
        """Load glosses from a TSV file (id<TAB>gloss per line)."""
        if not path.exists():
            logger.warning(f"TSV file not found: {path}")
            return

        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split("\t")
                # Support both "id\tgloss" and plain "gloss" formats
                gloss = parts[1] if len(parts) >= 2 else parts[0]
                gloss_upper = gloss.strip().upper()
                self.glosses.add(gloss_upper)
                self.gloss_info[gloss_upper] = {
                    "id": parts[0] if len(parts) >= 2 else None,
                    "source": "tsv",
                }

        logger.info(f"Loaded {len(self.glosses)} glosses from TSV: {path}")

    def _load_lexicon_dir(self, directory: Path) -> None:
        """Load glosses by scanning *.json files in lexicon directory."""
        if not directory.exists():
            logger.warning(f"Lexicon directory not found: {directory}")
            return

        count = 0
        for json_file in directory.glob("*.json"):
            if json_file.name.startswith("_"):
                continue
            gloss_upper = json_file.stem.upper()
            self.glosses.add(gloss_upper)
            self.gloss_info[gloss_upper] = {
                "json_file": json_file.name,
                "path": str(json_file),
                "source": "lexicon",
            }
            count += 1

        logger.info(f"Loaded {count} glosses from lexicon: {directory}")

    def _load_poses_dir(self, directory: Path) -> None:
        """Load glosses by scanning *.pose files in pose directory (ground truth)."""
        if not directory.exists():
            logger.warning(f"Poses directory not found: {directory}")
            return

        count = 0
        for pose_file in directory.glob("*.pose"):
            gloss_upper = pose_file.stem.upper()
            self._pose_glosses.add(gloss_upper)
            self.glosses.add(gloss_upper)
            # Update info with pose path
            if gloss_upper in self.gloss_info:
                self.gloss_info[gloss_upper]["pose_file"] = str(pose_file)
            else:
                self.gloss_info[gloss_upper] = {
                    "pose_file": str(pose_file),
                    "source": "pose",
                }
            count += 1

        logger.info(f"Loaded {count} pose-backed glosses from: {directory}")

    # ── Lookups ──────────────────────────────────────────────────────

    def has(self, gloss: str) -> bool:
        """
        Check if a gloss is in the vocabulary.

        Handles suffixed forms: CAT+ checks for CAT (strips + marker).
        Also handles fingerspelled tokens like H-E-L-L-O (always "available").
        """
        g = gloss.upper()

        # Direct match
        if g in self.glosses:
            return True

        # Strip plural + marker and check base form
        if g.endswith("+") and g[:-1] in self.glosses:
            return True

        # Fingerspelled tokens (contain hyphens, all single letters)
        if "-" in g and all(len(part) == 1 for part in g.split("-")):
            return True

        return False

    def has_pose(self, gloss: str) -> bool:
        """
        Check if a gloss has an actual .pose file available.
        This is the ground truth for whether the avatar can sign it.
        """
        g = gloss.upper()
        if g in self._pose_glosses:
            return True
        if g.endswith("+") and g[:-1] in self._pose_glosses:
            return True
        return False

    @property
    def pose_glosses(self) -> set[str]:
        """Return the set of glosses that have .pose files."""
        return self._pose_glosses.copy()

    def is_letter(self, gloss: str) -> bool:
        """Check if gloss is a single fingerspelling letter."""
        return len(gloss) == 1 and gloss.upper() in FINGERSPELL_ALPHABET

    def get_info(self, gloss: str) -> Optional[dict]:
        """Get metadata for a gloss."""
        return self.gloss_info.get(gloss.upper())

    def search(self, prefix: str, limit: int = 50) -> list[str]:
        """Search glosses by prefix."""
        p = prefix.upper()
        return sorted(g for g in self.glosses if g.startswith(p))[:limit]

    def all_glosses(self) -> list[str]:
        """Return all glosses sorted alphabetically."""
        return sorted(self.glosses)

    # ── Vocab coverage ───────────────────────────────────────────────

    def coverage(self, tokens: list[str]) -> float:
        """
        Calculate what fraction of tokens are in the vocabulary.

        Uses self.has() which handles + suffixes and fingerspelling.
        """
        if not tokens:
            return 1.0
        found = sum(1 for t in tokens if self.has(t))
        return found / len(tokens)

    def filter_relevant(self, words: list[str], top_n: int = 80) -> list[str]:
        """
        Return a subset of vocabulary words relevant to the input words.
        Simple approach: prefix/substring matching + common signs.
        For production, replace with embedding-based similarity.
        """
        words_upper = {w.upper() for w in words}
        relevant = set()

        for gloss in self.glosses:
            # Exact match
            if gloss in words_upper:
                relevant.add(gloss)
                continue
            # Substring match (e.g., "SEARCH" matches input "searching")
            for w in words_upper:
                if gloss.startswith(w[:3]) or w.startswith(gloss[:3]):
                    relevant.add(gloss)
                    break

        # Always include common structural signs
        common = {"NOT", "WANT", "NEED", "LIKE", "HAVE", "GO", "COME",
                  "KNOW", "SEE", "HELP", "GOOD", "BAD", "YES", "NO",
                  "PLEASE", "THANK-YOU", "SORRY", "FINISH", "MORE"}
        relevant.update(common & self.glosses)

        return sorted(relevant)[:top_n]

    def stats(self) -> dict:
        """Return vocabulary statistics."""
        return {
            "total": len(self.glosses),
            "pose_count": len(self._pose_glosses),
            "has_full_alphabet": FINGERSPELL_ALPHABET.issubset(self.glosses),
            "sample": sorted(self.glosses)[:20],
        }


# ── Global singleton ─────────────────────────────────────────────────

_instance: Optional[VocabularyManager] = None


def get_vocabulary(
    tsv_path: Optional[Path] = None,
    lexicon_dir: Optional[Path] = None,
    poses_dir: Optional[Path] = None,
) -> VocabularyManager:
    """Get or create the global VocabularyManager."""
    global _instance
    if _instance is None:
        _instance = VocabularyManager(
            tsv_path=tsv_path,
            lexicon_dir=lexicon_dir,
            poses_dir=poses_dir,
        )
    return _instance


def reset_vocabulary() -> None:
    """Reset the global instance (e.g., after file changes)."""
    global _instance
    _instance = None
