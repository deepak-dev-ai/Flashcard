/**
 * File-based persistence layer using JSON.
 *
 * Uses Node.js built-in fs module — no native compilation, no external
 * dependencies beyond Next.js itself.  All data is stored in data/db.json.
 *
 * Reads the full file into memory on each write (acceptable for a mini-app
 * whose dataset fits comfortably in RAM). The honest trade-off is documented
 * in ANSWERS.md Q5.
 */
import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Deck {
  id: number;
  name: string;
  created_at: string;
}

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  // SM-2 fields
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;    // ISO date YYYY-MM-DD
  created_at: string;
}

interface DbShape {
  next_deck_id: number;
  next_card_id: number;
  decks: Deck[];
  cards: Card[];
}

// ─── File setup ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');

const EMPTY_DB: DbShape = {
  next_deck_id: 1,
  next_card_id: 1,
  decks: [],
  cards: [],
};

function readDb(): DbShape {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DbShape;
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function writeDb(data: DbShape): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

// ─── Deck operations ──────────────────────────────────────────────────────────

export function getAllDecks(): (Deck & { card_count: number; due_count: number })[] {
  const db = readDb();
  return db.decks
    .map(deck => {
      const deckCards = db.cards.filter(c => c.deck_id === deck.id);
      const todayStr  = today();
      return {
        ...deck,
        card_count: deckCards.length,
        due_count:  deckCards.filter(c => c.due_date <= todayStr).length,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getDeckById(id: number): Deck | undefined {
  return readDb().decks.find(d => d.id === id);
}

export function createDeck(name: string): Deck {
  const db = readDb();
  const deck: Deck = { id: db.next_deck_id++, name, created_at: now() };
  db.decks.push(deck);
  writeDb(db);
  return deck;
}

export function renameDeck(id: number, name: string): Deck | null {
  const db = readDb();
  const deck = db.decks.find(d => d.id === id);
  if (!deck) return null;
  deck.name = name;
  writeDb(db);
  return deck;
}

export function deleteDeck(id: number): boolean {
  const db = readDb();
  const before = db.decks.length;
  db.decks = db.decks.filter(d => d.id !== id);
  // Cascade: remove all cards belonging to this deck
  db.cards = db.cards.filter(c => c.deck_id !== id);
  if (db.decks.length === before) return false;
  writeDb(db);
  return true;
}

// ─── Card operations ──────────────────────────────────────────────────────────

export function getCardsByDeck(deck_id: number): Card[] {
  return readDb().cards
    .filter(c => c.deck_id === deck_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function createCard(deck_id: number, front: string, back: string): Card {
  const db = readDb();
  const card: Card = {
    id: db.next_card_id++,
    deck_id,
    front,
    back,
    ease_factor: 2.5,
    interval: 1,
    repetitions: 0,
    due_date: today(),
    created_at: now(),
  };
  db.cards.push(card);
  writeDb(db);
  return card;
}

export function updateCard(id: number, deck_id: number, front: string, back: string): Card | null {
  const db = readDb();
  const card = db.cards.find(c => c.id === id && c.deck_id === deck_id);
  if (!card) return null;
  card.front = front;
  card.back  = back;
  writeDb(db);
  return card;
}

export function deleteCard(id: number, deck_id: number): boolean {
  const db = readDb();
  const before = db.cards.length;
  db.cards = db.cards.filter(c => !(c.id === id && c.deck_id === deck_id));
  if (db.cards.length === before) return false;
  writeDb(db);
  return true;
}

export function updateCardSM2(
  id: number,
  ease_factor: number,
  interval: number,
  repetitions: number,
  due_date: string,
): Card | null {
  const db = readDb();
  const card = db.cards.find(c => c.id === id);
  if (!card) return null;
  card.ease_factor = ease_factor;
  card.interval    = interval;
  card.repetitions = repetitions;
  card.due_date    = due_date;
  writeDb(db);
  return card;
}
