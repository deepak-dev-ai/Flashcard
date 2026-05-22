import { NextResponse } from 'next/server';
import { getDeckById, getCardsByDeck, renameDeck, deleteDeck } from '@/lib/db';

type Params = { params: { id: string } };

function toNum(id: string): number { return parseInt(id, 10); }

// GET /api/decks/[id] — single deck with its cards
export async function GET(_req: Request, { params }: Params) {
  const deck = getDeckById(toNum(params.id));
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const cards = getCardsByDeck(toNum(params.id));
  return NextResponse.json({ deck, cards });
}

// PUT /api/decks/[id] — rename a deck
export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const updated = renameDeck(toNum(params.id), name);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/decks/[id] — delete deck (cascades to cards in db layer)
export async function DELETE(_req: Request, { params }: Params) {
  const ok = deleteDeck(toNum(params.id));
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
