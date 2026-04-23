# DuoSign — Complete Slide Deck Guide

**9 minutes | 20 slides | ~25–27 seconds per slide**

**Aesthetic:** Apple/Google minimal. White background. One strong accent color (Ashesi crimson `#8B0000` or deep accessible blue `#1A2B4A`). Large sans-serif type (Inter, SF Pro, or Geist). Max 3–4 bullets per slide — short. Stats live BIG on the slide. One dominant visual per slide. No decorative borders.

---

## SLIDE 1 — TITLE

**Top left (small, accent color):**
`Ashesi University · Applied Project · April 23, 2026`

**Center (large, 56–64pt):**

| col1 | col2 | col3 |
| ---- | ---- | ---- |
|      |      |      |
|      |      |      |

> DuoSign

**Below title (medium, 28pt, light weight):**

> A Gloss-Based Approach to Automated ASL Generation

**Bottom left:**

> Nana Kwaku Amoako

**Bottom right:**

> Supervised by: Kwabena Bamfo

**Visual:** Clean wordmark or a minimal avatar silhouette — nothing else.

**Talk through:** Don't read the title. Say: *"My name is Nana, and for the last year I've been building something I want to show you today."* Pause. Move to slide 2.

---

## [-&gt; PLEASE CHOOSE A GOOD HOOK FOR ME:]()

## SLIDE 2 — THE STORY (Hook)

**Top left (small, accent):**
`Meet Akosua`

**Large headline:**

> She's a student. She's deaf. -- hard on hearing
> And every app she opens speaks to her in English.

**Below (2 lines max):**

> When she types a question to her professor — the reply comes back as plain text.
> Not in her language. Her language is sign.

**Visual:** Simple minimal illustration — a person at a laptop, thought bubble with ASL hands vs. text. Icon-style illustration.

**Talk through:** *"Akosua isn't a hypothetical. There are roughly 500,000 deaf Ghanaians, and the software we build almost never talks back to them in the language they actually use."* Don't say "for those who can hear."

---

  Option A — The YouTube Moment (what you mentioned)

  You're watching a YouTube video. No captions. You turn on auto-generated subtitles — they're broken, half-wrong,
  but they're there. Now flip it: you're deaf. You want to understand a reply someone typed to you. You want to
  receive information in your language. There is no button for that. There is no auto-sign. The tool doesn't exist.
   That's the gap. That's what I built.

  Works because: everyone has been on YouTube. It's instant common ground. You put the audience in the seat before
  flipping it.

---

  Option B — The Google Translate Moment

  Open Google Translate. Type anything. You can get it in Swahili, Twi, Arabic, Japanese — 133 languages. Now try
  to translate it into ASL. Into GhSL. Into any sign language. You can't. One of the world's most widely used
  languages — used by 430 million people — is not in Google Translate. Not in any mainstream tool. Why? That's what
   I spent a year trying to understand.

  Works because: Google Translate is universally known. The contrast lands hard — everyone assumes it does
  everything.

---

  Option C — The 3MT Opening (most dramatic, best for competition)

  Imagine waking up tomorrow and every piece of digital information you encounter — your lecture slides, your
  professor's email, your hospital discharge papers — is in a language you can read but that isn't yours. You can
  get by. But getting by isn't access. For 430 million deaf and hard-of-hearing people, that's not a hypothetical.
  That's Tuesday. DuoSign is my attempt to change one part of that.

  Works because: it uses second-person — the audience briefly is the person. Then you release them and name the
  real population. Emotional but not manipulative.

---

  Option D — The Interpreter Shortage (concrete and local)

  There are roughly 500,000 deaf Ghanaians. There are not 500,000 sign language interpreters. There are not even
  close. So what happens when there's no interpreter in the room — at the hospital, in the classroom, at the
  government office? You adapt. You write notes back and forth. You miss things. You leave. I built DuoSign because
   the interpreter can't always be there. But the browser always can.

  Works because: it grounds the problem in a real resource constraint — not a technology gap, a human capacity gap.
   Feels urgent and local.

---

  My pick for a 9-minute applied project presentation: Option C for the opening line, then pivot into the YouTube
  or Google Translate concrete example as your second sentence. Something like:

  ▎ "Imagine every piece of digital information you encounter is in a language that isn't yours. For 430 million
  ▎ deaf people, that's not hypothetical — that's Tuesday. Open Google Translate. You can get Twi, Swahili,
  ▎ Japanese. You cannot get ASL. That's the gap. That's what DuoSign is."

  Short. Punchy. Lands before you've even clicked to slide 3.

---

## SLIDE 3 — THE SCALE

**Top left (small, accent):**
`The Problem`

**Three large stat blocks (centered, side by side):**

| **430 million**                        | **500,000**        | **80%**                                                                        |
| -------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| people worldwide are deaf or hard-of-hearing | estimated deaf Ghanaians | of deaf individuals face educational barriers due to limited sign-language resources |

**One line below:**

> Sign language is not "English on the hands." It has its own grammar, spatial syntax, and non-manual markers.

**Visual:** The three stats as large typographic callouts — think Apple keynote numbers.

**Talk through:** Hit the numbers, then say: *"And here's the thing — sign language is not a simplified version of English. ASL has entirely different grammar. Stripping that out when you respond to a deaf person isn't neutral. It's linguistically reductive."*

---

## SLIDE 4 — THE DIRECTIONALITY GAP

**Top left (accent):**
`The Core Problem`

**Headline:**

> Sign language tech works in the wrong direction.

**Two visual columns:**

**← Most research:**

> Sign → Text
> (helping hearing people understand deaf input)

**→ What's missing:**

> Text → Sign
> (delivering information *back* to deaf users in their language)

**One sentence below:**

> Deaf individuals can express themselves to hearing systems. But the replies? Always in English.

**Visual:** Two-direction arrow diagram. The left arrow is thick and bold (dominant). The right arrow is thin, dotted — absent. Make the imbalance visceral.

**Talk through:** *"The research field has been almost entirely focused on helping hearing people understand signers. The reverse direction — translating information back to deaf users in sign — is significantly underexplored. That asymmetry is what DuoSign is designed to fix."*

---

## SLIDE 5 — WHAT EXISTS: THE LANDSCAPE

**Top left (accent):**
`Existing Work`

**Headline:**

> Four decades of sign language generation — and still major gaps.

**Three-column timeline (minimal, clean):**

| **1980s–2010**      | **2010–2018**                                                                  | **2018–present**                                                 |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Notation-driven avatars    | Motion capture avatars                                                                | Neural pipelines                                                        |
| Rule-based, stiff, robotic | More natural — but a 1,000-sign lexicon cost months and tens of thousands of dollars | Better benchmark metrics, but users still struggle to understand output |

**One line at the bottom:**

> Most are closed-source, GPU-heavy, and built for European or North American sign languages.

**Visual:** Horizontal timeline with three labeled epochs.

**Talk through:** *"Research has been building toward this for 40 years. But there's a consistent ceiling: the more natural the system, the more expensive and non-reproducible it is. And almost none of it was built for Africa."*

---

## SLIDE 6 — THE GAPS (Literature)

**Top left (accent):**
`Gaps in Literature`

**Headline:**

> The field is active. But these gaps persist.

**Four labeled gaps (icon + short text):**

> **Gap 1:** No single system combines voice input + browser rendering + video export — all in one pipeline.

> **Gap 2:** Existing systems are tightly coupled to large, language-specific corpora (German, American) — not portable.

> **Gap 3:** African sign languages (GhSL, NSL, KeSL) have virtually no computational datasets. None.

> **Gap 4:** A structural vicious cycle — no data → no tools → communities stay marginalized → no funding → no data.

**Visual:** The vicious cycle diagram (from paper Figure 1.1), redesigned cleanly. Put DuoSign's intervention point clearly labeled.

**Talk through:** *"I'm not saying no one is building tools for deaf people — they are. But there are clear structural gaps. Especially for African sign languages. Ghana alone has around 10,000 active GhSL users, with no publicly available corpus, no standardized glossing conventions, no computational tools whatsoever. That cycle is what I'm trying to interrupt."*

---

## SLIDE 7 — THE SOLUTION

**Top left (accent):**
`DuoSign`

**Headline (large):**

> English in. Sign language out.
> In any browser. No hardware required.

**Three stage blocks:**

> **Stage 1** · Text → ASL Gloss
> NLP engine converts English to sign-language-compatible gloss tokens

> **Stage 2** · Gloss → Pose Data
> Each gloss maps to real signer motion extracted from 11,980 video clips

> **Stage 3** · Pose → Avatar Animation
> A 3D avatar renders the sign sequence in real time

**One line:**

> Modular and forkable — built so researchers can swap in a new sign language dataset without rebuilding everything.

**Visual:** Clean three-box pipeline diagram with arrows. Simple, readable.

**Talk through:** *"DuoSign is a web application. You type or speak in English. The system translates it to ASL gloss, maps each gloss to real signing motion, and plays it back through a 3D avatar — all in the browser, on any device, with no installation."*

---

## SLIDE 8 — HOW GLOSSES WORK

**Top left (accent):**
`The NLP Engine`

**Headline:**

> English grammar ≠ ASL grammar.
> Glosses are the bridge.

**Example (large, visual):**

> English: *"I am going to the store tomorrow"*
> ↓
> ASL Gloss: `I` `STORE` `TOMORROW` `GO`

**Three callouts:**

> — No articles (a, the, an)
> — Different word order (topic-comment structure)
> — Part of speech matters: the LLM automatically identifies whether a word is a verb, noun, or modifier — so the right gloss is selected for context

**Fallback:**

> Unknown word? → Synonym matching first → Fingerspelling as final fallback

**Visual:** Input/output transformation shown visually with chips (like the app's gloss chips).

**Talk through:** *"ASL has its own grammar. It's not English in hand movements. So we can't just take English word order and sign each word. The NLP engine applies ASL grammar rules — and critically, when it hits a word it's uncertain about, the LLM comes in to identify the part of speech. That helps pick the right gloss. If a word isn't in our vocabulary at all, we first look for a synonym, and if that fails, we fingerspell it letter by letter."*

---

## SLIDE 9 — THE AVATAR

**Top left (accent):**
`The Avatar`

**Headline:**

> Real signing videos. Real motion. No fabrication.

**Three facts:**

> — Pose landmarks extracted from real WLASL signing videos using MediaPipe
> — Kalidokit maps landmarks to 3D bone rotations on a VRM avatar
> — Three display modes: Avatar · Skeleton · Hidden

**One line:**

> The motion is grounded in real human signing — not synthetic or notation-generated.

**Visual:** Screenshot from the actual DuoSign app — the avatar signing, with the gloss chip row visible. Also show skeleton mode side by side.

**Talk through:** *"What makes this different from older notation-driven avatars like eSIGN? The motion comes from real video. We extract skeletal pose data from real signers in the WLASL dataset using MediaPipe, then retarget that onto a 3D avatar. The avatar isn't acting out a script written by a linguist — it's replaying motion derived from an actual person signing."*

---

## SLIDE 10 — THE PRODUCT (What It Does)

**Top left (accent):**
`The System`

**Headline:**

> A full translation workspace. In your browser.

**Feature list (icon + one-liner each, 5 max):**

> · Type or speak → avatar signs in real time
> · Gloss token breakdown shown sign-by-sign
> · Export any translation as an MP4 video
> · Translation history with replay, edit, delete
> · Works on desktop and mobile — no installation

**Visual:** Two-panel screenshot — desktop interface (left) and mobile (right). Actual app screenshots. Clean crop.

**Talk through:** Just walk through the features quickly. *"You can type or use your voice. The avatar signs it. You can see every gloss token. You can export it as a video to share. And the whole thing runs in your browser — Akosua just needs a phone."*

---

## SLIDE 11 — WHO IT'S FOR

**Top left (accent):**
`Intended Users`

**Headline:**

> Built for four groups of people.

**Four blocks (2x2 grid):**

> **Deaf & Hard-of-Hearing**
> Receive digital content in their primary language — not forced to adapt to English

> **ASL Learners**
> Self-paced learning with gloss breakdown + skeleton mode + adjustable speed

> **Educators & Content Creators**
> Export signed video without hiring an interpreter

> **Researchers & Developers**
> Reproducible, modular baseline — swap in a new sign language dataset

**Visual:** Four clean icon-labeled cards.

**Talk through:** *"Back to Akosua — she's the primary user. But the system also has clear value for people learning ASL, for educators who want accessible materials without hiring a full interpreter, and for researchers who want a working open baseline."*

---

## SLIDE 12 — TECHNICAL PERFORMANCE

**Top left (accent):**
`Performance`

**Headline:**

> Fast. Accessible. Reliable.

**Stat row (large typographic callouts):**

| **2.5 ms**                      | **60 FPS** | **1.2 s**       | **124 / 124**    |
| ------------------------------------- | ---------------- | --------------------- | ---------------------- |
| text-to-gloss latency (target: <50ms) | avatar rendering | cold-start end-to-end | automated tests passed |

**One line:**

> 100% API test pass rate (46/46 endpoints).

**Visual:** Stat cards — big numbers, small labels below. Apple keynote style.

**Talk through:** *"The NLP engine runs at 2.5 milliseconds for rule-based translation. The avatar runs at 60 frames per second in-browser. End-to-end from pressing Translate to first animation: about 1.2 seconds cold, 370 milliseconds cached. All 124 automated tests pass."*

---

## SLIDE 13 — ACCESSIBILITY

**Top left (accent):**
`Accessibility`

**Headline:**

> Built for accessibility from the ground up.

**One large central callout:**

> **100 / 100**
> Lighthouse Accessibility Score

**Checklist (6 items, all checked):**

> ✓ WCAG 2.1 AA compliant
> ✓ 0 axe-core violations
> ✓ Keyboard navigable
> ✓ Screen reader compatible
> ✓ Color contrast: all pairs pass
> ✓ Touch target sizes: minimum 44×44px

**Visual:** The 100/100 as a dominant number, checklist below.

**Talk through:** *"An accessibility tool that itself isn't accessible is a contradiction. I audited DuoSign against WCAG 2.1 AA — the standard for accessible web applications. Lighthouse returned 100/100. Zero automated violations."*

---

## SLIDE 14 — USER STUDY

**Top left (accent):**
`Validation`

**Headline:**

> A small but encouraging pilot.

**Three stat callouts:**

| **73.50**                                | **60%**                                      | **IRB Approved**         |
| ---------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| Mean SUS score — rated "Good" (benchmark: 68) | of respondents would use DuoSign in a real setting | Ashesi University IRB approval |

**One quote:**

> *"IT'S SUCH A LOVELY UI... it's clean and smooth."*
> — Study participant

**One honest line:**

> 5 usable survey responses from 36 registered participants. Findings are formative, not conclusive.

**Visual:** SUS score shown as a gauge/scale from 0–100 with "Good" band highlighted.

**Talk through:** *"36 participants registered. Only 5 completed post-session surveys — this is a pilot, and I'll be honest about that. But among those 5, the SUS score was 73.5, which falls in the 'Good' band. 3 of the 5 said they'd use it in a real setting. The main criticism was the avatar motion — and that's fair."*

---

## SLIDE 15 — HONEST RESULTS

**Top left (accent):**
`What the Data Says`

**Headline:**

> Three hypotheses. Mixed but meaningful results.

**Three-row table:**

| Hypothesis                          | Target   | Result                                                            |
| ----------------------------------- | -------- | ----------------------------------------------------------------- |
| H1: Sign recognition accuracy ≥80% | 80%      | Not confirmed — avatar harder to interpret than expected         |
| H2: Users prefer animated avatar    | Majority | Partially — 2D skeleton was often more reliable for verification |
| H3: SUS score > 68                  | >68      | **Confirmed** — 73.50 ✓                                   |

**One line:**

> The system is technically sound. The weakest point is avatar motion quality — and that points directly to the next step.

**Visual:** The table with color coding: red ✗, yellow ~, green ✓.

**Talk through:** *"I'll be straightforward. H1 wasn't confirmed — the avatar is harder to read than we hoped, especially for complex signs. H2 was partial — the skeleton mode was actually more useful for verification than the animated avatar. H3 was met. The system is usable. But avatar quality is the clearest gap between working prototype and working communication tool."*

---

## SLIDE 16 — HOW IT COMPARES

**Top left (accent):**
`Comparison`

**Headline:**

> DuoSign occupies a unique position.

**Comparison table (4 systems × 5 features):**

| Feature                  | eSIGN | How2Sign | SignSpeaker | **DuoSign** |
| ------------------------ | ----- | -------- | ----------- | ----------------- |
| Text → Sign             | ✓    | ✓       | ✗          | **✓**      |
| Browser-based            | ✓    | ✗       | ✗          | **✓**      |
| No GPU required          | ✓    | ✗       | —          | **✓**      |
| Voice input              | ✗    | ✗       | ✗          | **✓**      |
| African deployment focus | ✗    | ✗       | ✗          | **✓**      |

**One line:**

> DuoSign is not competing on benchmark metrics. It's competing on accessibility and reproducibility.

**Visual:** Table, DuoSign column highlighted.

**Talk through:** *"Systems like SignSpeaker achieve 99% accuracy — but that's recognition, sign to text. For generation, eSIGN existed but couldn't generalize to arbitrary input. How2Sign is an incredible dataset but not a deployed tool. DuoSign is specifically positioned as the thing that works in a browser, handles voice, requires no GPU, and is designed to be ported to low-resource African sign languages."*

---

## SLIDE 17 — THE AFRICAN CONTEXT

**Top left (accent):**
`Built for Ghana and Beyond`

**Headline:**

> The long-term goal is Ghanaian Sign Language.

**Key points:**

> — GhSL is used by roughly 10,000 deaf Ghanaians (broader deaf population: ~500,000)
> — No publicly available corpus. No standardized glossing. No computational tools.
> — DuoSign's modular pipeline: when GhSL data exists, the stack is ready to receive it.
> — Intervention point in the vicious cycle: lower the cost of building the first tool.

**SDG badges:**

> SDG 4 · Quality Education | SDG 10 · Reduced Inequalities | SDG 8 · Decent Work

**Visual:** Map of Ghana/West Africa. Simple. SDG icons below.

**Talk through:** *"WLASL is an ASL dataset. So DuoSign currently produces ASL output. But the architecture is modular. When GhSL data becomes available, a researcher doesn't have to rebuild this from scratch. They fork DuoSign and replace the dataset. That's the contribution."*

---

## SLIDE 18 — WHAT I BUILT (CS Capstone)

**Top left (accent):**
`Four Years of Computer Science`

**Headline:**

> This project draws on nearly everything I've studied.

**Two columns:**

**Technologies:**

> Next.js · FastAPI · MediaPipe · Three.js
> VRM Avatars · Kalidokit · Supabase · Groq API

**CS Concepts Applied:**

> NLP · Computer Vision · Pose Estimation
> Avatar Animation · Web Systems · Accessibility (WCAG)
> HCI · Software Architecture (C4 model, Feature-Sliced Design)
> Ethics & IRB · AI Use Documentation

**Visual:** Two-column layout, tech stack logos on one side, concept labels on the other.

**Talk through:** *"This project touched NLP, computer vision, 3D animation, web systems, human-computer interaction, accessibility, and ethics. I want to name that explicitly — this is what four years of computer science looks like applied to a real problem."*

---

## SLIDE 19 — LIMITATIONS & NEXT STEPS

**Top left (accent):**
`What's Next`

**Headline:**

> Solid foundation. Clear path forward.

**What's done:**

> ✓ Working browser-based text-to-ASL pipeline
> ✓ 124/124 tests passing
> ✓ WCAG 2.1 AA compliant
> ✓ Pilot study complete

**What's next:**

> → Replace Kalidokit with a better IK solver — smoother avatar motion
> → Add facial grammar (eyebrow movement, head tilt, eye gaze)
> → Extend to Ghanaian Sign Language
> → Larger user study with deaf and hard-of-hearing participants

**Visual:** Two-column "done / next" layout with clean icons.

**Talk through:** *"DuoSign works. It's technically sound. But it's a research prototype, not a finished product. The avatar needs improvement. Facial grammar is completely missing right now — and that matters for intelligibility. And localizing beyond ASL to GhSL remains the most important future step."*

---

## SLIDE 20 — CLOSE + QR CODE

**Top left (accent):**
`Try It`

**Large headline:**

> DuoSign is a step.
> The destination is Akosua.

**Subtext:**

> A deaf student in Ghana — or Philadelphia — being able to consume course content, navigate a hospital website, or read a workplace email in her primary language.

**Two elements:**

Left — **QR Code** (large, centered):

> [Link to live DuoSign demo]
> Scan to try it now.

Right — **Name + Contact:**

> Nana Kwaku Amoako
> Ashesi University, CS '26
> nanaamoako202@gmail.com

**Visual:** QR code large enough to scan from a seat in the audience. Nothing else cluttering the slide.

**Talk through:** *"I'll end where I started — with Akosua. The work isn't finished. But DuoSign is a working, accessible, reproducible baseline that makes building the next version cheaper. If you want to try it now, scan the code. And I'm happy to take questions."*

---

## Design System

| Element                  | Specification                                       |
| ------------------------ | --------------------------------------------------- |
| Background               | White `#FFFFFF`                                   |
| Primary accent           | Ashesi Crimson `#8B0000` or deep blue `#1A2B4A` |
| Body text                | Inter or Geist, 20–22pt                            |
| Headline                 | Inter Bold or SF Pro Display, 40–56pt              |
| Section label (top left) | 12–14pt, accent color, all-caps or light weight    |
| Stat callouts            | 64–80pt, bold, accent color                        |
| Slide margins            | 80–100px on all sides                              |
| Max bullets per slide    | 4                                                   |
| Max words per bullet     | 12                                                  |

---

## Timing Guide (9 minutes)

| Group                   | Slides | Time     |
| ----------------------- | ------ | -------- |
| Hook & Problem          | 1–4   | ~2 min   |
| Landscape & Gaps        | 5–6   | ~1 min   |
| Solution & How it works | 7–11  | ~2.5 min |
| Results & Validation    | 12–16 | ~1.5 min |
| Context, CS & Close     | 17–20 | ~2 min   |

---

## Story Arc

**Akosua → the gap → what exists → what's broken → what I built → how it works → what the data says → what's next → Akosua again.**

Every slide earns its place. Talk *through* the slides, not *from* them — keep your eyes on the audience, not the screen.
