"""
DuoSign FastAPI Backend
========================
REST API for English → ASL Gloss translation and pose serving.

Two translation modes:
  POST /api/translate         — Full pipeline: rule-based + background LLM quality check
  POST /api/translate/fast    — Rule-based only (no LLM, <50ms, works offline)
  POST /api/translate/stream  — SSE stream: sends rule-based immediately, then LLM update
  POST /api/translate/audio   — Speech → Text → ASL Gloss (Whisper + Groq)

Run:
  uvicorn api.main:app --reload --port 8000

Author: Nana Kwaku Amoako
Date: February 2026
"""

import asyncio
import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field

from .vocabulary import get_vocabulary, VocabularyManager
from .text_to_gloss import TextToGloss, GlossResult
from .voice import transcribe_audio
from .export import router as export_router
from .fingerspell import resolve_tokens

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ── Configuration ────────────────────────────────────────────────────

# ┌──────────────────────────────────────────────────────────────────┐
# │  INJECT YOUR GLOSS LIST HERE:                                    │
# │  Point TSV_PATH to your tab-separated gloss file.                │
# │  Format: id<TAB>gloss  (one per line, no header)                 │
# │                                                                  │
# │  Point LEXICON_DIR to your pose JSON directory (optional).       │
# └──────────────────────────────────────────────────────────────────┘
TSV_PATH = Path(__file__).parent.parent / "data" / "glosses.tsv"
LEXICON_DIR = Path(__file__).parent.parent / "public" / "lexicon" / "ase"
BUCKET_DIR = Path(__file__).parent.parent.parent / "bucket"


# ── App lifecycle ────────────────────────────────────────────────────

vocab: VocabularyManager | None = None
converter: TextToGloss | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize vocabulary and converter on startup."""
    global vocab, converter

    tsv = TSV_PATH if TSV_PATH.exists() else None
    lex = LEXICON_DIR if LEXICON_DIR.exists() else None
    poses = BUCKET_DIR / "poses" if (BUCKET_DIR / "poses").exists() else None

    if not tsv and not lex and not poses:
        logger.warning(
            f"No vocabulary sources found.\n"
            f"  TSV expected at: {TSV_PATH}\n"
            f"  Lexicon expected at: {LEXICON_DIR}\n"
            f"  Pose bucket expected at: {BUCKET_DIR / 'poses'}\n"
            f"  The API will work but all words will be fingerspelled."
        )

    vocab = get_vocabulary(tsv_path=tsv, lexicon_dir=lex, poses_dir=poses)
    converter = TextToGloss(vocab)

    logger.info(f"DuoSign API ready — {vocab.stats()['total']} glosses loaded")
    yield
    logger.info("DuoSign API shutting down")


app = FastAPI(
    title="DuoSign API",
    description="English → ASL Gloss translation with rule-based processing and LLM fallback",
    version="3.0.0",
    lifespan=lifespan,
)

app.include_router(export_router)

_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# allow_credentials=True is incompatible with the "*" wildcard — browsers
# reject credentialed requests to wildcard CORS. Keep explicit origins for
# dev; production origins should be set via ALLOWED_ORIGINS env var.
import os as _os
_extra = [o.strip() for o in _os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_DEV_ORIGINS + _extra,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request/Response models ──────────────────────────────────────────

class TranslateRequest(BaseModel):
    """Request body for /api/translate."""
    text: str = Field(..., min_length=1, max_length=500, description="English text to translate")

class TranslateResponse(BaseModel):
    """Response from /api/translate."""
    input_text: str
    gloss: str                  # Display form (I, YOU, HE/SHE)
    gloss_internal: str         # Internal form with IX markers
    tokens: list[str]           # Individual gloss tokens
    method: str                 # "rule_based", "llm", or "llm_quality"
    confidence: float
    transcribed_text: str = ""  # Only set for audio endpoint — what Whisper heard

class VocabularyResponse(BaseModel):
    """Response from /api/vocabulary."""
    total: int
    has_full_alphabet: bool
    glosses: list[str]


def _result_to_response(result: GlossResult) -> TranslateResponse:
    """Convert internal GlossResult to API response."""
    return TranslateResponse(
        input_text=result.input_text,
        gloss=result.gloss,
        gloss_internal=result.gloss_internal,
        tokens=result.tokens,
        method=result.method,
        confidence=result.confidence,
    )


def _result_to_dict(result: GlossResult) -> dict:
    """Convert GlossResult to dict for SSE JSON serialization."""
    return {
        "input_text": result.input_text,
        "gloss": result.gloss,
        "gloss_internal": result.gloss_internal,
        "tokens": result.tokens,
        "method": result.method,
        "confidence": result.confidence,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@app.post("/api/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    """
    Translate English text to ASL Gloss — full pipeline.

    Returns rule-based result instantly if LLM is unavailable or slow.
    If LLM responds within 3 seconds, returns the improved result instead.
    Best for: general use, good network conditions.
    """
    if not converter:
        raise HTTPException(503, "Converter not initialized")

    result = await converter.convert(req.text, llm_quality_check=True)
    return _result_to_response(result)


@app.post("/api/translate/fast", response_model=TranslateResponse)
async def translate_fast(req: TranslateRequest):
    """
    Translate English text to ASL Gloss — rule-based only, strictly no LLM.

    Always returns in <50ms. Works completely offline.
    Best for: slow/no network, real-time typing preview, batch processing.
    """
    if not converter:
        raise HTTPException(503, "Converter not initialized")

    # Use convert_sync — skips ALL LLM paths, including mandatory fallback.
    # convert(..., llm_quality_check=False) still calls LLM when needs_llm=True.
    result = converter.convert_sync(req.text)
    return _result_to_response(result)


@app.post("/api/translate/stream")
async def translate_stream(req: TranslateRequest):
    """
    Translate with Server-Sent Events — two-phase progressive response.

    Phase 1 (instant): Sends rule-based result immediately.
    Phase 2 (1-3s):    Sends LLM-improved result if available.

    Best for: the "matrix text decode" animation on frontend.
    Frontend shows phase 1 instantly, then morphs to phase 2 when it arrives.

    SSE format:
      event: rule_based
      data: {"gloss": "I DOCTOR SEARCH", ...}

      event: llm_quality
      data: {"gloss": "I DOCTOR SEARCH", ...}

      event: done
      data: {}
    """
    if not converter:
        raise HTTPException(503, "Converter not initialized")

    async def event_stream():
        text = req.text.strip()

        # Phase 1: Rule-based (instant)
        rule_result = converter.convert_sync(text)
        yield f"event: rule_based\ndata: {json.dumps(_result_to_dict(rule_result))}\n\n"

        # Phase 2: LLM quality check (background, with timeout)
        if len(rule_result.tokens) >= 2 and not rule_result.needs_llm:
            try:
                llm_gloss = await converter._call_llm_with_timeout(
                    text, rule_result, timeout=3.0
                )
                if llm_gloss and llm_gloss != rule_result.gloss_internal:
                    # LLM gave a different (hopefully better) result
                    llm_result = GlossResult(
                        input_text=text,
                        gloss=converter._to_display_form(llm_gloss),
                        gloss_internal=llm_gloss,
                        tokens=resolve_tokens(llm_gloss.split(), vocab),
                        method="llm_quality",
                        confidence=rule_result.confidence,
                    )
                    yield f"event: llm_quality\ndata: {json.dumps(_result_to_dict(llm_result))}\n\n"
            except Exception as e:
                logger.warning(f"SSE LLM quality check failed: {e}")

        # If mandatory LLM fallback needed
        elif rule_result.needs_llm:
            try:
                llm_gloss = await converter._call_llm_with_timeout(
                    text, rule_result, timeout=5.0
                )
                if llm_gloss:
                    llm_result = GlossResult(
                        input_text=text,
                        gloss=converter._to_display_form(llm_gloss),
                        gloss_internal=llm_gloss,
                        tokens=resolve_tokens(llm_gloss.split(), vocab),
                        method="llm",
                        confidence=rule_result.confidence,
                    )
                    yield f"event: llm_quality\ndata: {json.dumps(_result_to_dict(llm_result))}\n\n"
            except Exception as e:
                logger.warning(f"SSE LLM fallback failed: {e}")

        yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@app.post("/api/translate/audio", response_model=TranslateResponse)
async def translate_audio(
    audio: UploadFile = File(...),
    language: str | None = None,
):
    """
    Speech → Text → ASL Gloss pipeline.

    Accepts audio file (wav, mp3, webm, etc.), transcribes with Groq Whisper,
    then translates the text to ASL Gloss.

    Browser MediaRecorder typically sends webm. Groq supports:
    mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25MB).

    Optional query param:
      language — BCP-47 code passed to Whisper (e.g. "en", "tw", "ee").
                 Omit to let Whisper auto-detect.
    """
    if not converter:
        raise HTTPException(503, "Converter not initialized")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio file")

    filename = audio.filename or "audio.webm"

    text = await transcribe_audio(audio_bytes, filename=filename, language=language)
    if not text:
        raise HTTPException(502, "Speech transcription failed — check GROQ_API_KEY")

    result = await converter.convert(text)
    response = _result_to_response(result)
    response.transcribed_text = text
    return response


@app.get("/api/vocabulary", response_model=VocabularyResponse)
async def get_vocab():
    """List all available ASL glosses."""
    if not vocab:
        raise HTTPException(503, "Vocabulary not loaded")

    stats = vocab.stats()
    return VocabularyResponse(
        total=stats["total"],
        has_full_alphabet=stats["has_full_alphabet"],
        glosses=vocab.all_glosses(),
    )


@app.get("/api/vocabulary/search")
async def search_vocab(q: str = "", limit: int = 50):
    """Search glosses by prefix."""
    if not vocab:
        raise HTTPException(503, "Vocabulary not loaded")
    return {"query": q, "results": vocab.search(q, limit=limit)}


# ── Media Serving (Video + Pose files) ───────────────────────────────

@app.get("/api/video/{gloss}")
async def serve_video(gloss: str):
    """Serve a sign language video (.mp4) from the bucket."""
    path = BUCKET_DIR / "videos" / f"{gloss}.mp4"
    if not path.exists():
        raise HTTPException(404, f"Video not found: {gloss}")
    return FileResponse(
        path,
        media_type="video/mp4",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/api/pose/{gloss}")
async def serve_pose(gloss: str):
    """Serve a pose data file (.pose) from the bucket."""
    path = BUCKET_DIR / "poses" / f"{gloss}.pose"
    if not path.exists():
        raise HTTPException(404, f"Pose not found: {gloss}")
    return FileResponse(
        path,
        media_type="application/octet-stream",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/api/health")
async def health():
    """Health check."""
    return {
        "status": "ok",
        "version": "3.0.0",
        "vocabulary_loaded": vocab is not None,
        "gloss_count": vocab.stats()["total"] if vocab else 0,
    }
