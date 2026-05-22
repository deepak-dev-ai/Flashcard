# FlashForge ⚡

A spaced repetition flashcard app — create decks, add cards, and study smarter.
Data persists in a local SQLite database (`data/flashforge.db`) between runs.

## Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org/) (includes npm)

### Run

```bash
# 1. Clone / enter the project directory
cd flashcard-app

# 2. Install dependencies (one-time)
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> On first run, the `data/` folder and `data/db.json` file are created automatically.  
> Restart the server anytime — all your decks and cards will still be there.


### Production build (optional)

```bash
npm run build
npm start
```

---

## Features

| Feature | Description |
|---|---|
| **Deck management** | Create, rename, delete decks |
| **Card CRUD** | Add, edit, delete flashcards (front + back) |
| **Spaced Repetition (SM-2)** | After revealing an answer, rate recall: Again / Hard / Good / Easy. The engine schedules the next review automatically. |
| **Due indicator** | Green dot = due for review; grey = scheduled for a future date |
| **Session summary** | After each session, see recall percentage and per-rating breakdown |
| **Persistence** | JSON file (`data/db.json`) — survives server restarts, zero native dependencies |

---

## Project Structure

```
flashcard-app/
├── app/
│   ├── api/decks/            # REST API routes (all server-side)
│   ├── decks/[id]/           # Deck detail + study session pages
│   ├── globals.css           # Design system
│   ├── layout.tsx            # Root layout / navbar
│   └── page.tsx              # Home — deck list
├── lib/
│   ├── db.ts                 # SQLite singleton + schema init
│   └── sm2.ts                # SM-2 spaced repetition algorithm
├── data/                     # Created on first run
│   └── flashforge.db         # SQLite database (persists between restarts)
├── README.md
└── ANSWERS.md
```

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Node.js `fs` module** — JSON file persistence, no native dependencies
- **Vanilla CSS** — custom dark glassmorphism design system
