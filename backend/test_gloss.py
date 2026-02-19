"""
DuoSign Text-to-Gloss — Interactive Test CLI
=============================================
Type English sentences and see ASL Gloss output in real-time.
Tests both the rule-based pipeline AND the LLM quality check.

Run:
  python test_gloss.py              # Interactive mode (rule-based only)
  python test_gloss.py --scenarios  # Run all algorithm walkthrough scenarios
  python test_gloss.py --quick      # Quick smoke test
  python test_gloss.py --llm        # Run scenarios WITH LLM quality check
  python test_gloss.py --compare    # Side-by-side: rule-based vs LLM

Requires:
  pip install spacy groq python-dotenv
  python -m spacy download en_core_web_sm
  GROQ_API_KEY in .env file (for --llm and --compare modes)

Author: Nana Kwaku Amoako
Date: February 2026
"""

import sys
import asyncio
import time
import logging
from pathlib import Path

# Load env vars (for GROQ_API_KEY)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required for rule-based testing

# Add parent to path so we can import the api package
sys.path.insert(0, str(Path(__file__).parent))

from api.vocabulary import VocabularyManager
from api.text_to_gloss import TextToGloss

logging.basicConfig(
    level=logging.WARNING,
    format="  💬 %(message)s"
)
# Show LLM logs when running LLM modes
if "--llm" in sys.argv or "--compare" in sys.argv:
    logging.getLogger("api.llm").setLevel(logging.INFO)
    logging.getLogger("api.text_to_gloss").setLevel(logging.INFO)


def create_converter() -> TextToGloss:
    """Set up converter with vocabulary."""
    base_dir = Path(__file__).parent.parent  # duosign/

    # Try multiple TSV locations
    tsv_candidates = [
        Path(__file__).parent / "data" / "glosses.tsv",       # backend/data/
        base_dir / "backend" / "data" / "glosses.tsv",        # duosign/backend/data/
        base_dir / "data" / "glosses.tsv",                     # duosign/data/
        Path("data/glosses.tsv"),                               # relative
    ]

    tsv_path = None
    for candidate in tsv_candidates:
        if candidate.exists():
            tsv_path = candidate
            break

    if not tsv_path:
        print(f"⚠️  No glosses.tsv found. Tried: {[str(c) for c in tsv_candidates]}")

    vocab = VocabularyManager(
        tsv_path=tsv_path,
        lexicon_dir=None,
    )

    print(f"📚 Vocabulary loaded: {vocab.stats()['total']} glosses")
    return TextToGloss(vocab)


def print_result(result, elapsed_ms: float, label: str = ""):
    """Pretty-print a gloss result."""
    prefix = f" ({label})" if label else ""
    print(f"  ┌─ Input:    \"{result.input_text}\"{prefix}")
    print(f"  ├─ Gloss:    {result.gloss}")
    print(f"  ├─ Internal: {result.gloss_internal}")
    print(f"  ├─ Tokens:   {result.tokens}")
    print(f"  ├─ Method:   {result.method} ({result.confidence:.0%} confidence)")
    if result.needs_llm:
        print(f"  ├─ LLM:      would trigger ({result.llm_reason})")
    print(f"  └─ Time:     {elapsed_ms:.1f}ms")
    print()


# ── Algorithm Walkthrough Scenarios (from your PDF) ──────────────────

SCENARIOS = [
    ("A: Simple declarative",     "I am searching for a doctor"),
    ("B: Time word",              "Tomorrow I will go to school"),
    ("C: Negation",               "She doesn't like pizza"),
    ("D: Plurals",                "The cats are sleeping on the bed"),
    ("E: WH-question",           "Where is the bathroom?"),
    ("F: Yes/No question",        "Do you like chocolate?"),
    ("G: Location",               "At school I study math"),
    ("H: Time + Location",        "Yesterday at the hospital she visited her friend"),
    ("I: Idiom",                  "It's raining cats and dogs"),
    ("K: Adjectives",             "The big red car is fast"),
    ("L: Numbers",                "I have three dogs"),
    ("M: Command",                "Please sit down"),
]

EXPECTED = {
    "I am searching for a doctor":                          "I DOCTOR SEARCH",
    "Tomorrow I will go to school":                         "TOMORROW I SCHOOL GO",
    "She doesn't like pizza":                               "HE/SHE PIZZA LIKE NOT",
    "The cats are sleeping on the bed":                     "CAT+ BED SLEEP",
    "Where is the bathroom?":                               "BATHROOM WHERE",
    "Do you like chocolate?":                               "YOU CHOCOLATE LIKE",
    "At school I study math":                               "SCHOOL I MATH STUDY",
    "Yesterday at the hospital she visited her friend":     "YESTERDAY HOSPITAL HE/SHE FRIEND VISIT",
    "It's raining cats and dogs":                           "RAIN HEAVY",
    "The big red car is fast":                              "CAR BIG RED FAST",
    "I have three dogs":                                    "I DOG THREE HAVE",
    "Please sit down":                                      "SIT",
}


def check_result(result, expected: str) -> tuple[str, str]:
    """Compare result with expected. Returns (status, message)."""
    if result.gloss == expected:
        return "pass", f"  ✅ PASS — matches expected: {expected}"
    elif result.needs_llm:
        return "warn", (
            f"  ⚠️  NEEDS LLM — rule-based got: {result.gloss}\n"
            f"                   expected:       {expected}"
        )
    else:
        return "fail", (
            f"  ❌ MISMATCH\n"
            f"       got:      {result.gloss}\n"
            f"       expected: {expected}"
        )


def run_scenarios(converter: TextToGloss):
    """Run all scenarios — rule-based only."""
    print("\n" + "=" * 60)
    print("  ALGORITHM WALKTHROUGH SCENARIOS (Rule-Based)")
    print("=" * 60 + "\n")

    passed = failed = warnings = 0

    for label, sentence in SCENARIOS:
        print(f"── Scenario {label} {'─' * (45 - len(label))}")

        start = time.perf_counter()
        result = converter.convert_sync(sentence)
        elapsed = (time.perf_counter() - start) * 1000

        print_result(result, elapsed)

        expected = EXPECTED.get(sentence)
        if expected:
            status, message = check_result(result, expected)
            print(message)
            if status == "pass": passed += 1
            elif status == "warn": warnings += 1
            else: failed += 1
        print()

    total = passed + failed + warnings
    print("=" * 60)
    print(f"  RESULTS: {passed}/{total} passed, {warnings} need LLM, {failed} failed")
    print("=" * 60 + "\n")


async def run_scenarios_with_llm(converter: TextToGloss):
    """Run all scenarios WITH LLM quality check enabled."""
    import os
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("\n❌ GROQ_API_KEY not found in environment.")
        print("   Create a .env file with: GROQ_API_KEY=your_key_here")
        print("   Or: export GROQ_API_KEY=your_key_here\n")
        return

    print("\n" + "=" * 60)
    print("  SCENARIOS WITH LLM QUALITY CHECK")
    print(f"  Timeout: 3s per sentence | API Key: ...{api_key[-6:]}")
    print("=" * 60 + "\n")

    passed = failed = warnings = 0

    for label, sentence in SCENARIOS:
        print(f"── Scenario {label} {'─' * (45 - len(label))}")

        # Clear cache for fresh results
        converter.clear_cache()

        start = time.perf_counter()
        result = await converter.convert(sentence, llm_quality_check=True)
        elapsed = (time.perf_counter() - start) * 1000

        # Method icons
        method_icon = {"rule_based": "⚡", "llm": "🤖", "llm_quality": "✨"}.get(result.method, "?")

        print(f"  {method_icon} Method: {result.method}")
        print_result(result, elapsed)

        expected = EXPECTED.get(sentence)
        if expected:
            status, message = check_result(result, expected)
            print(message)
            if status == "pass": passed += 1
            elif status == "warn": warnings += 1
            else: failed += 1
        print()

    total = passed + failed + warnings
    print("=" * 60)
    print(f"  RESULTS: {passed}/{total} passed, {warnings} need LLM, {failed} failed")
    print("  ⚡ = rule_based only | ✨ = LLM improved | 🤖 = LLM mandatory fallback")
    print("=" * 60 + "\n")


async def run_compare(converter: TextToGloss):
    """Side-by-side comparison: rule-based vs LLM for every scenario."""
    import os
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("\n❌ GROQ_API_KEY not found. Set it in .env or environment.\n")
        return

    print("\n" + "=" * 70)
    print("  SIDE-BY-SIDE: Rule-Based vs LLM Quality Check")
    print(f"  Timeout: 3s | API Key: ...{api_key[-6:]}")
    print("=" * 70 + "\n")

    # Table header
    print(f"  {'#':<4} {'Input':<35} {'Expected':<28} {'Rule-Based':<28} {'+ LLM':<28} {'Status'}")
    print(f"  {'─'*4} {'─'*35} {'─'*28} {'─'*28} {'─'*28} {'─'*10}")

    total_rule_pass = 0
    total_llm_pass = 0

    for i, (label, sentence) in enumerate(SCENARIOS, 1):
        expected = EXPECTED.get(sentence, "?")
        short_label = label.split(":")[1].strip()[:12]
        short_input = sentence[:33] + (".." if len(sentence) > 33 else "")

        # Rule-based (sync, instant)
        converter.clear_cache()
        rule_start = time.perf_counter()
        rule_result = converter.convert_sync(sentence)
        rule_ms = (time.perf_counter() - rule_start) * 1000
        rule_gloss = rule_result.gloss
        rule_ok = rule_gloss == expected

        # LLM quality check (async)
        converter.clear_cache()
        llm_start = time.perf_counter()
        llm_result = await converter.convert(sentence, llm_quality_check=True)
        llm_ms = (time.perf_counter() - llm_start) * 1000
        llm_gloss = llm_result.gloss
        llm_ok = llm_gloss == expected
        llm_method = llm_result.method

        if rule_ok: total_rule_pass += 1
        if llm_ok: total_llm_pass += 1

        # Status column
        if rule_ok and llm_ok:
            status = "✅ both"
        elif not rule_ok and llm_ok:
            status = "✨ LLM fixed"
        elif rule_ok and not llm_ok:
            status = "⚠️ LLM broke"
        else:
            status = "❌ both wrong"

        # Method tag
        method_tag = {"llm_quality": "✨", "llm": "🤖", "rule_based": "⚡"}.get(llm_method, "?")

        rule_icon = "✅" if rule_ok else "❌"
        llm_icon = "✅" if llm_ok else "❌"

        print(
            f"  {label[0:2]:<4} {short_input:<35} "
            f"{expected:<28} "
            f"{rule_icon} {rule_gloss:<25} "
            f"{llm_icon} {llm_gloss:<25} "
            f"{status}"
        )

    print()
    total = len(SCENARIOS)
    print(f"  Rule-based: {total_rule_pass}/{total} correct")
    print(f"  With LLM:   {total_llm_pass}/{total} correct")
    if total_llm_pass > total_rule_pass:
        print(f"  📈 LLM improved {total_llm_pass - total_rule_pass} sentence(s)")
    elif total_llm_pass == total_rule_pass:
        print(f"  ── No change from LLM")
    else:
        print(f"  📉 LLM made {total_rule_pass - total_llm_pass} sentence(s) worse")
    print()


def run_quick(converter: TextToGloss):
    """Quick smoke test with a few sentences."""
    print("\n── Quick Smoke Test ──\n")
    sentences = [
        "Hello",
        "I want coffee",
        "Where is the library?",
        "She went to school yesterday",
        "The children are playing",
        "My name is John",
        "Can you help me?",
        "I don't understand",
        "The weather is nice today",
        "He has two cats and a dog",
    ]
    for s in sentences:
        start = time.perf_counter()
        result = converter.convert_sync(s)
        elapsed = (time.perf_counter() - start) * 1000
        print(f"  \"{s}\"")
        print(f"  → {result.gloss}  ({elapsed:.1f}ms, {result.method}, {result.confidence:.0%})\n")


def run_interactive(converter: TextToGloss):
    """Interactive REPL — type sentences, see gloss output."""
    print("\n" + "=" * 60)
    print("  DUOSIGN — Interactive Gloss Tester")
    print("  Type English sentences to translate.")
    print()
    print("  Commands:")
    print("    q / quit     — Exit")
    print("    clear        — Reset translation cache")
    print("    vocab        — Show loaded glosses")
    print("    debug <text> — Show spaCy parse details")
    print("=" * 60 + "\n")

    while True:
        try:
            text = input("📝 > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye! 👋")
            break

        if not text:
            continue
        if text.lower() in ("q", "quit", "exit"):
            print("Bye! 👋")
            break
        if text.lower() == "clear":
            converter.clear_cache()
            print("  Cache cleared.\n")
            continue
        if text.lower() == "vocab":
            glosses = converter.vocab.all_glosses()[:30]
            print(f"  {len(converter.vocab.glosses)} total. First 30: {glosses}\n")
            continue
        if text.lower().startswith("debug "):
            # Show spaCy parse tree for debugging
            debug_text = text[6:]
            doc = converter.nlp(debug_text)
            print(f"\n  spaCy parse: \"{debug_text}\"")
            print(f"  {'Token':<12} {'Lemma':<12} {'POS':<8} {'Dep':<12} {'Head':<12} {'Children'}")
            print(f"  {'─'*12} {'─'*12} {'─'*8} {'─'*12} {'─'*12} {'─'*20}")
            for token in doc:
                children = ", ".join(c.text for c in token.children)
                print(
                    f"  {token.text:<12} {token.lemma_:<12} {token.pos_:<8} "
                    f"{token.dep_:<12} {token.head.text:<12} {children}"
                )
            print()
            continue

        start = time.perf_counter()
        result = converter.convert_sync(text)
        elapsed = (time.perf_counter() - start) * 1000

        print()
        print_result(result, elapsed)


# ── Entry point ──────────────────────────────────────────────────────

def main():
    converter = create_converter()

    if "--scenarios" in sys.argv:
        run_scenarios(converter)
    elif "--quick" in sys.argv:
        run_quick(converter)
    elif "--llm" in sys.argv:
        asyncio.run(run_scenarios_with_llm(converter))
    elif "--compare" in sys.argv:
        asyncio.run(run_compare(converter))
    else:
        # Default: run scenarios first, then drop into interactive mode
        run_scenarios(converter)
        run_interactive(converter)


if __name__ == "__main__":
    main()