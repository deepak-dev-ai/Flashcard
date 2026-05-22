/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Original algorithm by Piotr Woźniak (SuperMemo 2).
 * Rating scale: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
 *
 * References:
 *  https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-super-memo-method
 */

export interface CardSM2State {
  ease_factor: number;   // "E-Factor" — starts at 2.5, min 1.3
  interval: number;      // Days until next review
  repetitions: number;   // Consecutive successful reviews (rating >= 1)
}

export interface SM2Result extends CardSM2State {
  due_date: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Apply one SM-2 review step.
 *
 * Edge case handled (line 50-52): ease_factor is clamped to a minimum of 1.3.
 * Without this clamp, repeated "Again" answers would eventually produce a
 * negative ease_factor, causing the interval formula to collapse to 0 or
 * negative days — the card would never be scheduled again.
 *
 * @param state  Current SM-2 state of the card
 * @param rating 0 = Again | 1 = Hard | 2 = Good | 3 = Easy
 */
export function applyReview(state: CardSM2State, rating: 0 | 1 | 2 | 3): SM2Result {
  let { ease_factor, interval, repetitions } = state;

  if (rating === 0) {
    // "Again" — reset to beginning, short re-study interval
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      // Subsequent reviews: grow by ease factor
      interval = Math.round(interval * ease_factor);
    }
    repetitions += 1;
  }

  // Update ease factor using SM-2 formula
  // q = rating mapped to 0-5 scale: Again=0, Hard=2, Good=3, Easy=5
  const q = [0, 2, 3, 5][rating];
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // EDGE CASE: Clamp ease_factor to a minimum of 1.3.
  // Without this, repeated failures drive ease_factor negative,
  // making Math.round(interval * ease_factor) produce 0 or negative intervals.
  // A card with interval=0 would be due every single run and never graduate.
  ease_factor = Math.max(1.3, ease_factor);

  // Cap interval at 365 days to keep the schedule humanly meaningful
  interval = Math.min(interval, 365);

  const due = new Date();
  due.setDate(due.getDate() + interval);
  const due_date = due.toISOString().split('T')[0];

  return { ease_factor, interval, repetitions, due_date };
}

/** Returns true if a card is due for review today or overdue */
export function isDue(due_date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return due_date <= today;
}
