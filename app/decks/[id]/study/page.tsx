'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Card {
  id: number;
  front: string;
  back: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
}

type Rating = 0 | 1 | 2 | 3;

const RATINGS: { label: string; value: Rating; className: string; desc: string }[] = [
  { label: 'Again', value: 0, className: 'rating-btn-again', desc: '< 1 day' },
  { label: 'Hard',  value: 1, className: 'rating-btn-hard',  desc: '~1 day'  },
  { label: 'Good',  value: 2, className: 'rating-btn-good',  desc: 'varies'  },
  { label: 'Easy',  value: 3, className: 'rating-btn-easy',  desc: 'long'    },
];

export default function StudyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Session stats
  const [results, setResults] = useState<{ again: number; hard: number; good: number; easy: number }>({
    again: 0, hard: 0, good: 0, easy: 0,
  });

  useEffect(() => {
    async function load() {
      // Fetch deck name
      const deckRes = await fetch(`/api/decks/${params.id}`);
      if (!deckRes.ok) { router.push('/'); return; }
      const deckData = await deckRes.json();
      setDeckName(deckData.deck.name);

      // Fetch due cards
      const studyRes = await fetch(`/api/decks/${params.id}/study`);
      const studyData = await studyRes.json();

      // If no due cards, study all cards from the deck instead
      if (studyData.dueCards.length === 0) {
        setCards(deckData.cards);
      } else {
        setCards(studyData.dueCards);
      }
      setLoading(false);
    }
    load();
  }, []);

  const current = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  async function submitRating(rating: Rating) {
    if (submitting || !current) return;
    setSubmitting(true);

    await fetch(`/api/decks/${params.id}/study`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: current.id, rating }),
    });

    const ratingKey = ['again', 'hard', 'good', 'easy'][rating] as keyof typeof results;
    setResults(prev => ({ ...prev, [ratingKey]: prev[ratingKey] + 1 }));

    if (currentIndex + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setFlipped(false);
    }
    setSubmitting(false);
  }

  if (loading) return (
    <main><div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <p>Loading study session…</p>
    </div></main>
  );

  if (cards.length === 0) return (
    <main><div className="container" style={{ paddingTop: '4rem' }}>
      <div className="summary-card">
        <span className="summary-emoji">✅</span>
        <h2 className="summary-title">Nothing to study!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          This deck has no cards yet. Add some cards first.
        </p>
        <Link href={`/decks/${params.id}`} className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }}>
          ← Back to Deck
        </Link>
      </div>
    </div></main>
  );

  if (done) {
    const total = results.again + results.hard + results.good + results.easy;
    const recalled = results.good + results.easy;
    const pct = total > 0 ? Math.round((recalled / total) * 100) : 0;
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖';

    return (
      <main><div className="container" style={{ paddingTop: '4rem' }}>
        <div className="summary-card">
          <span className="summary-emoji">{emoji}</span>
          <h2 className="summary-title">Session Complete!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            You reviewed <strong>{total}</strong> card{total !== 1 ? 's' : ''} from <em>{deckName}</em>.
          </p>
          <div className="summary-stat-row">
            <div>
              <span className="summary-stat-val" style={{ color: 'var(--danger)' }}>{results.again}</span>
              <span className="summary-stat-lbl">Again</span>
            </div>
            <div>
              <span className="summary-stat-val" style={{ color: 'var(--warning)' }}>{results.hard}</span>
              <span className="summary-stat-lbl">Hard</span>
            </div>
            <div>
              <span className="summary-stat-val" style={{ color: 'var(--success)' }}>{results.good}</span>
              <span className="summary-stat-lbl">Good</span>
            </div>
            <div>
              <span className="summary-stat-val" style={{ color: 'var(--info)' }}>{results.easy}</span>
              <span className="summary-stat-lbl">Easy</span>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div className="progress-bar-wrap" style={{ marginBottom: '0.4rem' }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {pct}% recalled correctly
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href={`/decks/${params.id}`} className="btn btn-secondary">
              ← Back to Deck
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => {
                setCurrentIndex(0);
                setFlipped(false);
                setDone(false);
                setResults({ again: 0, hard: 0, good: 0, easy: 0 });
              }}
            >
              Study Again
            </button>
          </div>
        </div>
      </div></main>
    );
  }

  return (
    <main>
      <div className="container">
        {/* Header */}
        <div style={{ paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="breadcrumb">
              <Link href="/">All Decks</Link>
              <span>›</span>
              <Link href={`/decks/${params.id}`}>{deckName}</Link>
              <span>›</span>
              <span style={{ color: 'var(--text-primary)' }}>Study</span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Flashcard */}
        <div className="flashcard-scene" onClick={() => !submitting && setFlipped(f => !f)}>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-label">Question</div>
              <div className="flashcard-text">{current?.front}</div>
              {!flipped && <div className="flashcard-hint">Click to reveal answer</div>}
            </div>
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-label">Answer</div>
              <div className="flashcard-text">{current?.back}</div>
            </div>
          </div>
        </div>

        {/* Rating buttons — only shown after flip */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          {!flipped ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Think about the answer, then click the card to reveal it
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                How well did you recall this?
              </p>
              <div className="rating-row">
                {RATINGS.map(r => (
                  <button
                    key={r.value}
                    id={`rating-${r.label.toLowerCase()}`}
                    className={`rating-btn ${r.className}`}
                    onClick={() => submitRating(r.value)}
                    disabled={submitting}
                  >
                    {r.label}
                    <span className="rating-interval">{r.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Keyboard hint */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2rem' }}>
          After revealing · press 1–4 to rate · Space to flip
        </p>
      </div>
    </main>
  );
}
