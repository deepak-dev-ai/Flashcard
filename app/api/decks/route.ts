import { NextResponse } from 'next/server';
import { getAllDecks, createDeck } from '@/lib/db';

// GET /api/decks — list all decks with card counts and due counts
export async function GET() {
  const decks = getAllDecks();
  return NextResponse.json(decks);
}

// POST /api/decks — create a new deck
export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Deck name is required' }, { status: 400 });
  }
  const deck = createDeck(name);
  return NextResponse.json(deck, { status: 201 });
}
