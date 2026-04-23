# DuoSign: Keynote-Style Presentation Deck

### English-to-ASL Translation via a 3D Signing Avatar

* [ ] 

---

> **How to use this file**
> Each slide block has: a **visual suggestion**, **on-slide text** (keep slides sparse — less is more!),
> **speaker script** (what you actually say), and a **footnote** (the one term the audience learns that slide).
> Timing targets are suggestions; flex by ±10 s.
> 🎯 = confidence tip | 📣 = delivery cue

---

---

## SLIDE 1 — COVER

**⏱ 0:00–0:15 | ~15 s**

### On-slide text

```
DuoSign
English → American Sign Language
via a 3D Signing Avatar

Nana Kwaku Amoako
Applied Project · Ashesi University · 2026
```

### Visual suggestion

Full-bleed dark background. The DuoSign logo centred, with a soft animated wave or subtle hand-shape silhouette behind it. White typography only.

### Speaker script

*(Stand still. Breathe. Make eye contact with the back row before you start.)*

> "Good morning. My name is Nana, and this is DuoSign."

*(Pause two full seconds. Let the title breathe.)*

---

> **Footnote — ASL:** American Sign Language — a complete, natural language with its own grammar, used primarily by the Deaf community in the United States and Canada.

---

---

## SLIDE 2 — THE HOOK: Open Google Translate

**⏱ 0:15–0:45 | ~30 s**

### On-slide text

```
Open Google Translate.
Type any sentence.
Now try to translate it into ASL.
```

*(Just three lines. Nothing else.)*

### Visual suggestion

A clean screenshot of Google Translate, cropped to show only the language-pair selector — with a conspicuous blank where "ASL" would be. Alternatively, a minimalist phone mockup with an empty language slot.

### Speaker script

> "Open Google Translate. Type any sentence — a greeting, a question, anything.
> Now try to translate it into Sign Language.
>
> You can't.
>
> Not because no one thought of it. Because it is genuinely, technically hard."

📣 Say "You can't." slowly. The pause is the punch line.

---

> **Footnote — Natural Language:** A language that evolved organically among humans (e.g., English, ASL), as opposed to a constructed or programming language.

---

---

## SLIDE 3 — THE SCALE

**⏱ 0:45–1:05 | ~20 s**

### On-slide text

```
430,000,000
people worldwide live with disabling hearing loss.

— WHO, 2026
```

### Visual suggestion

The number "430,000,000" displayed enormous, centred, in bold. Below it, a single thin line credit. Optional: a subtle world map silhouette behind the number.

### Speaker script

> "Four hundred and thirty million people worldwide live with disabling hearing loss.
> That is roughly four times the population of Germany.
> For many of them, sign language is their primary — sometimes only — language.
> And right now, the world's most powerful translation tools ignore that entirely."

*(World Health Organization, 2026)*

🎯 You have the citation locked. If anyone questions the number in Q&A, say: "That's from the WHO 2026 deafness fact sheet."

---

> **Footnote — Disabling hearing loss:** Defined by the WHO as hearing loss greater than 35 decibels in the better-hearing ear — the threshold that significantly impacts daily communication.

---

---

## SLIDE 4 — SIGN LANGUAGE IS A REAL LANGUAGE

**⏱ 1:05–1:25 | ~20 s**

### On-slide text

```
Sign language is not mime.
It is not a code for English.

It has phonology, syntax, and semantics —
entirely in 3D space.
```

### Visual suggestion

Side-by-side: a waveform (spoken English) on the left; a stylised hand-shape with spatial arrows on the right. Clean, diagrammatic.

### Speaker script

> "Before I go further — one misconception I want to destroy right now.
> Sign language is not mime. It is not a code for English.
>
> ASL has its own phonological structure, its own syntax, and its own semantics — described in peer-reviewed linguistics literature. Sandler (2012) showed that ASL has the same layers of organisation as spoken languages. It just happens to live entirely in three-dimensional space."

*(Sandler, 2012; Schlenker, 2024)*

---

> **Footnote — Phonology:** The study of the sound (or, in sign languages, the movement/shape/location) units of a language and how they pattern together.

---

---

## SLIDE 5 — THE AFRICAN CONTEXT

**⏱ 1:25–1:50 | ~25 s**

### On-slide text

```
Ghana has its own sign language: GhSL.

Resources: near zero.
Speakers: hundreds of thousands.
```

### Visual suggestion

A warm-toned map of West Africa with Ghana highlighted. A small flag icon. Contrasting stat block on the right.

### Speaker script

> "Now let me ground this in our context.
> Ghana has its own sign language — Ghanaian Sign Language, or GhSL.
> Nyst (2010) documented that West African nations each developed distinct, independent sign systems.
> But GhSL has almost no digital resources: no large corpus, no trained models, no translation tools.
>
> DuoSign uses ASL as the proof-of-concept — because ASL has the data.
> But every architectural decision I made was designed so that swapping to GhSL is a configuration change, not a rebuild."

*(Nyst, 2010)*

🎯 This is your "why it matters here" moment. Make eye contact with the panel.

---

> **Footnote — GhSL:** Ghanaian Sign Language — the primary sign language of Ghana's Deaf community, recognised as a distinct language from ASL, BSL, and other national sign languages.

---

---

## SLIDE 6 — INTRODUCING DUOSIGN

**⏱ 1:50–2:05 | ~15 s**

### On-slide text

```
DuoSign

Type or speak English →
Watch a 3D avatar sign it back.

Browser-native. No app to install.
```

### Visual suggestion

A clean product screenshot of the main translate page (Fig 4.4 from the paper). Show the input field, the avatar panel, and the animated signing output side-by-side.

### Speaker script

> "So what did I build?
>
> DuoSign is a web application — open any browser, no install required — where you type or speak English, and a 3D avatar signs the translation back to you in real time.
> Text in. Signing avatar out. That's the product."

📣 Keep this slide SHORT. The demo (coming later) will do the selling.

---

> **Footnote — Browser-native:** A web application that runs entirely inside a standard browser without requiring a plugin, native app install, or operating-system permissions.

---

---

## SLIDE 7 — THE RESEARCH QUESTION

**⏱ 2:05–2:20 | ~15 s**

### On-slide text

```
b
```

### Visual suggestion

Minimalist text slide. Single question. Dark background, large white sans-serif font. No bullet points.

### Speaker script

> "This entire project was designed to answer one question:
>
> Can a browser-based system produce linguistically accurate, accessible, real-time ASL output — without specialised hardware?
>
> No gloves. No depth sensors. Just a laptop and a browser."

🎯 Deliver this question slowly and clearly. It frames everything that follows.

---

> **Footnote — Specialised hardware:** Devices like data gloves, depth cameras (e.g., Microsoft Kinect), or motion-capture suits previously required for sign language capture/synthesis — expensive and non-portable.

---

---

## SLIDE 8 — WHAT CAME BEFORE

**⏱ 2:20–2:40 | ~20 s**

### On-slide text

```
Existing tools:
• Desktop-only or app-based
• No open ASL datasets large enough to train on
• Avatar quality: low-polygon, uncanny
• No African sign language support

(Moryossef et al., 2023)
```

### Visual suggestion

A simple 2×2 comparison table: "Existing Tools" vs "DuoSign" across two axes: Accessibility and Linguistic Quality. Red circles for existing; green checkmarks for DuoSign.

### Speaker script

> "I reviewed the SignMT benchmark from Moryossef et al. (2023) — the most comprehensive evaluation of sign language machine translation to date.
> The state of the art had real gaps: desktop-only deployment, uncanny avatar rendering, limited datasets, and zero support for African sign languages.
>
> DuoSign was designed to address each of those gaps directly."

*(Moryossef et al., 2023)*

---

> **Footnote — SignMT:** Sign Language Machine Translation — the research subfield focused on automatically translating spoken/written language into sign language (or vice versa).

---

---

## SLIDE 9 — WHAT ARE GLOSSES?

**⏱ 2:40–3:05 | ~25 s**

### On-slide text

```
English:   "I am going to the store tomorrow."

ASL Gloss: TOMORROW STORE IX-1 GO

Rules:
• Time first   • Articles dropped
• Pronouns → IX markers   • Copulas dropped
```

### Visual suggestion

Two rows, colour-coded: English in grey, Gloss in teal/blue. Arrows connecting corresponding words. The transformation rules shown below as a small legend.

### Speaker script

> "Here is one of the most important ideas in the whole presentation — glosses.
>
> ASL is not English signed word-by-word. It has a different grammar. To write ASL down, linguists use a notation system called glosses — uppercase tokens, one per sign.
>
> Watch what happens to the sentence 'I am going to the store tomorrow.'
> In ASL Gloss: TOMORROW STORE IX-1 GO.
>
> The time expression jumps to the front. 'I' becomes a pointing pronoun, IX-1. 'Am' and 'the' disappear — ASL does not use copulas or articles.
>
> My system converts English to exactly this representation, then maps each gloss token to a pre-recorded sign."

---

> **Footnote — Gloss:** A written notation for sign language using uppercase English words, each representing a single sign. Glosses capture ASL grammar, not English grammar.

---

---

## SLIDE 10 — THE IX MARKERS

**⏱ 3:05–3:20 | ~15 s**

### On-slide text

```
ASL Pronouns are spatial, not verbal.

I    → IX-1  (point to self)
You  → IX-2  (point toward listener)
He/She → IX-3 (point to established space)
```

### Visual suggestion

A simple diagram: a person standing in space, with arrows pointing at three locations. Each arrow labelled with the IX marker.

### Speaker script

> "A quick note on those IX markers — they are not arbitrary codes.
> In ASL, pronouns are directional: you physically point to where a person has been 'placed' in signing space.
> IX-1 is always toward yourself. IX-2 toward your listener. IX-3 toward a previously established location.
> My system tracks referents across a sentence to assign these correctly."

---

> **Footnote — Spatial Grammar:** The use of physical space — direction, location, and movement — to encode grammatical relationships in sign languages, replacing spoken inflection.

---

---

## SLIDE 11 — SYSTEM OVERVIEW (C4 LEVEL 1)

**⏱ 3:20–3:40 | ~20 s**

### On-slide text

```
[User]
  ↓ types / speaks
[DuoSign Web App]
  ↓ NLP pipeline
[FastAPI Backend]  ←→  [Groq AI]
  ↓ video data
[Supabase Storage]
```

### Visual suggestion

The C4 Level 1 Context diagram from the paper (Fig 3.1). Keep it clean: three external systems (User, Groq, Supabase) plus the main DuoSign system box. Use the actual diagram if available; otherwise a clean reimplementation.

### Speaker script

> "Let me show you how everything fits together.
> The user types or speaks. The Next.js frontend captures that and streams it to a FastAPI backend.
> The backend runs the NLP pipeline, fetches sign video data from Supabase, and uses Groq for audio transcription and LLM fallback.
> Results stream back via Server-Sent Events — progressively, word by word."

---

> **Footnote — C4 Model:** A hierarchical architecture documentation standard (Context → Container → Component → Code) that gives different audiences the right level of detail.

---

---

## SLIDE 12 — CONTAINER ARCHITECTURE (C4 LEVEL 2)

**⏱ 3:40–4:00 | ~20 s**

### On-slide text

```
Next.js Frontend    →    FastAPI Backend
(Vercel)                 (Render · Python)
    ↓                         ↓
Supabase DB          Supabase Storage
(PostgreSQL)           (100 GB · CDN)
```

### Visual suggestion

The Container diagram from Fig 3.2. Four clean boxes with arrows. Hosting labels underneath each. Colour-code by concern: blue = frontend, orange = backend, green = storage.

### Speaker script

> "Zooming in one level: two main deployable units.
> A Next.js frontend on Vercel — free tier for students, worldwide CDN.
> A FastAPI Python backend on Render — the NLP-heavy work that can't live in the browser.
> Both talking to Supabase: a PostgreSQL database for user data and a 100-gigabyte object store for sign video files."

---

> **Footnote — CDN:** Content Delivery Network — a geographically distributed network of servers that caches static assets near users to reduce latency.

---

---

## SLIDE 13 — FRONTEND ARCHITECTURE: FEATURE-SLICED DESIGN

**⏱ 4:00–4:15 | ~15 s**

### On-slide text

```
FSD layers (top → bottom):
app → widgets → features → entities → shared

Each layer depends only on layers below it.
No circular imports. Ever.
```

### Visual suggestion

A vertical stack diagram of the five FSD layers, each as a coloured band. A downward arrow on the side labelled "dependency direction."

### Speaker script

> "The frontend uses Feature-Sliced Design — a strict architectural pattern where code is organised by what it does, not what it is.
> The key rule: each layer can only import from layers below it. No circular dependencies. This kept the codebase clean across a 9-month solo project."

---

> **Footnote — Feature-Sliced Design (FSD):** A frontend architecture methodology that organises code into domain-oriented slices (feature, entity, widget) with a strict one-directional dependency rule.

---

---

## SLIDE 14 — THE TRANSLATION PIPELINE

**⏱ 4:15–4:45 | ~30 s**

### On-slide text

```
English text
     ↓  spaCy NLP
ASL Gloss tokens
     ↓  WLASL lookup
Sign video clips
     ↓  MediaPipe
Pose landmarks (75 joints)
     ↓  Kalidokit
VRM bone rotations
     ↓  Three.js
60 FPS 3D avatar
```

### Visual suggestion

A vertical pipeline diagram. Each step as a labelled box, connected by arrows. Colour the steps in groups: NLP (blue), data (green), vision (orange), rendering (purple).

### Speaker script

> "This is the core contribution — the translation pipeline.
>
> Step one: spaCy converts English text to ASL gloss tokens.
> Step two: each gloss is looked up in the WLASL corpus — 11,980 pre-recorded sign videos.
> Step three: MediaPipe extracts 75 joint landmarks from each video frame.
> Step four: Kalidokit converts those landmarks to bone rotations the 3D avatar can use.
> Step five: Three.js renders the avatar at 60 frames per second — in the browser, no plugin needed.
>
> Five steps. One continuous pipeline."

---

> **Footnote — Pipeline:** In software, a pipeline is a sequence of processing stages where the output of each stage is the input to the next, enabling complex transformations to be broken into manageable steps.

---

---

## SLIDE 15 — SPACY: ENGLISH TO GLOSS

**⏱ 4:45–5:00 | ~15 s**

### On-slide text

```
Rule-based NLP (spaCy):
1. Tokenise and POS-tag input
2. Identify time expressions → front
3. Reorder SVO → SOV
4. Drop articles, copulas, prepositions
5. Resolve pronouns → IX markers

Latency: 2.5 ms average
```

### Visual suggestion

A code-style snippet showing the before/after gloss conversion (similar to Fig 4.2 in the paper). Monospace font, syntax-highlighted.

### Speaker script

> "The gloss conversion is rule-based, not neural. That was a deliberate decision.
> A neural model needs tens of thousands of training examples we do not have.
> Rule-based spaCy runs in 2.5 milliseconds on average and can be audited line by line.
> Every transformation is an explicit linguistic rule derived from ASL grammar literature."

🎯 "Deliberate decision" shows engineering maturity. Say it confidently.

---

> **Footnote — POS Tagging:** Part-of-Speech Tagging — labelling each word in a sentence as a noun, verb, adjective, etc. Used here to identify which words should be dropped or reordered in ASL grammar.

---

---

## SLIDE 16 — THE WLASL CORPUS

**⏱ 5:00–5:15 | ~15 s**

### On-slide text

```
WLASL — Word-Level American Sign Language

11,980 sign videos
2,000+ unique signs
Native Deaf signers

(Li et al., 2019)
```

### Visual suggestion

A grid of small video thumbnail frames (blurred/placeholder if you don't have the actual thumbnails) with a large number "11,980" overlaid. Clean, magazine-style layout.

### Speaker script

> "Where do the signs come from?
> The WLASL corpus — Word-Level American Sign Language — 11,980 videos of native Deaf signers, covering over 2,000 unique words.
> This is the largest publicly available ASL word-level dataset.
> I pre-processed the entire corpus — 76 minutes of extraction time at 2.6 videos per second — to generate the pose landmark database."

*(Li et al., 2019)*

---

> **Footnote — Corpus:** In linguistics and NLP, a corpus (plural: corpora) is a large structured collection of text or media used for analysis, training, or reference.

---

---

## SLIDE 17 — MEDIAPIPE: SEEING THE BODY

**⏱ 5:15–5:30 | ~15 s**

### On-slide text

```
MediaPipe Tasks Vision (WebAssembly)

33 body landmarks
+ 21 left hand landmarks
+ 21 right hand landmarks

= 75 joints tracked per frame
```

### Visual suggestion

A MediaPipe skeleton overlay on a signer — the green dots connected by lines. Either a screenshot from the paper (Fig 3.5 pose playback) or an illustrative diagram.

### Speaker script

> "To animate the avatar, I need to know what every joint is doing, every frame.
> MediaPipe Tasks Vision — running as WebAssembly in the browser — extracts 75 landmarks per frame: 33 body points, 21 per hand.
> This runs locally. No sign video ever leaves the user's browser during playback."

---

> **Footnote — WebAssembly (Wasm):** A binary instruction format that lets high-performance code (originally written in C++ or Rust) run inside a browser at near-native speed.

---

---

## SLIDE 18 — KALIDOKIT: LANDMARKS TO BONES

**⏱ 5:30–5:45 | ~15 s**

### On-slide text

```
MediaPipe landmarks → joint coordinates (2D/3D)
          ↓  Kalidokit
VRM bone rotation quaternions

Bridge between vision and rendering.
```

### Visual suggestion

A simple two-box diagram: "MediaPipe (x, y, z coords)" → "Kalidokit" → "VRM (bone rotations)". The centre "Kalidokit" box in a contrasting highlight colour.

### Speaker script

> "MediaPipe gives me coordinates. The 3D avatar needs rotation angles for each bone.
> Kalidokit is the bridge — an open-source library that solves the inverse kinematics problem, converting landmark positions into the quaternion rotations VRM avatars understand.
> Without Kalidokit, I would have spent three months writing biomechanical solvers. Instead, I spent three days integrating and tuning it."

---

> **Footnote — Quaternion:** A mathematical representation of 3D rotation using four numbers (w, x, y, z) that avoids gimbal lock — preferred over Euler angles for smooth 3D animation.

---

---

## SLIDE 19 — THE 3D AVATAR (VRM)

**⏱ 5:45–6:00 | ~15 s**

### On-slide text

```
VRM — Virtual Reality Model format

Humanoid rig standard
Rendered via Three.js in browser
60 frames per second

No install. No plugin.
```

### Visual suggestion

A full screenshot of the DuoSign avatar panel (Fig 4.4 or 4.7 from the paper). The avatar mid-sign, clearly showing hand and body posture. Cropped tightly to the avatar viewport.

### Speaker script

> "The end result: a VRM avatar — the humanoid rig format popular in the Japanese virtual YouTuber community, adapted here for accessibility.
> Three.js renders it in the browser at 60 frames per second.
> On a 2021 MacBook Air, average frame time stays under 16 milliseconds."

---

> **Footnote — VRM:** An open 3D avatar format (vrm.dev) built on glTF, designed for humanoid characters. Defines a standard bone hierarchy that maps naturally to human anatomy.

---

---

## SLIDE 20 — AVATAR STATE MACHINE

**⏱ 6:00–6:15 | ~15 s**

### On-slide text

```
States:
IDLE → LOADING → SIGNING → IDLE

Transitions driven by:
• Token queue
• Playback completion events
• Error / unknown gloss fallback
```

### Visual suggestion

A state-machine diagram (from Fig 2.5 in the paper): three circles (IDLE, LOADING, SIGNING) with labelled transition arrows. Clean, minimal.

### Speaker script

> "The avatar is controlled by a finite state machine.
> It starts IDLE, transitions to LOADING while fetching pose data, then SIGNING as it plays each token back-to-back.
> If a gloss is not found in the WLASL corpus, the system falls back gracefully — spelling it out fingerspelled, or skipping with a notification — rather than crashing."

---

> **Footnote — Finite State Machine (FSM):** A computational model with a fixed set of states, transitions triggered by events, and one active state at a time. Useful for modelling sequential user-interface behaviour.

---

---

## SLIDE 21 — STREAMING: SERVER-SENT EVENTS

**⏱ 6:15–6:28 | ~13 s**

### On-slide text

```
English input → SSE stream → avatar signs token-by-token

No waiting for the full sentence.
Progressive. Real-time feel.
```

### Visual suggestion

A timeline diagram: input at the left, tokens arriving progressively along a horizontal time axis, each one triggering an avatar animation segment. Simple and clean.

### Speaker script

> "One UX detail I'm proud of: the avatar starts signing before the full translation is done.
> Server-Sent Events push each gloss token as soon as it's computed.
> The avatar queues and plays them in sequence. Users see motion immediately — not a loading spinner."

---

> **Footnote — SSE (Server-Sent Events):** A one-directional HTTP streaming protocol where the server pushes data to the client as it becomes available, without polling or a full WebSocket handshake.

---

---

## SLIDE 22 — VIDEO EXPORT

**⏱ 6:28–6:43 | ~15 s**

### On-slide text

```
Export pipeline:
Browser  → MediaRecorder (WebM) → Chrome/Firefox/Edge
Browser  → JPEG frame array    → Safari/iOS fallback
Server   → FFmpeg (H.264 MP4)  → 1280 × 720
Supabase → CDN-cached download link
```

### Visual suggestion

A branching flowchart: two paths (MediaRecorder vs JPEG fallback) converging at FFmpeg, then to Supabase. Browser icons at the start of each branch.

### Speaker script

> "Users can export the signed animation as a video — useful for sharing.
> Chrome, Firefox, and Edge use the MediaRecorder API to capture WebM directly.
> Safari — because Safari — does not support MediaRecorder on canvas, so iOS gets a JPEG frame-array fallback sent to the server.
> FFmpeg encodes both paths to H.264 MP4 at 720p, stored in Supabase, and returned as a CDN-backed download link."

---

> **Footnote — H.264:** A widely supported video compression standard (also called AVC) that achieves high quality at low file sizes, compatible with virtually all browsers and devices.

---

---

## SLIDE 23 — ACCESSIBILITY: WCAG 2.1 AA

**⏱ 6:43–6:58 | ~15 s**

### On-slide text

```
Lighthouse Accessibility Score: 100 / 100

✓ Keyboard-navigable
✓ ARIA labels on all interactive elements
✓ Colour contrast ≥ 4.5:1 throughout
✓ Screen-reader compatible
✓ Reduced-motion support
```

### Visual suggestion

A large "100" in a green circle (Lighthouse score badge style). Below it, the five checkmarks in a clean list. Screenshot of the Lighthouse audit panel as a subtle background.

### Speaker script

> "Building an accessibility tool that is itself inaccessible would be embarrassing.
> DuoSign scores 100 out of 100 on Google Lighthouse's accessibility audit.
> Every interactive element has an ARIA label. The entire app is navigable by keyboard alone.
> Colour contrast meets WCAG 2.1 AA minimums everywhere. Reduced-motion mode respects the prefers-reduced-motion media query."

---

> **Footnote — WCAG 2.1 AA:** Web Content Accessibility Guidelines version 2.1, Level AA — the internationally recognised standard for web accessibility, covering contrast, keyboard access, screen-reader compatibility, and more.

---

---

## SLIDE 24 — SECURITY DECISIONS

**⏱ 6:58–7:10 | ~12 s**

### On-slide text

```
Auth:     JWT in httpOnly cookies (no XSS exposure)
Passwords: bcrypt, minimum 12 rounds
History:  100-entry FIFO cap (no unbounded storage)
Transport: HTTPS everywhere
```

### Visual suggestion

Four horizontal rows, each with an icon (lock, shield, clock, globe) and one line of text. Dark background, accent-colour icons.

### Speaker script

> "Security is not glamorous, but it matters.
> JWTs stored in httpOnly cookies cannot be read by JavaScript — XSS-proof by design.
> Passwords are hashed with bcrypt at 12 rounds.
> Translation history is capped at 100 entries per user with FIFO eviction — no unlimited data accumulation."

---

> **Footnote — httpOnly Cookie:** A cookie flag that prevents JavaScript from accessing the cookie's value, protecting authentication tokens from cross-site scripting (XSS) attacks.

---

---

## SLIDE 25 — TESTING: 124 / 124

**⏱ 7:10–7:25 | ~15 s**

### On-slide text

```
124 automated tests.
124 passing.
0 failing.

Unit · Integration · End-to-End
```

### Visual suggestion

A test runner output screenshot (green checkmarks). Alternatively, three large numbers side by side: "124 | 124 | 0" in green, green, and a greyed-out zero.

### Speaker script

> "Let me talk about testing.
> 124 automated tests — unit tests for the gloss conversion algorithms, integration tests for the API endpoints, and end-to-end tests simulating real user flows.
> 124 pass. Zero fail.
>
> Every requirement from the specification has a corresponding test. This is not aspirational — it is in the appendix."

🎯 Say "it is in the appendix" with calm confidence. It signals rigour.

---

> **Footnote — End-to-End Test:** A test that simulates a full user journey through the system — from input to output — verifying that all components work together correctly.

---

---

## SLIDE 26 — PILOT STUDY: WHO DID I TEST WITH?

**⏱ 7:25–7:38 | ~13 s**

### On-slide text

```
Pilot study participants:
• ASL practitioners (expert reviewers)
• Hearing users unfamiliar with ASL

Method: task-based observation + open-ended survey
(No SUS scores — we collected richer qualitative data)
```

### Visual suggestion

Two persona icons: one labelled "ASL Expert" with a hands-signing icon; one labelled "Hearing User" with a headphones icon. Clean, illustrative.

### Speaker script

> "Beyond automated tests, I ran a pilot study with two groups: ASL practitioners who could evaluate linguistic accuracy, and hearing users experiencing ASL for the first time.
> I deliberately avoided rigid usability scores in favour of open-ended qualitative responses — richer signal for a novel interface like this."

---

> **Footnote — Pilot Study:** A small-scale preliminary study conducted before a larger evaluation to test methodology, refine questions, and surface early usability issues.

---

---

## SLIDE 27 — WHAT USERS SAID

**⏱ 7:38–7:55 | ~17 s**

### On-slide text

```
60% would use DuoSign regularly.

"The avatar motion felt natural for common signs."

Expert finding:
Practitioners relied on the 2D skeleton overlay
more than the 3D avatar for precision verification.
```

### Visual suggestion

A pull-quote card design: the 60% stat large and prominent; the user quote in a speech-bubble style card below; the expert finding in a contrasting-colour callout box.

### Speaker script

> "The headline number: 60% of pilot participants said they would use DuoSign regularly.
> For a first prototype, that is a meaningful signal.
>
> But the most interesting finding came from the ASL experts.
> They instinctively turned to the 2D skeleton overlay — the MediaPipe wireframe — to verify sign precision, rather than the polished 3D avatar.
> That tells me the avatar quality is the next frontier."

📣 Don't apologise for the finding. "That tells me" shows you interpret results, not just report them.

---

> **Footnote — 2D Skeleton Overlay:** A wireframe visualisation of detected body and hand landmarks drawn on a flat (2D) canvas, useful for precise joint-position verification independent of avatar rendering.

---

---

## SLIDE 28 — THE AVATAR IS THE HARDEST PROBLEM

**⏱ 7:55–8:10 | ~15 s**

### On-slide text

```
Signing is not just hand shapes.
It is movement path, timing, facial expression,
mouth morpheme, eyebrow grammar.

DuoSign Version 1: hands + body.
Missing: the face.
```

### Visual suggestion

Split image: left side shows a signing person's face with expressive eyebrows and mouth (emphasising what DuoSign *doesn't* capture); right side shows the DuoSign avatar (neutral face). The gap is the story.

### Speaker script

> "Here is the honest limitation.
> In ASL, facial expressions are not emotional decoration — they are grammatical. Eyebrow position marks questions. Mouth morphemes modify meaning. Cheek puffing indicates size.
> DuoSign Version 1 animates hands and body. The face is neutral.
> This is a known gap in the literature too — facial grammar is the hardest part of sign language synthesis."

---

> **Footnote — Mouth Morpheme:** In ASL, a specific mouth movement or shape that accompanies a sign to modify its meaning (e.g., "cha" for large, "mm" for normally/relaxed) — distinct from mouthing English words.

---

---

## SLIDE 29 — WHAT COMES NEXT: GhSL

**⏱ 8:10–8:25 | ~15 s**

### On-slide text

```
DuoSign → GhSL Edition

Required: a labelled GhSL video corpus
Architecture: already modular — swap WLASL for GhSL data
NLP rules: update for GhSL grammar

This is NFR018 in the specification.
```

### Visual suggestion

The system pipeline diagram from Slide 14, but with "WLASL" replaced by "GhSL Corpus" in the data step — highlighted with an arrow and a Ghanaian flag emoji. Simple, hopeful, actionable.

### Speaker script

> "The most important future direction is Ghanaian Sign Language.
> GhSL localisation is explicitly written into the specification as non-functional requirement NFR018.
> The architecture is already modular: the WLASL video database is a pluggable component. Swap in a GhSL corpus and 90% of the system works unchanged.
> The missing piece is the corpus itself — and that is a community project, not a software project."

---

> **Footnote — Non-Functional Requirement (NFR):** A system requirement that specifies *how* the system performs rather than *what* it does — covering extensibility, performance, accessibility, and security.

---

---

## SLIDE 30 — FUTURE WORK: THE ROADMAP

**⏱ 8:25–8:35 | ~10 s**

### On-slide text

```
v1 → v2 priorities:
1. Facial grammar synthesis
2. LLM-powered context-aware gloss generation
3. GhSL corpus partnership with Ghana School for the Deaf
4. Mobile PWA
```

### Visual suggestion

A simple numbered list in a clean roadmap style. Optional: a subtle progress timeline bar showing "v1 ✓" and "v2 →" ahead.

### Speaker script

> "Four clear next steps: facial animation, smarter gloss generation using LLMs, a GhSL corpus partnership, and a Progressive Web App for mobile-first access.
> Each of these is scoped and technically grounded. This is not wishful thinking."

---

> **Footnote — PWA (Progressive Web App):** A web application that can be installed on a device home screen, works offline, and behaves like a native app — without going through an app store.

---

---

## SLIDE 31 — LESSONS LEARNED

**⏱ 8:35–8:45 | ~10 s**

### On-slide text

```
Build for the community, not the demo.
Test your assumptions early — especially about avatar fidelity.
Modular architecture is not premature optimisation. It is respect for the future.
```

### Visual suggestion

Three sentences, each on its own line, full-bleed slide, large typography. No bullets. No headers. Just the words.

### Speaker script

> "Three things I would tell myself at the start of this project.
>
> Build for the community, not the demo.
> Test your avatar assumptions early — I wish I had done a signing expert review in month two, not month eight.
> And modular architecture is not premature — it is respect for the future users you cannot see yet."

🎯 Personal. Honest. This is the moment the panel remembers.

---

> **Footnote — Modular Architecture:** A design approach where a system is composed of interchangeable, self-contained modules — making components easier to replace, extend, or test independently.

---

---

## SLIDE 32 — ACKNOWLEDGEMENTS

**⏱ 8:45–8:52 | ~7 s**

### On-slide text

```
Supervisor: [your supervisor's name]
Ashesi University Department of Computer Science
The Deaf community — for the language that made this necessary
```

### Visual suggestion

Warm, simple text slide. Ashesi colours. A small hand-shape or wave graphic in the corner.

### Speaker script

> "Thank you to my supervisor, to the Ashesi CS department, and most importantly to the Deaf community — whose language and whose daily experience of being excluded from digital tools is the reason this project exists."

📣 Say this slowly and genuinely. The panel will feel it.

---

> **Footnote — Deaf community:** A cultural and linguistic community defined by shared use of sign language, often capitalised as "Deaf" (with a capital D) to emphasise cultural identity rather than audiological condition.

---

---

## SLIDE 33 — REFERENCES (SELECTED)

**⏱ Not read aloud — displayed briefly or skipped**

### On-slide text

```
Key references (APA 7th ed.):

Li, D., Rodriguez, C., Yu, X., & Li, H. (2019). Word-level deep sign language recognition
  from video: A new large-scale dataset and methods comparison. Proceedings of WACV 2020.

Moryossef, A., et al. (2023). Evaluating the state of sign language machine translation
  systems. Findings of the Association for Computational Linguistics: EMNLP 2023.

Nyst, V. (2010). Sign languages in West Africa. In D. Brentari (Ed.), Sign Languages
  (pp. 405–432). Cambridge University Press.

Sandler, W. (2012). The phonological organisation of sign languages. Language and
  Linguistics Compass, 6(3), 162–182.

Schlenker, P. (2024). Sign language semantics. Annual Review of Linguistics, 10, 1–28.

World Health Organization. (2026). Deafness and hearing loss: Key facts.
  https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss
```

### Visual suggestion

Reference list slide — display only if required by your institution. Otherwise replace with the closing slide and hand out the full list.

### Speaker script

*(No script — skip or say: "Full references are in the written paper.")*

---

> **Footnote — APA 7th Edition:** The citation style published by the American Psychological Association, commonly used in social sciences and increasingly in CS capstone work.

---

---

## SLIDE 34 — THE ANSWER

**⏱ 8:52–9:00 | ~8 s**

### On-slide text

```
Can a browser-based system produce
linguistically accurate, accessible,
real-time ASL output —
without specialised hardware?

Yes.
```

### Visual suggestion

Return to the research question from Slide 7 — exact same design — but with a single word added below in a large, confident typeface: **Yes.**

### Speaker script

> "Remember the question I asked at the start?
>
> Yes.
>
> DuoSign answers it. Not perfectly. But clearly, demonstrably, yes."

📣 Say "Yes." and stop. Do not add anything. The silence is the close.

---

> **Footnote — Proof of Concept:** A working demonstration that a proposed solution is feasible, without necessarily being production-ready or fully optimised.

---

---

## SLIDE 35 — CLOSING / Q&A

**⏱ 9:00 | Final frame**

### On-slide text

```
DuoSign

Thank you.

[QR code linking to live demo]
Questions?
```

### Visual suggestion

Return to the cover aesthetic: full-bleed dark background, DuoSign logo, warm light. A QR code to the live deployment (your Vercel URL). Your email or GitHub handle in small type at the bottom.

### Speaker script

> "DuoSign is live. You can try it right now by scanning that code.
>
> Thank you."

*(Smile. Step back slightly. Let them come to you with questions.)*

🎯 For Q&A: if you don't know an answer, say "That's a great question — I'd want to check the literature before answering definitively, but my current thinking is..." Never bluff. The panel respects intellectual honesty far more than false confidence.

---

> **Footnote — Live Demo:** A working deployment of the application accessible to anyone with the URL — distinct from a recorded demo video, which cannot respond to real-time audience interaction.

---

---

# PRESENTER CONFIDENCE GUIDE

## Your strongest cards — play them

| Fact                     | Why it lands                                         |
| ------------------------ | ---------------------------------------------------- |
| 124/124 tests passing    | Shows discipline. Cite the appendix.                 |
| Lighthouse 100/100       | Objective third-party verification.                  |
| 11,980 videos processed  | Scale. Real engineering effort.                      |
| 2.5 ms gloss latency     | Deliberate architectural choice, not luck.           |
| 60% would use regularly  | User validation from real pilot.                     |
| NFR018 written into spec | Future-proofing is*intentional*, not aspirational. |

---

## Anticipated Q&A and how to handle it

**Q: Why rule-based NLP instead of a neural model?**

> "Two reasons: data scarcity and auditability. There is no paired English–ASL gloss corpus large enough to train a reliable neural model at this scale. And rule-based systems let me trace exactly why any given output was produced — critical for a linguistic accuracy claim."

**Q: How accurate is the gloss conversion?**

> "The pilot study with ASL practitioners provided qualitative feedback; formal WER/BLEU-score evaluation against a gold-standard gloss corpus is future work. That's an honest gap in the current evaluation."

**Q: Why ASL and not GhSL from the start?**

> "WLASL is the only large publicly available sign video corpus in the world. GhSL has no equivalent dataset yet. ASL was the only viable proof-of-concept path. The architecture was designed from day one to swap in GhSL — that's NFR018."

**Q: Does this work in real time?**

> "The gloss conversion runs in ~2.5 ms. The avatar renders at 60 FPS. The bottleneck is WLASL video fetch latency from Supabase — mitigated by CDN caching. For short sentences, users see the first sign within under a second."

**Q: What happens when a word isn't in WLASL?**

> "Graceful degradation: the system fingerspells unknown words using the ASL manual alphabet, or skips with a visible notification. It never crashes silently."

**Q: Is this accessible to Deaf users, not just hearing users?**

> "Great question. The primary intended users are hearing people wanting to learn or communicate — a bridge tool, not a replacement for human interpreters. Deaf users provided expert review, which surfaced the avatar fidelity gap. Interpreter-quality output is a future research milestone."

---

## Timing cheat sheet (9 minutes)

| Section                                 | Slides | Time       |
| --------------------------------------- | ------ | ---------- |
| Hook + problem                          | 1–3   | 0:00–1:05 |
| Background (sign language, Africa)      | 4–5   | 1:05–1:50 |
| Product intro + research Q              | 6–7   | 1:50–2:20 |
| Related work                            | 8      | 2:20–2:40 |
| Glosses deep dive                       | 9–10  | 2:40–3:20 |
| Architecture                            | 11–13 | 3:20–4:15 |
| Translation pipeline                    | 14–21 | 4:15–6:15 |
| Video export + accessibility + security | 22–24 | 6:15–7:10 |
| Testing + user study                    | 25–28 | 7:10–8:10 |
| Future + lessons                        | 29–31 | 8:10–8:45 |
| Close                                   | 32–35 | 8:45–9:00 |

**Rule of thumb:** if you're at Slide 14 and the clock shows 5:00, you're perfect.

---

## Physical delivery tips

- **Posture:** Feet shoulder-width apart. Do not sway or rock.
- **Hands:** Let them gesture naturally. Don't grip the podium.
- **Eye contact:** Pick three spots in the room (left, centre, right) and rotate. Don't stare at the slides.
- **Pauses:** A 2-second pause feels like 10 seconds to you and feels natural to the audience. Use them deliberately after key lines ("You can't." / "Yes.").
- **Speed:** You will speak faster when nervous. Put a sticky note on your notes that says **SLOW DOWN**.
- **Water:** Have a glass. Sipping is not weakness — it's pacing.
- **If you lose your place:** Look at the slide, say "Let me make sure I say this clearly," and take a breath. The audience will not know.

---

## Final pep talk

You built a working system. You read the literature. You ran real tests with real users. You wrote 11,980 video files worth of processing into an avatar that signs in a browser.

The panel is not trying to fail you — they are trying to understand what you built. Help them understand it. You know this better than anyone in that room.

Own it.

---

*Generated for DuoSign Applied Project 2026 · Ashesi University*
*All statistics and claims sourced from: Amoako, N. K. (2026). DuoSign: An English-to-ASL Translation Web Application. Applied Project Report, Ashesi University.*
