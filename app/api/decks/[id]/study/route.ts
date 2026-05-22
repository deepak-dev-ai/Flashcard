import { NextResponse } from 'next/server';
import { getCardsByDeck, updateCardSM2 } from '@/lib/db';
import { applyReview, isDue } from '@/lib/sm2';

type Params = { params: { id: string } };

// GET /api/decks/[id]/study — return cards due for review today
export async function GET(_req: Request, { params }: Params) {
  const cards  = getCardsByDeck(parseInt(params.id, 10));
  const dueCards = cards.filter(c => isDue(c.due_date));

  // Sort due cards: most overdue first, then by creation order
  dueCards.sort((a, b) => a.due_date.localeCompare(b.due_date));

  return NextResponse.json({
    dueCards,
    totalCards: cards.length,
    dueCount:   dueCards.length,
  });
}

// POST /api/decks/[id]/study — submit a rating for a card
export async function POST(request: Request, { params }: Params) {
  const body = await request.json();
  const cardId = typeof body?.cardId === 'number' ? body.cardId : -1;
  const rating = body?.rating as 0 | 1 | 2 | 3;

  if (![0, 1, 2, 3].includes(rating)) {
    return NextResponse.json({ error: 'rating must be 0, 1, 2, or 3' }, { status: 400 });
  }

  const deckCards = getCardsByDeck(parseInt(params.id, 10));
  const card = deckCards.find(c => c.id === cardId);
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const result  = applyReview(card, rating);
  const updated = updateCardSM2(cardId, result.ease_factor, result.interval, result.repetitions, result.due_date);

  return NextResponse.json(updated);
}
