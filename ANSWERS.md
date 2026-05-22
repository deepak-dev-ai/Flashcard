# ANSWERS.md

## 1. How to run

**Prerequisites:** Node.js 18+ (https://nodejs.org/)

```bash
cd flashcard-app
npm install
npm run dev
```

Open http://localhost:3000.  
The SQLite database is created automatically at `data/flashforge.db` on first run.  
Restart the server anytime — all data persists.

---

## 2. Stack choice

**Stack:** Next.js 14 (App Router) + TypeScript + JSON file persistence + Vanilla CSS

**Why this stack:**

- **Next.js** gives a full-stack app in a single repo — API routes run server-side (where the file store lives), React pages run client-side. No separate backend server to start or configure.
- **JSON file store** (via Node.js built-in `fs`) was chosen over SQLite for one concrete reason: `better-sqlite3` requires native compilation (`node-gyp`, Visual Studio Build Tools) which will silently fail on machines without C++ tooling. A JSON file store has zero native dependencies — it works on every machine with Node.js 18+ out of the box. The data persists in `data/db.json` and survives process restarts, satisfying the persistence requirement.
- **TypeScript** catches shape errors between the API layer and the UI at compile time, especially useful when the SM-2 state object (ease_factor, interval, repetitions, due_date) flows through multiple layers.
- **Vanilla CSS** gives full design control without build-step complexity. The dark glassmorphism design is all hand-written, nothing outsourced to a utility framework.

**A worse choice: MongoDB Atlas**  
Using a hosted database (Mongo, Supabase, PlanetScale) would break on a fresh machine without credentials in environment variables. The reviewer would need an `.env` file with secrets, and the app would crash with a connection error if those aren't set up. The JSON file store avoids this entirely.

**Another worse choice: `better-sqlite3` (what I tried first)**  
I initially chose SQLite because it's the gold standard for embedded persistence. During build, `better-sqlite3` failed because it requires Visual Studio C++ Build Tools, which aren't present on all machines. A dependency that silently requires an OS-level toolchain is a deployment liability for a "run on a fresh machine" assessment. I switched to the JSON file store to eliminate this class of failure.

---

## 3. One real edge case

**Edge case: `ease_factor` floor in the SM-2 algorithm**

**File:** `lib/sm2.ts`, **lines 50–52**

```ts
// EDGE CASE: Clamp ease_factor to a minimum of 1.3.
ease_factor = Math.max(1.3, ease_factor);
```

**What it handles:**  
The SM-2 formula decreases `ease_factor` each time a card is rated "Again" (0) or "Hard" (1). After enough repeated failures, the formula `ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))` produces values below 1.0, then eventually negative.

**What would happen without this:**  
If `ease_factor` goes negative and the `interval` calculation is `Math.round(interval * ease_factor)`, the next interval becomes 0 or negative. A card with `interval = 0` would always be due, and its interval would never grow — the card would be stuck in an infinite "due every session" loop, never graduating to longer review periods. With the clamp at 1.3, the worst-case growth rate is still slightly positive, so the interval will eventually increase even for very difficult cards.

**Why 1.3?**  
This is the minimum prescribed in the original SM-2 specification by Piotr Woźniak, chosen empirically to represent a card that needs very frequent review without falling into a degenerate scheduling state.

---

## 4. AI usage

**Tool used:** Antigravity (Claude Sonnet) via Gemini coding assistant

**What I asked / what it gave me:**

1. **SM-2 algorithm scaffolding** — I asked for a TypeScript implementation of the SM-2 spaced repetition algorithm. It produced the core `applyReview` function with the interval progression logic (1 → 6 → interval × ease_factor).  
   - **What I changed:** The AI's initial version did not clamp `ease_factor` at 1.3. I added the `Math.max(1.3, ease_factor)` guard explicitly after reading the original SM-2 specification and recognizing the degenerate-scheduling edge case. I also changed the rating-to-q mapping it suggested (it had used a direct 0–3 scale) to the correct SM-2 q values `[0, 2, 3, 5]` that produce the right ease adjustments per the spec.

2. **CSS glassmorphism design** — I asked for a dark design system with glassmorphism styling. It produced a reasonable foundation with CSS custom properties and backdrop-filter.  
   - **What I changed:** The generated rating buttons were single-colored and lacked the per-rating color coding (red=Again, yellow=Hard, green=Good, blue=Easy). I rewrote the rating button styles to use semantic colors with matching borders and hover states that communicate the rating meaning visually.

3. **SQLite singleton pattern** — I asked how to avoid re-opening the database on each Next.js hot-reload in development. It suggested the `global` object singleton pattern.  
   - Used as-is; this is a standard pattern and was correct.

---

## 5. Honest gap

**What isn't good enough:** The JSON file store does a full read and full write on every mutation (create, update, delete). For a dataset with hundreds of decks and thousands of cards, this is wasteful — every write serializes the entire database to disk. There's also no atomic write protection; if the process crashes mid-write, the JSON file could be partially written and corrupted.

**What I'd do with another day:** Swap the store for SQLite using `better-sqlite3` with pre-downloaded platform binaries (committed to the repo via `npm run prebuild`), or use the Node.js 22 built-in `node:sqlite` module. SQLite gives atomic writes (WAL mode), proper indexing for due-card queries, and O(1) card lookups instead of full array scans. The schema is already designed (the SM-2 fields map directly to columns), so this would be a near-drop-in replacement for `lib/db.ts` with no API or UI changes required.
