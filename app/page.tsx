'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deck {
  id: number;
  name: string;
  created_at: string;
  card_count: number;
  due_count: number;
}

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchDecks() {
    const res = await fetch('/api/decks');
    const data = await res.json();
    setDecks(data);
    setLoading(false);
  }

  useEffect(() => { fetchDecks(); }, []);

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create deck');
      setNewName('');
      await fetchDecks();
    } catch {
      setError('Could not create deck. Try again.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteDeck(id: number) {
    if (!confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    setDeletingId(id);
    await fetch(`/api/decks/${id}`, { method: 'DELETE' });
    setDecks(prev => prev.filter(d => d.id !== id));
    setDeletingId(null);
  }

  const totalCards = decks.reduce((s, d) => s + d.card_count, 0);
  const totalDue   = decks.reduce((s, d) => s + d.due_count, 0);

  return (
    <main>
      <div className="container">
        <div className="page-header">
          <h1>Your Decks</h1>
          <p style={{ marginTop: '0.4rem' }}>
            Study smarter — the SM-2 engine schedules exactly what needs your attention today.
          </p>
        </div>

        {/* Stats */}
        {!loading && decks.length > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value">{decks.length}</div>
              <div className="stat-label">Decks</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalCards}</div>
              <div className="stat-label">Total Cards</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: totalDue > 0 ? 'var(--warning)' : 'var(--success)', WebkitTextFillColor: 'initial' }}>
                {totalDue}
              </div>
              <div className="stat-label">Due Today</div>
            </div>
          </div>
        )}

        {/* Create form */}
        <div className="create-panel">
          <div className="create-panel-title">✦ New Deck</div>
          <form onSubmit={createDeck} className="form-row">
            <div className="form-group">
              <input
                id="deck-name-input"
                type="text"
                placeholder="e.g. Spanish Vocabulary, React Hooks…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
              />
            </div>
            <button
              id="create-deck-btn"
              type="submit"
              className="btn btn-primary"
              disabled={creating || !newName.trim()}
            >
              {creating ? '…' : '+ Create'}
            </button>
          </form>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
        </div>

        {/* Deck list */}
        {loading ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading your decks…</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3 style={{ marginBottom: '0.5rem' }}>No decks yet</h3>
            <p>Create your first deck above to start studying.</p>
          </div>
        ) : (
          <div className="card-grid">
            {decks.map(deck => (
              <div key={deck.id} style={{ position: 'relative' }}>
                <Link href={`/decks/${deck.id}`} className="deck-card">
                  <div className="deck-card-name">{deck.name}</div>
                  <div className="deck-card-meta">
                    <span className="badge badge-neutral">
                      🃏 {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                    </span>
                    {deck.due_count > 0 ? (
                      <span className="badge badge-warning">
                        🔔 {deck.due_count} due
                      </span>
                    ) : deck.card_count > 0 ? (
                      <span className="badge badge-success">
                        ✓ All reviewed
                      </span>
                    ) : null}
                  </div>
                </Link>
                <button
                  id={`delete-deck-${deck.id}`}
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteDeck(deck.id)}
                  disabled={deletingId === deck.id}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                  title="Delete deck"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <p>💾 All data persists in <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>data/flashforge.db</code> between sessions</p>
        </div>
      </div>
    </main>
  );
}
