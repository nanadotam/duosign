# DuoSign Beta — October 2026 Improvements

Branch: `october-2026-improvements` (from `main` @ `28364ee`)
Date: 10 October 2026

## New
- **Motion (default).** The October `duosign-motion` engine now runs inside the DuoSign UI. Signs play from **baked motion clips**: 2,000 WLASL signs, plus HELLO and MOTHER baked from video with facial expression. Nothing is solved in the browser anymore, so signing starts almost instantly and blends smoothly from one sign to the next. Typing, voice input, gloss tokens, captions, play/pause, replay and speed all drive it.
  - Words without a clip are fingerspelled from the letter clips. **All 26 letters are covered now.** WLASL never had C, L, X, Y or Z, so those five were added from the ASL THAT alphabet video (1080p, timed from its captions; see `~/Developer/duosign-letters`). C is marked `needs_review`.
  - Face expressions are smoothed over 5 frames to hide tracking jitter.
  - The avatar stands in a natural arms-down pose instead of a T-pose.
  - Close-up, Full Body and 3D World camera presets.
  - **Motion / Avatar / Skeleton** toggle: "Avatar" is the classic engine, kept as a fallback.
- **Signer picker with thumbnails.** A row of portrait buttons (Ama, Kofi, Esi, DS Proto 2.2, DS Proto) sits right under the panel header. One click changes who is signing.
- **DuoSign Beta branding.** The nav bar shows **DuoSign** with a **BETA** pill. The page title is "DuoSign Beta — Text to Sign Language".
- **Open beta: full access, no account needed.** There is no guest translation cap, no remaining-translations banner and no sign-up prompt in the way. History, Settings and MP4 export all work for guests from this browser's local storage, so none of it depends on the database. `NEXT_PUBLIC_OPEN_BETA=false` brings back the 3-translation guest limit and the login wall on /history and /settings.
- **Green theme by default.** DuoSign Beta ships green as the default accent in both dark and light mode. You can still pick blue, teal, purple or orange in Settings.
- **New avatars.**
  - **Ama, Kofi, Esi**: semi-realistic Ghanaian avatars built in Blender with MakeHuman and CC0 assets. They have the full 52-bone humanoid rig and 52 ARKit face shapes, mapped to the VRM 0 expression presets (A/I/U/E/O, blink, joy, angry, sorrow, fun). **Ama is now the default avatar.**
  - **DS Proto 2.2**: the upgraded DS-Proto. Contrast went from 1.54 to 6.20 for easier-to-read hands, it gained an ARKit face, and it shrank from 19.9 MB to 5.8 MB.
  - The original avatars (DS Proto 2.1, Ashtra, Val, DS G Proto) are still available in the avatar picker.
- The Guide page avatar table lists the new models.

## Fixes and improvements
- **Guest translations no longer break when the database is unreachable.** `/api/guest-usage` used to return a 500, which showed "NaN translations" and blocked Translate. It now fails open with `degraded: true`.
- **Better VRM error logging.** Avatar load errors now print the full stack trace, so broken models are quick to diagnose.
- **DuoSign Beta keeps its own settings** (`duosign-pro:settings`). It starts on the beta defaults (green, Ama) without clobbering settings saved by the original DuoSign.

## Avatar pipeline (in `~/Developer/duosign-avatars`)
- `tools/export_vrm0.py` re-exports a built avatar `.blend` as **VRM 0.x**. The web app runs `@pixiv/three-vrm` 0.6, which can't read the VRM 1.0 builds. The script also maps ARKit shape keys to the VRM 0 presets.
- `tools/patch_vrm0_lookat.py` switches look-at to `BlendShape`. Avatars without eye bones crash three-vrm 0.6 when it's set to `Bone`.
- These exports are **uncompacted** (about 25 MB each). The sparse-morph compaction (`compact_vrm.py`) makes three.js r137 crash (`updateMorphTargets: reading 'name'`), so it isn't used for the web app until three is upgraded.

## Running locally
- Backend: `cd backend && .venv/bin/uvicorn api.main:app --port 8000` (Python 3.11 venv).
- Frontend: `cd frontend && npm run dev`, then open http://localhost:3000/translate.
- `bucket/` is a symlink to the pose/video bucket in Google Drive (gitignored).
- In local `.env` files, `SUPABASE_STORAGE_URL` is commented out so poses and videos come from the local bucket, and `BACKEND_URL` / `BETTER_AUTH_URL` point at localhost.

## Known issues
- **The Supabase project is unreachable** ("tenant/user not found"; it's probably paused on the free tier). This means **login/sign-up, history sync and Supabase storage don't work** until it's restored from the Supabase dashboard. Everything guest-facing works: translation, local history, settings and export.
- In **Motion**, Ama and Kofi were checked signing end to end in a headless browser. In the **classic Avatar** engine, the VRM 0 exports of Ama, Kofi and Esi load, but their KalidoKit motion hasn't been visually checked. Use Motion for demos.
- Motion loads three.js and three-vrm v3 from the jsDelivr CDN, so it needs internet. It runs in an iframe (`/motion/stage.html`) beside the app's older three r137 engine.
- Export video still uses the classic engine.
- Most clips come from 288×192 source video, so some signs will look rough. That's the data ceiling, not the player.
- Still ASL only.
