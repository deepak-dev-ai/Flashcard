import { NextResponse } from 'next/server';
import { getCardsByDeck, createCard } from '@/lib/db';

type Params = { params: { id: string } };

// GET /api/decks/[id]/cards
export async function GET(_req: Request, { params }: Params) {
  const cards = getCardsByDeck(parseInt(params.id, 10));
  return NextResponse.json(cards);
}

// POST /api/decks/[id]/cards — add a card to a deck
export async function POST(request: Request, { params }: Params) {
  const body = await request.json();
  const front = typeof body?.front === 'string' ? body.front.trim() : '';
  const back  = typeof body?.back  === 'string' ? body.back.trim()  : '';
  if (!front || !back) {
    return NextResponse.json({ error: 'front and back are required' }, { status: 400 });
  }
  const card = createCard(parseInt(params.id, 10), front, back);
  return NextResponse.json(card, { status: 201 });
}
