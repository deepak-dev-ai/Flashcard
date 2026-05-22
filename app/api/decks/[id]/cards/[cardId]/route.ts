import { NextResponse } from 'next/server';
import { updateCard, deleteCard } from '@/lib/db';

type Params = { params: { id: string; cardId: string } };

// PUT /api/decks/[id]/cards/[cardId] — edit front/back
export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const front = typeof body?.front === 'string' ? body.front.trim() : '';
  const back  = typeof body?.back  === 'string' ? body.back.trim()  : '';
  if (!front || !back) {
    return NextResponse.json({ error: 'front and back are required' }, { status: 400 });
  }
  const card = updateCard(parseInt(params.cardId, 10), parseInt(params.id, 10), front, back);
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(card);
}

// DELETE /api/decks/[id]/cards/[cardId]
export async function DELETE(_req: Request, { params }: Params) {
  const ok = deleteCard(parseInt(params.cardId, 10), parseInt(params.id, 10));
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
