#!/usr/bin/env python3
"""
Convert the submitted DuoSign thesis PDF into a native HTML fragment for /research.

Why the PDF and not the LaTeX sources?
    The LaTeX tree in CAPSTONE/code/duosign/research-paper is a pre-submission draft
    (Chapter 5/6 still contain "XXXXX" placeholders and red TODO text, the abstract and
    appendices differ). The only copy of the *submitted* text is the PDF, so this script
    reads the PDF directly with PyMuPDF and rebuilds semantic HTML from its layout:
    headings, paragraphs, lists, footnotes, numbered citations, tables (from the drawn
    rules), figures and algorithms (rendered to WebP), and the reference list.

Outputs (checked in; this does not run at build time):
    src/features/research-reader/content/thesis.html          HTML fragment
    src/features/research-reader/content/thesis.meta.json     headings (TOC), abstract, word count
    public/research/thesis/*.webp                             figures + algorithms (<=1600 px wide)
    public/research/DuoSign_Thesis_2026.pdf                   published PDF (optionally compressed,
                                                             with any --exclude-pages removed)

Usage (from frontend/):
    python3 scripts/thesis-to-html.py [--pdf PATH] [--exclude-pages 120-125]

Requires: python3, pymupdf (fitz), pillow with WebP support.
"""

from __future__ import annotations

import argparse
import html
import io
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PDF = Path.home() / (
    "Library/CloudStorage/GoogleDrive-nanaamoako202@gmail.com/My Drive/CAPSTONE/"
    "code/duosign/research-paper/70032026_Nana-Kwaku-Amoako_APPLIED-PROJECT_2026.pdf"
)
OUT_CONTENT = ROOT / "src/features/research-reader/content"
OUT_IMG = ROOT / "public/research/thesis"
OUT_PDF = ROOT / "public/research/DuoSign_Thesis_2026.pdf"
IMG_URL = "/research/thesis"
MAX_IMG_W = 1600

# Rows dropped from the HTML: blank signature fields on the declaration form.
DROP_ROW = re.compile(r"^(Student Signature:|Supervisor Acknowledgement:)")

# ───────────────────────────── low-level text model ─────────────────────────────


@dataclass
class Ch:
    c: str
    x0: float
    y0: float
    x1: float
    y1: float
    font: str
    size: float
    flags: int

    @property
    def bold(self) -> bool:
        return "Bold" in self.font or "bxtt" in self.font

    @property
    def italic(self) -> bool:
        return "Italic" in self.font or self.font.startswith(("NewTXMI", "txmia"))

    @property
    def mono(self) -> bool:
        return "tt" in self.font.lower() and not self.font.startswith("TeXGyre")


@dataclass
class Row:
    chars: list[Ch]
    page: int
    x0: float = 0
    y0: float = 0
    x1: float = 0
    y1: float = 0
    size: float = 12
    text: str = ""
    runs: list = field(default_factory=list)  # [(style, text)]

    def finish(self) -> "Row":
        cs = [c for c in self.chars if c.c.strip()]
        self.x0 = min(c.x0 for c in cs)
        self.x1 = max(c.x1 for c in cs)
        self.y0 = min(c.y0 for c in cs)
        self.y1 = max(c.y1 for c in cs)
        sizes = sorted(c.size for c in cs)
        self.size = sizes[len(sizes) // 2]
        self.runs = build_runs(self.chars, self.size)
        self.text = "".join(t for _, t in self.runs).strip()
        return self

    @property
    def all_bold(self) -> bool:
        return all(c.bold for c in self.chars if c.c.strip())

    @property
    def all_mono(self) -> bool:
        return all(c.mono for c in self.chars if c.c.strip() and c.c not in ",.;")


def build_runs(chars: list[Ch], base: float) -> list[tuple[tuple, str]]:
    """Group characters into styled runs, inserting spaces where glyph gaps imply them."""
    chars = sorted(chars, key=lambda c: c.x0)
    runs: list[list] = []
    prev: Ch | None = None
    for c in chars:
        sup = c.size < base * 0.8 and c.c.strip() != "" and (prev is None or c.y1 < (prev.y1 if prev.size >= base * 0.8 else prev.y1 + 3) - 1.5 or c.c.isdigit())
        style = (c.bold, c.italic, c.mono, sup)
        text = c.c
        if c.c.isspace():
            text = " "
        elif prev is not None and not prev.c.isspace():
            gap = c.x0 - prev.x1
            if gap > 0.13 * min(c.size, prev.size) * (1.6 if c.mono and prev.mono else 1):
                text = " " + text
        if runs and runs[-1][0] == style:
            runs[-1][1] += text
        elif text.startswith(" ") and runs and len(text) > 1:
            runs[-1][1] += " "
            runs.append([style, text[1:]])
        else:
            runs.append([style, text])
        prev = c
    out = []
    for st, t in runs:
        t = re.sub(r"\s+", " ", t)
        if t:
            out.append((st, t))
    return out


def page_rows(page: fitz.Page, pno: int) -> list[Row]:
    raw = page.get_text("rawdict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
    lines = []
    for b in raw["blocks"]:
        if b["type"] != 0:
            continue
        for ln in b["lines"]:
            cs = []
            for s in ln["spans"]:
                for ch in s["chars"]:
                    x0, y0, x1, y1 = ch["bbox"]
                    cs.append(Ch(ch["c"], x0, y0, x1, y1, s["font"], s["size"], s["flags"]))
            if any(c.c.strip() for c in cs):
                lines.append(cs)
    # merge lines that share a baseline band into rows
    rows: list[list[Ch]] = []
    for cs in sorted(lines, key=lambda cs: min(c.y1 for c in cs if c.c.strip())):
        y0 = min(c.y0 for c in cs if c.c.strip())
        y1 = max(c.y1 for c in cs if c.c.strip())
        placed = False
        for r in rows:
            ry0 = min(c.y0 for c in r if c.c.strip())
            ry1 = max(c.y1 for c in r if c.c.strip())
            ov = min(y1, ry1) - max(y0, ry0)
            if ov > 0.55 * min(y1 - y0, ry1 - ry0):
                r.extend(cs)
                placed = True
                break
        if not placed:
            rows.append(list(cs))
    out = [Row(r, pno).finish() for r in rows]
    out.sort(key=lambda r: (round(r.y1), r.x0))
    return out


THICK: set[tuple[int, int]] = set()  # (page, y) of booktabs top/bottom rules


def page_rules(page: fitz.Page):
    hs, vs = [], []
    for dr in page.get_drawings():
        for it in dr["items"]:
            if it[0] == "l":
                r = fitz.Rect(it[1], it[2]).normalize()
            elif it[0] == "re":
                r = fitz.Rect(it[1]).normalize()
            else:
                continue
            if r.height < 1.6 and r.width > 20:
                hs.append(r)
                if (dr.get("width") or 0) > 0.7:
                    THICK.add((page.number, round(r.y0)))
            elif r.width < 1.6 and r.height > 5:
                vs.append(r)
    # dedupe
    def dd(rs, key):
        seen, out = set(), []
        for r in sorted(rs, key=key):
            k = (round(r.x0), round(r.y0), round(r.x1), round(r.y1))
            if k not in seen:
                seen.add(k)
                out.append(r)
        return out

    return dd(hs, lambda r: (r.y0, r.x0)), dd(vs, lambda r: (r.x0, r.y0))


# ───────────────────────────── helpers ─────────────────────────────

CAPTION_RE = re.compile(r"^(Figure|Table)\s*(\d+(?:\.\d+)?):")
HEAD_NUM_RE = re.compile(r"^(\d+(?:\.\d+){1,3})\s+(.+)$")
APP_RE = re.compile(r"^([A-J])((?:\.\d+){0,2})\s+(.+)$")


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


def runs_to_html(runs) -> str:
    out = []
    for (bold, italic, mono, sup), t in runs:
        h = esc(t)
        if sup:
            num = t.strip()
            if num.isdigit():
                out.append(f'<sup class="fn-ref"><a href="#fn-{num}" id="fnref-{num}" aria-label="Footnote {num}">{num}</a></sup>')
                continue
            h = f"<sup>{h}</sup>"
        if mono:
            lead = h[: len(h) - len(h.lstrip())]
            trail = h[len(h.rstrip()):]
            h = f"{lead}<code>{h.strip()}</code>{trail}" if h.strip() else h
        if italic and not mono:
            h = f"<em>{h}</em>"
        if bold:
            h = f"<strong>{h}</strong>"
        out.append(h)
    s = "".join(out)
    s = re.sub(r"</strong>(\s*)<strong>", r"\1", s)
    s = re.sub(r"</em>(\s*)<em>", r"\1", s)
    return s


class Vocab:
    def __init__(self):
        self.plain: set[str] = set()
        self.hyph: set[str] = set()

    def add(self, text: str):
        # ignore line-edge tokens: they may be halves of a hyphenated word
        text = re.sub(r"\S+-$", "", text.strip())
        text = re.sub(r"^\S+", "", text)
        for w in re.findall(r"[A-Za-z][A-Za-z\-]*[A-Za-z]", text):
            if "-" in w:
                self.hyph.add(w.lower())
                for p in w.split("-"):
                    self.plain.add(p.lower())
            else:
                self.plain.add(w.lower())

    def join(self, a: str, b: str) -> bool:
        """True if 'a-' + 'b' should be joined without the hyphen."""
        ma = re.search(r"([A-Za-z]+)-$", a)
        mb = re.match(r"([A-Za-z]+)", b)
        if not ma or not mb:
            return False
        left, right = ma.group(1), mb.group(1)
        joined = (left + right).lower()
        hy = f"{left}-{right}".lower()
        if joined in self.plain:
            return True
        # compounds like "English-to-American" or "platform-as-a-service"
        if re.search(r"[A-Za-z]+-[A-Za-z]+-$", a) or re.match(r"[A-Za-z]+-", b):
            return False
        if hy in self.hyph:
            return False
        if right[0].isupper() and not (left.isupper() and right.isupper()):
            return False
        # two real words ("notation-based", "data-dependent") keep their hyphen
        if len(left) >= 3 and len(right) >= 3 and left.lower() in self.plain and right.lower() in self.plain:
            return False
        return True


def join_rows(rows: list[Row], vocab: Vocab) -> list:
    runs: list = []
    for r in rows:
        rr = [list(x) for x in r.runs]
        if not rr:
            continue
        if runs:
            runs[-1][1] = runs[-1][1].rstrip()
            last = runs[-1][1]
            first = rr[0][1]
            if re.search(r"[A-Za-z]-$", last) and re.match(r"[a-zA-Z]", first) and vocab.join(last, first):
                runs[-1][1] = last[:-1]
            elif last.endswith(("—", "–", "/")) or re.search(r"[A-Za-z]-$", last):
                pass
            elif not last.endswith(" "):
                runs[-1][1] = last + " "
        runs.extend(rr)
    # merge same-style neighbours
    merged: list = []
    for st, t in runs:
        if merged and merged[-1][0] == tuple(st):
            merged[-1][1] += t
        else:
            merged.append([tuple(st), t])
    if merged:
        merged[0][1] = merged[0][1].lstrip()
        merged[-1][1] = merged[-1][1].rstrip()
    return [(tuple(s), t) for s, t in merged if t]


def save_webp(page: fitz.Page, rect: fitz.Rect, name: str) -> tuple[str, int, int]:
    zoom = min(MAX_IMG_W / max(rect.width, 1), 4.0)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=rect, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    if img.width > MAX_IMG_W:
        img = img.resize((MAX_IMG_W, round(img.height * MAX_IMG_W / img.width)), Image.LANCZOS)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    img.save(OUT_IMG / f"{name}.webp", "WEBP", quality=82, method=6)
    return f"{IMG_URL}/{name}.webp", img.width, img.height


# ───────────────────────────── tables ─────────────────────────────


@dataclass
class TableSeg:
    page: int
    rect: fitz.Rect
    hrules: list
    vrules: list
    inner: list = field(default_factory=list)


def mkseg(pi, rect, grp, hs, vs) -> TableSeg:
    vr = [v for v in vs if rect.y0 - 2 <= v.y0 and v.y1 <= rect.y1 + 2]
    inner = [h for h in hs if rect.y0 < h.y0 < rect.y1 and h.x0 >= rect.x0 - 3 and h.x1 <= rect.x1 + 3]
    return TableSeg(pi, rect, grp, vr, inner)


def table_group(hs, start_idx, stop_y=1e9):
    """Rules sharing the x-extent of hs[start_idx], top-down, until stop_y."""
    r0 = hs[start_idx]
    grp = [r0]
    for r in hs[start_idx + 1:]:
        if r.y0 > stop_y:
            break
        if abs(r.x0 - r0.x0) < 3 and abs(r.x1 - r0.x1) < 3:
            grp.append(r)
    return grp


def table_html(segs: list[TableSeg], rows_by_page: dict, caption_html: str | None, tid: str) -> str:
    # Collect rows inside each segment.
    all_lines = []  # (seg_index, Row)
    for si, seg in enumerate(segs):
        for r in rows_by_page[seg.page]:
            if seg.rect.y0 - 1 < (r.y0 + r.y1) / 2 < seg.rect.y1 + 1 and r.x1 > seg.rect.x0 - 2 and r.x0 < seg.rect.x1 + 2:
                all_lines.append((si, r))
    if not all_lines:
        return ""
    # Column boundaries: vertical rules if present, else header-row gaps.
    seg0 = segs[0]
    if len(seg0.vrules) >= 2:
        xs = sorted({round(v.x0) for v in seg0.vrules})
        bounds = [x for x in xs]
        cols = [(bounds[i], bounds[i + 1]) for i in range(len(bounds) - 1)]
    else:
        hdr_bottom = seg0.hrules[1].y0 if len(seg0.hrules) > 1 else seg0.rect.y1
        hdr = [r for si, r in all_lines if si == 0 and r.y1 <= hdr_bottom + 1]
        starts = []
        for r in hdr:
            cs = sorted([c for c in r.chars if c.c.strip()], key=lambda c: c.x0)
            prev = None
            for c in cs:
                if prev is None or c.x0 - prev.x1 > 7:
                    starts.append(c.x0)
                prev = c
        starts = sorted(starts)
        cl = []
        for x in starts:
            if not cl or x - cl[-1] > 12:
                cl.append(x)
        if len(cl) < 2:
            return ""
        edges = cl + [seg0.rect.x1 + 5]
        cols = [(edges[i] - 4, edges[i + 1] - 4) for i in range(len(cl))]
        cols[0] = (seg0.rect.x0 - 5, cols[0][1])

    def cell_of(x):
        for i, (a, b) in enumerate(cols):
            if x < b:
                return i
        return len(cols) - 1

    ruled_cols = len(seg0.vrules) >= 2

    def line_cells(r: Row) -> list[str]:
        per = [""] * len(cols)
        for c in sorted(r.chars, key=lambda c: c.x0):
            per[cell_of(c.x0)] += c.c
        return [re.sub(r"\s+", " ", t).strip() for t in per]

    all_lines = [(si, r) for si, r in all_lines if not re.fullmatch(r"\(?[Cc]ontinued on next page\)?", r.text)]

    # Row splitting
    groups: list[list[Row]] = []
    for si, seg in enumerate(segs):
        ys = sorted({round(h.y0, 1) for h in seg.hrules} | {round(h.y0, 1) for h in seg.inner})
        lines = [r for s, r in all_lines if s == si]
        bands = list(zip(ys, ys[1:]))
        booktabs = any((seg.page, round(h.y0)) in THICK for h in seg.hrules)
        per_rule = len(bands) >= 3 and not booktabs
        for a, b in bands:
            band = [r for r in lines if a - 1 < (r.y0 + r.y1) / 2 < b + 1]
            if not band:
                continue
            if (len(groups) == 0 and si == 0) or (per_rule and not ruled_cols):
                groups.append(band)
                continue
            cur: list[Row] = []
            prev_y1 = None
            prev_cells: list[str] = []
            for r in band:
                cells_txt = line_cells(r)
                filled = {i for i, t in enumerate(cells_txt) if t}
                gap = (r.y0 - prev_y1) if prev_y1 is not None else 99
                if per_rule:
                    # several rows can share one ruled band; only split on a clean start
                    c0 = cells_txt[0]
                    cont = (any(t.endswith(("-", ",")) for t in prev_cells)
                            or (c0[:1].islower() or c0.startswith("("))
                            or (prev_cells and prev_cells[0].count("(") > prev_cells[0].count(")")))
                    new = bool(c0) and not cont
                else:
                    new = 0 in filled and (len(filled) >= 2 or gap > 6 or len(cols) == 1)
                if new and cur:
                    groups.append(cur)
                    cur = []
                cur.append(r)
                prev_y1 = r.y1
                prev_cells = cells_txt
            if cur:
                groups.append(cur)
    if not groups:
        return ""

    def cells(group):
        buckets = [[] for _ in cols]
        for r in group:
            per = [[] for _ in cols]
            for c in r.chars:
                if c.c.strip() or per[cell_of(c.x0)]:
                    per[cell_of(c.x0)].append(c)
            for i, cs in enumerate(per):
                if any(c.c.strip() for c in cs):
                    buckets[i].append(Row(cs, r.page).finish())
        return [runs_to_html(join_rows(b, VOCAB)) for b in buckets]

    header = cells(groups[0])
    body = [cells(g) for g in groups[1:]]
    # longtable repeats the header on each page; drop duplicates
    body = [b for b in body if b != header]
    # merge rows whose first cell is empty into the previous row only when vrule-free tables wrap oddly
    h = [f'<div class="table-wrap" role="region" aria-labelledby="{tid}-cap" tabindex="0"><table id="{tid}">']
    if caption_html:
        h.append(f'<caption id="{tid}-cap">{caption_html}</caption>')
    h.append("<thead><tr>" + "".join(f'<th scope="col">{c}</th>' for c in header) + "</tr></thead><tbody>")
    for b in body:
        if sum(1 for c in b if c) == 1 and b[0] and len(cols) > 2:
            h.append(f'<tr class="group"><th scope="rowgroup" colspan="{len(cols)}">{b[0]}</th></tr>')
        else:
            h.append("<tr>" + "".join(f"<td>{c}</td>" for c in b) + "</tr>")
    h.append("</tbody></table></div>")
    return "".join(h)


# ───────────────────────────── main conversion ─────────────────────────────

VOCAB = Vocab()


def convert(pdf_path: Path, exclude: set[int]):
    doc = fitz.open(pdf_path)
    n = doc.page_count
    rows_by_page: dict[int, list[Row]] = {}
    rules_by_page: dict[int, tuple] = {}
    for i in range(n):
        rows_by_page[i] = page_rows(doc[i], i)
        rules_by_page[i] = page_rules(doc[i])
        for r in rows_by_page[i]:
            VOCAB.add(r.text)

    def first_text(i):
        rs = [r for r in rows_by_page[i] if r.text]
        return rs[0].text if rs else ""

    start = next(i for i in range(n) if first_text(i).startswith("Chapter 1:"))
    abs_page = next(i for i in range(start) if first_text(i) == "Abstract")
    abstract_rows = [r for r in rows_by_page[abs_page] if r.text != "Abstract" and not re.fullmatch(r"[ivxlc]+|\d+", r.text)]
    abstract = re.sub(r"\s+", " ", "".join(t for _, t in join_rows(abstract_rows, VOCAB))).strip()

    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for f in OUT_IMG.glob("*.webp"):
        f.unlink()

    out: list[str] = []
    headings: list[dict] = []
    footnotes: dict[str, str] = {}
    chapter_fns: list[str] = []

    para: list[Row] = []
    para_kind = None  # 'p' | 'li'
    list_open = None  # 'ul' | 'ol'
    deferred: list[str] = []
    in_refs = False
    refs: list[tuple[str, list[Row]]] = []
    pre_rows: list[Row] = []
    kv_rows: list[Row] = []
    pending_table: dict | None = None  # caption waiting for its rules on a later page
    open_table: dict | None = None  # longtable spanning pages
    open_heading: dict | None = None

    def flush_para():
        nonlocal para, para_kind
        if para:
            body = runs_to_html(join_rows(para, VOCAB))
            if para_kind == "li":
                body = re.sub(r"^(?:•|◦|–|\d+\.|\([a-z]\))\s*", "", body)
                out.append(f"<li>{body}</li>")
            else:
                out.append(f"<p>{body}</p>")
        para, para_kind = [], None
        if deferred and not list_open:
            out.extend(deferred)
            deferred.clear()

    def close_list():
        nonlocal list_open
        flush_para()
        if list_open:
            out.append(f"</{list_open}>")
            list_open = None
        if deferred:
            out.extend(deferred)
            deferred.clear()

    def flush_pre():
        nonlocal pre_rows
        if pre_rows:
            base = min(r.x0 for r in pre_rows)
            lines = []
            for r in pre_rows:
                ind = " " * max(0, round((r.x0 - base) / 6))
                lines.append(ind + r.text)
            out.append("<pre><code>" + esc("\n".join(lines)) + "</code></pre>")
            pre_rows = []

    def flush_kv():
        nonlocal kv_rows
        if kv_rows:
            items = []
            for r in kv_rows:
                cs = sorted([c for c in r.chars], key=lambda c: c.x0)
                lead = [c for c in cs if c.c.strip()]
                split = None
                if lead and lead[0].bold:
                    for c in lead:
                        if not c.bold:
                            split = c.x0
                            break
                if split is None:
                    if items:
                        items[-1][1].append(r)
                    continue
                k = Row([c for c in cs if c.x0 < split], r.page).finish()
                v = Row([c for c in cs if c.x0 >= split], r.page).finish()
                items.append(([k], [v]))
            out.append('<dl class="kv">' + "".join(
                f"<dt>{runs_to_html(join_rows(k, VOCAB))}</dt><dd>{runs_to_html(join_rows(v, VOCAB))}</dd>" for k, v in items) + "</dl>")
            kv_rows = []

    def flush_all():
        close_list()
        flush_pre()
        flush_kv()

    def flush_chapter_footnotes():
        if chapter_fns:
            out.append('<aside class="footnotes" aria-label="Footnotes"><ol>' + "".join(
                f'<li id="fn-{k}" value="{k}">{footnotes[k]} <a href="#fnref-{k}" class="fn-back" aria-label="Back to text">↩\ufe0e</a></li>' for k in chapter_fns) + "</ol></aside>")
            chapter_fns.clear()

    def emit_float(h: str):
        if para or list_open:
            deferred.append(h)
        else:
            out.append(h)

    def add_heading(level: int, hid: str, num: str, title: str, toc: str):
        flush_all()
        tag = {1: "h3", 2: "h4", 3: "h5", 4: "h6"}[level]  # the page owns h1/h2
        attr = " data-l1" if level == 1 else ""
        num_html = f'<span class="h-num">{esc(num)}</span> ' if num else ""
        out.append(f'<{tag} id="{hid}"{attr}>{num_html}{esc(title)}</{tag}>')
        if level <= 2:
            headings.append({"id": hid, "text": toc, "level": level})
        return {"tag": tag, "id": hid}

    fig_count = 0
    for pi in range(start, n):
        if pi in exclude:
            continue
        page = doc[pi]
        rows = rows_by_page[pi]
        hs, vs = rules_by_page[pi]
        consumed: set[int] = set()
        page_fns: list[str] = []

        # page number (last row, digits only, near bottom)
        for r in rows:
            if r.y0 > 770 and re.fullmatch(r"\d+|[ivxlc]+", r.text):
                consumed.add(id(r))

        # footnote rule
        def is_fn_rule(h):
            if not (150 < h.width < 200 and h.y0 > 380 and abs(h.x0 - 86) < 4):
                return False
            below = [r for r in rows if r.y0 > h.y0 and id(r) not in consumed]
            if not below:
                return False
            first = min(below, key=lambda r: r.y0)
            lead = min((c for c in first.chars if c.c.strip()), key=lambda c: c.x0)
            return lead.size < 8.5 and lead.c.isdigit() and all(r.size <= 10.5 for r in below)

        fn_rule = next((h for h in hs if is_fn_rule(h)), None)
        if fn_rule is not None:
            cur = None
            for r in rows:
                if id(r) in consumed or r.y0 < fn_rule.y0:
                    continue
                consumed.add(id(r))
                m = re.match(r"^(\d+)\s*(.*)$", r.text)
                lead = sorted([c for c in r.chars if c.c.strip()], key=lambda c: c.x0)
                if m and lead and lead[0].size < 8.5:
                    cur = m.group(1)
                    footnotes[cur] = ""
                    page_fns.append(cur)
                    # strip the number chars
                    num_len = len(cur)
                    body_chars = [c for c in sorted(r.chars, key=lambda c: c.x0)]
                    k = 0
                    keep = []
                    for c in body_chars:
                        if k < num_len and c.c.strip():
                            k += 1
                            continue
                        keep.append(c)
                    rr = Row(keep, pi).finish() if any(c.c.strip() for c in keep) else None
                    footnotes[cur] = runs_to_html(rr.runs).strip() if rr else ""
                elif cur:
                    footnotes[cur] += " " + runs_to_html(r.runs).strip()

        events: list[tuple[float, str, object]] = []  # (y, kind, payload)

        # ── algorithms (rendered as images with a text alternative)
        for r in rows:
            if id(r) in consumed:
                continue
            m = re.match(r"^Algorithm\s+(\d+)\s*(.*)$", r.text)
            if m and r.chars and r.runs and r.runs[0][0][0]:
                top = max([h for h in hs if h.y0 < r.y1 and r.y0 - h.y0 < 20], key=lambda h: h.y0, default=None)
                below = [h for h in hs if h.y0 > r.y1 + 5 and top is not None and abs(h.x0 - top.x0) < 3]
                if top is None or not below:
                    continue
                bottom = below[-1] if len(below) > 1 else below[0]
                rect = fitz.Rect(top.x0 - 4, top.y0 - 2, top.x1 + 4, bottom.y0 + 3)
                inside = [x for x in rows if rect.y0 <= (x.y0 + x.y1) / 2 <= rect.y1]
                for x in inside:
                    consumed.add(id(x))
                name = f"algorithm-{m.group(1)}"
                src, w, hgt = save_webp(page, rect, name)
                alt_text = "\n".join(x.text for x in inside[1:])
                cap = esc(f"Algorithm {m.group(1)}: {m.group(2)}")
                events.append((rect.y0, "float", (
                    f'<figure class="algorithm" id="{name}"><img src="{src}" width="{w}" height="{hgt}" loading="lazy" decoding="async" '
                    f'alt="Algorithm {m.group(1)} pseudocode; full text follows." /><figcaption>{cap}</figcaption>'
                    f'<details class="alt-text"><summary>Algorithm text</summary><pre>{esc(alt_text)}</pre></details></figure>')))

        # ── captions → figures and tables
        cap_rows = []
        i = 0
        live = [r for r in rows if id(r) not in consumed]
        while i < len(live):
            r = live[i]
            m = CAPTION_RE.match(r.text)
            if m and not r.all_bold:
                grp = [r]
                j = i + 1
                while (j < len(live) and live[j].y0 - grp[-1].y1 < 6 and not CAPTION_RE.match(live[j].text) and live[j].size >= 11
                       and not any(grp[-1].y1 - 3 < h.y0 < live[j].y1 for h in hs)):
                    grp.append(live[j])
                    j += 1
                cap_rows.append((m.group(1), m.group(2), grp))
                i = j
            else:
                i += 1

        # continuation of a longtable from a previous page
        if open_table is not None:
            cand = [k for k, h in enumerate(hs) if abs(h.x0 - open_table["x0"]) < 3 and abs(h.x1 - open_table["x1"]) < 3]
            body_above = [r for r in rows if id(r) not in consumed and hs and cand and r.y1 < hs[cand[0]].y0 - 2]
            if cand and not body_above:
                grp = table_group(hs, cand[0])
                rect = fitz.Rect(grp[0].x0, grp[0].y0, grp[0].x1, grp[-1].y0)
                vr = [v for v in vs if rect.y0 - 2 <= v.y0 and v.y1 <= rect.y1 + 2]
                open_table["segs"].append(mkseg(pi, rect, grp, hs, vs))
                for r in rows:
                    if rect.y0 - 1 < (r.y0 + r.y1) / 2 < rect.y1 + 1:
                        consumed.add(id(r))
                if grp[-1].y0 < 700:
                    events.append((rect.y1, "table_end", open_table))
                    open_table = None
            else:
                events.append((0, "table_end", open_table))
                open_table = None

        if pending_table is not None:
            # caption was at the bottom of the previous page; rules start this page
            if hs:
                grp = table_group(hs, 0)
                rect = fitz.Rect(grp[0].x0, grp[0].y0, grp[0].x1, grp[-1].y0)
                vr = [v for v in vs if rect.y0 - 2 <= v.y0 and v.y1 <= rect.y1 + 2]
                pending_table["segs"] = [mkseg(pi, rect, grp, hs, vs)]
                pending_table["x0"], pending_table["x1"] = grp[0].x0, grp[0].x1
                for r in rows:
                    if rect.y0 - 1 < (r.y0 + r.y1) / 2 < rect.y1 + 1:
                        consumed.add(id(r))
                events.append((rect.y1, "table_end", pending_table))
            pending_table = None

        image_rects = [fitz.Rect(b["bbox"]) for b in page.get_text("dict")["blocks"] if b["type"] == 1]
        for kind, num, grp in cap_rows:
            for x in grp:
                consumed.add(id(x))
            cap_html = runs_to_html(join_rows(grp, VOCAB))
            cap_html = re.sub(r"^((?:Figure|Table)\s*[\d.]+):", r"<b>\1.</b>", cap_html)
            cy0, cy1 = grp[0].y0, grp[-1].y1
            fid = ("fig-" if kind == "Figure" else "tab-") + num.replace(".", "-")
            if kind == "Figure":
                above_rows = [x for x in rows if x.y1 < cy0 - 1 and id(x) not in consumed]
                limit = max((x.y1 for x in above_rows if not any(fitz.Rect(x.x0, x.y0, x.x1, x.y1).intersects(ir) for ir in image_rects)), default=60)
                imgs = [ir for ir in image_rects if ir.y1 <= cy0 + 2 and ir.y0 >= limit - 2]
                if imgs:
                    rect = fitz.Rect(min(i.x0 for i in imgs), min(i.y0 for i in imgs), max(i.x1 for i in imgs), max(i.y1 for i in imgs))
                else:
                    rect = fitz.Rect(86, limit + 4, 525, cy0 - 4)
                for x in rows:
                    if rect.contains(fitz.Point((x.x0 + x.x1) / 2, (x.y0 + x.y1) / 2)):
                        consumed.add(id(x))
                fig_count += 1
                src, w, hgt = save_webp(page, rect, fid)
                plain = re.sub(r"<[^>]+>", "", cap_html)
                alt = re.sub(r"^(Figure\s*[\d.]+)\.\s*", "", html.unescape(plain))
                events.append((rect.y0, "float", (
                    f'<figure id="{fid}"><a href="{src}" target="_blank" rel="noopener" class="fig-link">'
                    f'<img src="{src}" width="{w}" height="{hgt}" loading="lazy" decoding="async" alt="{html.escape(alt)}" /></a>'
                    f"<figcaption>{cap_html}</figcaption></figure>")))
            else:
                after = [k for k, h in enumerate(hs) if h.y0 > cy1 - 1 and h.y0 - cy1 < 30]
                before = [k for k, h in enumerate(hs) if h.y0 < cy0 and cy0 - h.y0 < 30]
                info = {"caption": cap_html, "id": fid}
                if after:
                    grp_r = table_group(hs, after[0])
                elif before:
                    last = before[-1]
                    first = last
                    while first > 0 and abs(hs[first - 1].x0 - hs[last].x0) < 3 and abs(hs[first - 1].x1 - hs[last].x1) < 3:
                        first -= 1
                    grp_r = hs[first:last + 1]
                else:
                    pending_table = info
                    events.append((cy0, "noop", None))
                    continue
                # stop at the next caption below
                nxt = [g for _, _, g in cap_rows if g[0].y0 > cy1]
                if nxt and after:
                    grp_r = [h for h in grp_r if h.y0 < nxt[0][0].y0]
                rect = fitz.Rect(grp_r[0].x0, grp_r[0].y0, grp_r[0].x1, grp_r[-1].y0)
                vr = [v for v in vs if rect.y0 - 2 <= v.y0 and v.y1 <= rect.y1 + 2]
                info["segs"] = [mkseg(pi, rect, grp_r, hs, vs)]
                info["x0"], info["x1"] = grp_r[0].x0, grp_r[0].x1
                for x in rows:
                    if rect.y0 - 1 < (x.y0 + x.y1) / 2 < rect.y1 + 1:
                        consumed.add(id(x))
                if after and grp_r[-1].y0 > 700 and len(vr) > 0 or (after and grp_r[-1].y0 > 735):
                    open_table = info
                else:
                    events.append((min(cy0, rect.y0), "table_end", info))

        for r in rows:
            if id(r) not in consumed:
                events.append((r.y0, "row", r))
        events.sort(key=lambda e: e[0])

        for _, kind, payload in events:
            if kind == "noop":
                continue
            if kind == "float":
                if pre_rows or kv_rows:
                    flush_pre(); flush_kv()
                emit_float(payload)
                continue
            if kind == "table_end":
                info = payload
                t = table_html(info["segs"], rows_by_page, info["caption"], info["id"])
                if not t:  # fall back to an image of the table
                    seg = info["segs"][0]
                    src, w, hgt = save_webp(doc[seg.page], seg.rect + (-4, -4, 4, 4), info["id"])
                    t = f'<figure id="{info["id"]}"><img src="{src}" width="{w}" height="{hgt}" loading="lazy" alt="Table image" /><figcaption>{info["caption"]}</figcaption></figure>'
                if pre_rows or kv_rows:
                    flush_pre(); flush_kv()
                emit_float(t)
                continue

            r: Row = payload
            text = r.text
            if not text or DROP_ROW.match(text):
                continue

            # ── headings
            if r.all_bold and r.size >= 11.5 and len(text) < 140:
                h = None
                if text.startswith("Chapter "):
                    m = re.match(r"Chapter (\d+):\s*(.+)", text)
                    flush_all()
                    flush_chapter_footnotes()
                    open_heading = add_heading(1, f"chapter-{m.group(1)}", f"Chapter {m.group(1)}", m.group(2), f"{m.group(1)}. {m.group(2)}")
                    in_refs = False
                    continue
                if text == "References":
                    flush_all(); flush_chapter_footnotes()
                    add_heading(1, "references", "", "References", "References")
                    out.append('<ol class="refs">')
                    in_refs = True
                    continue
                if text == "Appendices":
                    if in_refs:
                        flush_refs(refs, out); in_refs = False
                    flush_all(); flush_chapter_footnotes()
                    add_heading(1, "appendices", "", "Appendices", "Appendices")
                    continue
                m = HEAD_NUM_RE.match(text)
                ma = APP_RE.match(text) if not m else None
                if m and not in_refs:
                    num, title = m.group(1), m.group(2)
                    level = num.count(".") + 1
                    add_heading(min(level, 4), "s-" + num.replace(".", "-"), num, title, f"{num} {title}")
                    continue
                if ma and not in_refs:
                    num = ma.group(1) + ma.group(2)
                    level = 2 + ma.group(2).count(".")
                    add_heading(min(level, 4), "appendix-" + slug(num), num, ma.group(3), f"{num}. {ma.group(3)}")
                    continue

            if in_refs:
                m = re.match(r"^\[(\d+)\]\s*", text)
                if m:
                    refs.append((m.group(1), [r]))
                elif refs:
                    refs[-1][1].append(r)
                continue

            # ── code / key-value rows
            if r.all_mono and len(text) > 1:
                flush_kv(); close_list()
                pre_rows.append(r)
                continue
            flush_pre()
            gaps = sorted([c for c in r.chars if c.c.strip()], key=lambda c: c.x0)
            big_gap = any(b.x0 - a.x1 > 35 for a, b in zip(gaps, gaps[1:]))
            if big_gap and r.size >= 11.5 and gaps and gaps[0].bold:
                close_list()
                kv_rows.append(r)
                continue
            small_gap = any(b.x0 - a.x1 > 12 for a, b in zip(gaps, gaps[1:]))
            bold_label = "".join(c.c for c in gaps if c.bold).strip()
            if kv_rows and (r.x0 > 200 or (gaps and gaps[0].bold and (small_gap or bold_label.endswith(":")))):
                kv_rows.append(r)
                continue
            flush_kv()

            # ── lists & paragraphs
            is_item = re.match(r"^(•|◦|∗)\s*", text) or (re.match(r"^(\d+\.|\([a-z]\))\s+\S", text) and r.x0 > 92)
            if is_item:
                flush_para()
                lt = "ul" if text[0] in "•◦∗" else "ol"
                if list_open != lt:
                    close_list()
                    out.append(f"<{lt}>")
                    list_open = lt
                para = [r]
                para_kind = "li"
                para_x = r.x0
                continue
            if para_kind == "li":
                if r.x0 > para_x + 4 and r.x0 < 130 and not (abs(r.x0 - 122) < 3 and r.x0 > para_x + 15 and False):
                    para.append(r)
                    continue
                close_list()
            indent = abs(r.x0 - 122) < 4
            runin = bool(r.runs and r.runs[0][0][0] and para and re.search(r"[.:;]\s*$", para[-1].text))
            if para and not indent and not runin and para_kind == "p":
                gap = r.y0 - para[-1].y1
                if gap < 18 or r.page != para[-1].page:
                    para.append(r)
                    continue
            flush_para()
            if list_open:
                close_list()
            para = [r]
            para_kind = "p"

        # end of page: paragraphs continue across pages; footnotes join the chapter's list
        chapter_fns.extend(page_fns)

    flush_all()
    if in_refs:
        flush_refs(refs, out)
    flush_chapter_footnotes()
    if open_table:
        out.append(table_html(open_table["segs"], rows_by_page, open_table["caption"], open_table["id"]))

    body = "\n".join(x for x in out if x)
    body = body.replace("<ol class=\"refs\">\n", "<ol class=\"refs\">", 1)
    body = link_citations(body, max(int(k) for k, _ in refs) if refs else 0)
    return body, headings, abstract


def flush_refs(refs, out):
    items = []
    for k, rs in refs:
        h = runs_to_html(join_rows(rs, VOCAB))
        h = re.sub(r"^\[\d+\]\s*", "", h)
        h = re.sub(r"(https?://[^\s<]+[^\s<.,;)])", r'<a href="\1" rel="noopener" target="_blank">\1</a>', h)
        items.append(f'<li id="ref-{k}" value="{k}">{h}</li>')
    out.append("".join(items) + "</ol>")
    refs.clear()


def link_citations(body: str, maxref: int) -> str:
    if not maxref:
        return body

    def rep(m):
        nums = [x.strip() for x in m.group(1).split(",")]
        if not all(x.isdigit() and 1 <= int(x) <= maxref for x in nums):
            return m.group(0)
        links = ", ".join(f'<a href="#ref-{x}" class="cite">{x}</a>' for x in nums)
        return f'<span class="cites">[{links}]</span>'

    parts = re.split(r"(<pre>.*?</pre>|<code>.*?</code>|<ol class=\"refs\">.*?</ol>)", body, flags=re.S)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r"\[(\d{1,3}(?:,\s*\d{1,3})*)\]", rep, parts[i])
    return "".join(parts)


def write_pdf(src: Path, exclude: set[int]):
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(src)
    if exclude:
        doc.delete_pages(sorted(exclude))
    doc.set_metadata({
        "title": "DuoSign: A Gloss-Based Approach to Automated ASL Generation",
        "author": "Nana Kwaku Amoako",
        "subject": "Applied Project, B.Sc. Computer Science, Ashesi University, 2026",
        "creator": "LaTeX with hyperref", "producer": "pdfTeX / PyMuPDF",
    })
    tmp = OUT_PDF.with_suffix(".tmp.pdf")
    doc.save(tmp, garbage=4, deflate=True, clean=True)
    if tmp.stat().st_size > 8 * 1024 * 1024:
        # Recompress embedded raster images (screenshots/diagrams) to keep it under ~8 MB.
        doc = fitz.open(tmp)
        doc.rewrite_images(dpi_threshold=200, dpi_target=170, quality=80, lossy=True, lossless=True, bitonal=False, color=True, gray=True)
        doc.save(OUT_PDF, garbage=4, deflate=True, clean=True)
        tmp.unlink()
    else:
        shutil.move(tmp, OUT_PDF)
    return OUT_PDF.stat().st_size


def parse_pages(spec: str | None) -> set[int]:
    pages: set[int] = set()
    if not spec:
        return pages
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-")
            pages.update(range(int(a) - 1, int(b)))
        elif part.strip():
            pages.add(int(part) - 1)
    return pages


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    ap.add_argument("--exclude-pages", help="1-based physical pages to drop from HTML and published PDF, e.g. 120-125,130")
    ap.add_argument("--skip-pdf", action="store_true", help="do not (re)write the published PDF")
    args = ap.parse_args()
    if not args.pdf.exists():
        sys.exit(f"PDF not found: {args.pdf}")
    exclude = parse_pages(args.exclude_pages)

    body, headings, abstract = convert(args.pdf, exclude)
    text = re.sub(r"<[^>]+>", " ", body)
    words = len(re.findall(r"\b\w[\w'’-]*\b", html.unescape(text)))
    OUT_CONTENT.mkdir(parents=True, exist_ok=True)
    (OUT_CONTENT / "thesis.html").write_text(
        "<!-- Generated by scripts/thesis-to-html.py from the submitted thesis PDF. Do not edit by hand. -->\n" + body + "\n", encoding="utf8")
    meta = {"source": args.pdf.name, "words": words, "minutes": max(1, round(words / 230)), "abstract": abstract, "headings": headings}
    (OUT_CONTENT / "thesis.meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"html: {len(body)/1024:.0f} KB, {words} words, {len(headings)} toc headings, {len(list(OUT_IMG.glob('*.webp')))} images")
    if not args.skip_pdf:
        size = write_pdf(args.pdf, exclude)
        print(f"pdf: {size/1024/1024:.2f} MB -> {OUT_PDF.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
