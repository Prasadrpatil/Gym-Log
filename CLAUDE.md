# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains two independent Create React App projects, each packaged as an Android APK via Capacitor:

- `gymlog-app/` — the actual GymLog workout tracker. App logic lives under `gymlog-app/src/`, split by concern (see Architecture below) rather than in one file.
- `gymlog-keygen/` — a companion license-key generator app used to produce unlock tokens for GymLog. Its source is `gymlog-keygen/App.js`, which is duplicated verbatim into `gymlog-keygen/keygen-react/src/App.js` by the build script (see below). **Edit `gymlog-keygen/App.js`, not the copy inside `keygen-react/`** — the build script overwrites the copy on every run.

Both `gymlog-app/` and `gymlog-keygen/keygen-react/` are standard CRA scaffolds (created by `npx create-react-app`) with Capacitor's Android platform added; the CRA boilerplate files (`public/`, `src/index.js`, `src/setupTests.js`, etc.) are not hand-maintained.

## Common commands

Run from inside `gymlog-app/` (or `gymlog-keygen/keygen-react/` for the keygen app):

```
npm start          # dev server at localhost:3000
npm test           # CRA/Jest test runner, interactive watch mode
npm run build      # production build to build/
```

There is no lint script beyond CRA's built-in `eslint-config-react-app` (runs automatically during `npm start`/`npm run build`).

### Building the Android APK

APK builds are driven by top-level shell scripts, not by editing inside the CRA project directly:

- `./build-gymlog.sh` — builds the GymLog APK **in place from this repo's `gymlog-app/`** (no scaffolded copy elsewhere). It runs `npm install`, `npm run build`, adds/syncs the Capacitor `android/` platform (gitignored, not committed — added fresh on first run), patches `AndroidManifest.xml` for camera permission, and runs `gradlew assembleDebug`. Output: `GymLog.apk` at the repo root.
- `gymlog-keygen/build-keygen.sh` — builds the KeyGen APK from `gymlog-keygen/App.js` into `gymlog-keygen/keygen-react/`, then runs the same Capacitor/Gradle pipeline. Output: `gymlog-keygen/GymLogKeyGen.apk`.

Both scripts assume Java 21 (`/usr/lib/jvm/java-21-openjdk-amd64`) and an Android SDK at `~/Android/Sdk`, and require an already-added Capacitor `android/` platform to patch. These are one-shot local build scripts (not CI) — only run them when explicitly asked to produce an APK.

## Architecture (gymlog-app/src/)

The app was originally one ~3300-line `App.js`; it's now split by concern. Layout:

```
src/
  App.js                    - root component: all state, mutations, derived values; renders LockScreen or AppShell
  context.js                 - AppCtx / useApp()
  theme.js                    - C (colors), T (font), shared style tokens (hdr, crd, inp, btn, dBtn, mTtl, …)
  dataModel.js                 - DEFAULT_MUSCLES, makeExercises, initData, purgeEmptySessions, getAllSessions, groupByDay, STORAGE_KEY
  dates.js                      - localISO, parseISO, fmtDate, shortDate
  validation.js                  - validReps, toReps, toWeight
  id.js                            - uid()
  license.js                        - LOCK_KEY, GYMLOG_SECRET, hmacSign, getUnlockExp/saveUnlockExp, isUnlocked, parseToken
  audio.js                           - primeAudio, playRing (rest-timer chime)
  muscleColors.js                     - MUSCLE_COLORS, getMuscleColor
  hooks/useScrollVisible.js
  components/
    AppShell.js                        - top-level render switch (sidebar/modals/wizard/screen)
    Home.js, DayDetail.js, ExerciseHistory.js, ExerciseDetail.js, LockScreen.js  - screens
    Sidebar.js, Wizard.js, SetsLogger.js, TimerBar.js, CalendarOverlay.js
    AnatomyModal.js, BodyWeightModal.js, StepsGraphModal.js                     - full-screen overlays
    SetList.js, StatsBar.js, SectionHeader.js, MuscleIcon.js, FloatBtn.js, Wrap.js
    modals/  - NameModal, EditExModal, SetModal, SuperExSearch, EditSetModal,
               BackupModal, ConfirmModal, DayWeightModal, DayStepsModal
```

Key points, unchanged from before the split:

1. **Constants & theming** — `C` (color palette), `T` (font), and the shared style tokens (`hdr`, `crd`, `inp`, `btn`, `dBtn`, `mTtl`, …) live in `theme.js` and are imported wherever needed; the app is a single dark theme, no theme switching.

   **All components live at module scope (one per file) and read shared state via `useApp()` (the `AppCtx` context from `context.js`) — never declare a component inside another component.** Doing so gives it a new function identity on every render, which makes React unmount and remount the whole subtree, silently destroying local state, scroll position, focus and in-flight timers. `App` (`App.js`) is only state, mutations and derived values; it renders `<AppShell/>` (or `<LockScreen/>`) inside the provider. To give a component access to something new, add it to the `ctx` object in `App` and destructure it in that component — don't reach for prop drilling instead.
2. **Data model** (`dataModel.js`) — `DEFAULT_MUSCLES` seeds a new user with 7 muscle groups, each with a preset list of exercises (`makeExercises`). The persisted shape is `{ users: [{ id, name, muscles: [{ id, name, exercises: [{ id, name, sessions: [...] }] }] }], activeUserId }`. Multiple local "users" (profiles) share one browser/device; there is no backend — everything is client-only.
3. **Persistence** — the whole `data` object is serialized to `localStorage` under `STORAGE_KEY` (from `dataModel.js`, `"gymlog/v5/data"`) on every change (see the `useEffect` watching `data` in `App.js`); a failed write sets `saveError`, which the home screen surfaces as a banner. Bump the key (and handle migration in `initData`) if the data shape changes incompatibly. On Android/Capacitor this maps to the WebView's local storage (see the comment near `STORAGE_KEY` for the on-device path). This is the only copy of the user's history — `BackupModal` (sidebar → Backup / Restore) is the sole export/import path.

   **Dates** are local-calendar strings (`dates.js`'s `localISO`/`parseISO`), and they are the join key for `session.date`, `dailyWeights` and `dailySteps`. Never use `toISOString().slice(0,10)` for a calendar day — it is UTC and shifts the day for any non-UTC timezone.
4. **Navigation** — no router; navigation is plain `useState` screen stack driven by `screen` (`"home" | "day" | "exercise" | "exHistory"`, etc.) plus `viewDay` / `viewSid` / `viewEx` "which item is open" state and a `wizard` state for the add-session flow, all owned by `App.js`. `AppShell.js` renders the active screen component by conditional, not a route table.
5. **License/unlock system** (`license.js`) — a self-contained shared-secret HMAC-like scheme (`hmacSign`/`djb2`, `GYMLOG_SECRET`) gates the app behind `locked` state (owned by `App.js`, screen rendered by `components/LockScreen.js`), checked against a token+expiry stored under `localStorage["gymlog/lock"]`. The exact same `GYMLOG_SECRET` and `hmacSign` implementation must stay byte-identical in `gymlog-keygen/App.js`, which mints the tokens this app validates — **if you change the secret or signing algorithm in one file, change it in both, or unlock tokens will stop validating.**
6. **In-session rest/workout timer** — `components/TimerBar.js` owns the reactive timer state and is mounted with `key={sid}`. The `timerMap` / `restMap` refs on `App` are only a persistence layer so a running timer survives navigating away and back; they are memory-only and intentionally never written to `localStorage`, so timers reset on reload. Don't move them into `data`.
7. **Graphs** — bodyweight (`components/BodyWeightModal.js`), steps (`components/StepsGraphModal.js`), and per-exercise progress graphs (inline in `components/ExerciseHistory.js`, around `graphPts`) are hand-rolled inline SVG line charts computed from session history, not a charting library.
8. **Muscle icons** — `components/MuscleIcon.js` renders PNGs from `src/assets/muscles/` keyed by muscle name, falling back to a color from `getMuscleColor` (`muscleColors.js`, keyword-matched against the muscle/exercise name) when no image matches.

Most files are small (under ~150 lines); `grep -rn` for the relevant `useState` name, `screen===` check, component name, or file name is still the fastest way to locate a feature area.
