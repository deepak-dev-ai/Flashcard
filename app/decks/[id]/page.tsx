'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
}

interface Deck {
  id: number;
  name: string;
  created_at: string;
}

interface EditState { cardId: number; front: string; back: string }

export default function DeckPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Add card form
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit modal
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  // Rename
  const [renaming, setRenaming] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const dueCards = cards.filter(c => c.due_date <= today);

  async function fetchDeck() {
    const res = await fetch(`/api/decks/${params.id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setDeck(data.deck);
    setCards(data.cards);
    setLoading(false);
  }

  useEffect(() => { fetchDeck(); }, []);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch(`/api/decks/${params.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: front.trim(), back: back.trim() }),
      });
      if (!res.ok) throw new Error();
      setFront('');
      setBack('');
      await fetchDeck();
    } catch {
      setAddError('Could not add card.');
    } finally {
      setAdding(false);
    }
  }

  async function deleteCard(cardId: number) {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/decks/${params.id}/cards/${cardId}`, { method: 'DELETE' });
    setCards(prev => prev.filter(c => c.id !== cardId));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`/api/decks/${params.id}/cards/${editing.cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: editing.front, back: editing.back }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCards(prev => prev.map(c => c.id === editing.cardId ? updated : c));
      setEditing(null);
    }
    setSaving(false);
  }

  async function renameDeck() {
    if (!newDeckName.trim() || !deck) return;
    const res = await fetch(`/api/decks/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDeckName.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDeck(updated);
      setRenaming(false);
    }
  }

  async function deleteDeck() {
    if (!confirm('Delete this entire deck and all its cards?')) return;
    await fetch(`/api/decks/${params.id}`, { method: 'DELETE' });
    router.push('/');
  }

  if (loading) return (
    <main><div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <span className="empty-icon">⏳</span><p>Loading…</p>
    </div></main>
  );

  if (notFound) return (
    <main><div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <span className="empty-icon">🔍</span>
      <h2>Deck not found</h2>
      <Link href="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>← Back to Decks</Link>
    </div></main>
  );

  return (
    <main>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ paddingTop: '1.5rem', marginBottom: '0.75rem' }}>
          <span className="breadcrumb">
            <Link href="/">All Decks</Link>
            <span>›</span>
            <span style={{ color: 'var(--text-primary)' }}>{deck?.name}</span>
          </span>
        </div>

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1>{deck?.name}</h1>
            <p style={{ marginTop: '0.3rem' }}>
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              {dueCards.length > 0 && ` · ${dueCards.length} due today`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button id="rename-deck-btn" className="btn btn-secondary btn-sm" onClick={() => { setRenaming(true); setNewDeckName(deck?.name ?? ''); }}>
              ✏️ Rename
            </button>
            <button id="delete-deck-btn" className="btn btn-danger btn-sm" onClick={deleteDeck}>
              🗑 Delete Deck
            </button>
            {cards.length > 0 && (
              <Link
                href={`/decks/${params.id}/study`}
                id="study-btn"
                className="btn btn-primary"
              >
                ⚡ {dueCards.length > 0 ? `Study ${dueCards.length} Due` : 'Study All'}
              </Link>
            )}
          </div>
        </div>

        {/* Due notice */}
        {dueCards.length > 0 && (
          <div className="notice notice-warn" style={{ marginBottom: '1.5rem' }}>
            🔔 You have {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review. Hit ⚡ Study to clear them.
          </div>
        )}

        {/* Add card form */}
        <div className="create-panel">
          <div className="create-panel-title">✦ Add Card</div>
          <form onSubmit={addCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="card-front">Front (Question)</label>
                <textarea
                  id="card-front"
                  placeholder="What is the capital of France?"
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  rows={2}
                  style={{ minHeight: '64px' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="card-back">Back (Answer)</label>
                <textarea
                  id="card-back"
                  placeholder="Paris"
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  rows={2}
                  style={{ minHeight: '64px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
              {addError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{addError}</span>}
              <button
                id="add-card-btn"
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={adding || !front.trim() || !back.trim()}
              >
                {adding ? '…' : '+ Add Card'}
              </button>
            </div>
          </form>
        </div>

        {/* Card list */}
        {cards.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🃏</span>
            <h3 style={{ marginBottom: '0.5rem' }}>No cards yet</h3>
            <p>Add your first card above to get started.</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <span className="section-title">Cards ({cards.length})</span>
            </div>
            <div className="card-list">
              {cards.map(card => {
                const isDue = card.due_date <= today;
                return (
                  <div key={card.id} className="card-item">
                    <div className={isDue ? 'card-due-dot' : 'card-not-due-dot'} title={isDue ? 'Due for review' : `Next review: ${card.due_date}`} />
                    <div className="card-item-content">
                      <div className="card-item-front">{card.front}</div>
                      <div className="card-item-back">{card.back}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                      <div className="card-item-actions">
                        <button
                          id={`edit-card-${card.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditing({ cardId: card.id, front: card.front, back: card.back })}
                          title="Edit card"
                        >✏️</button>
                        <button
                          id={`delete-card-${card.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => deleteCard(card.id)}
                          title="Delete card"
                          style={{ color: 'var(--text-muted)' }}
                        >✕</button>
                      </div>
                      <span
                        className="badge badge-neutral"
                        title={`Ease: ${card.ease_factor.toFixed(1)} · Interval: ${card.interval}d · Reps: ${card.repetitions}`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {isDue ? '🔔 due' : `📅 ${card.due_date}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Card</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Front</label>
                <textarea
                  value={editing.front}
                  onChange={e => setEditing({ ...editing, front: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Back</label>
                <textarea
                  value={editing.back}
                  onChange={e => setEditing({ ...editing, back: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button
                id="save-edit-btn"
                className="btn btn-primary"
                onClick={saveEdit}
                disabled={saving || !editing.front.trim() || !editing.back.trim()}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renaming && (
        <div className="modal-overlay" onClick={() => setRenaming(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Rename Deck</div>
            <div className="form-group">
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="New deck name"
                maxLength={100}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') renameDeck(); }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRenaming(false)}>Cancel</button>
              <button
                id="save-rename-btn"
                className="btn btn-primary"
                onClick={renameDeck}
                disabled={!newDeckName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
