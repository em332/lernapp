/**
 * Vereinfachter SM-2 Algorithmus
 *
 * Bewertungen:
 *   0 = Nochmal  (Again)  — falsch / nicht gewusst
 *   1 = Schwer   (Hard)   — gewusst, aber mit viel Mühe
 *   2 = Gut      (Good)   — sicher gewusst
 *   3 = Leicht   (Easy)   — sofort gewusst
 *
 * Intervall-Logik:
 *   - Nochmal → zurück auf Intervall 1, Ease sinkt
 *   - Schwer  → Intervall × 1.2, Ease sinkt leicht
 *   - Gut     → rep=0→1d, rep=1→3d, sonst interval×ease
 *   - Leicht  → wie Gut, aber Ease steigt, Intervall × easyBonus
 */

import { STATUS, MIN_EASE, MAX_EASE, DEFAULT_EASE, todayStr } from '../data/model.js';
import { loadSettings } from '../data/store.js';

export const RATING = {
  AGAIN: 0,
  HARD:  1,
  GOOD:  2,
  EASY:  3,
};

export const RATING_LABELS = ['Nochmal', 'Schwer', 'Gut', 'Leicht'];
export const RATING_COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6'];

/**
 * Berechnet den nächsten Zustand einer Karte nach einer Bewertung.
 * Gibt ein Änderungsobjekt zurück (kein Side-Effect).
 *
 * @param {object}  entry    - aktueller Lerneintrag
 * @param {0|1|2|3} rating   - Bewertung des Benutzers
 * @returns {object}          - Änderungen für updateEntry()
 */
export function schedule(entry, rating) {
  const settings = loadSettings();
  const { easyBonus, intervalModifier, maxIntervalDays } = settings;

  let { easeFactor, interval, repetitions } = entry;
  easeFactor   = easeFactor   ?? DEFAULT_EASE;
  interval     = interval     ?? 0;
  repetitions  = repetitions  ?? 0;

  let newEase    = easeFactor;
  let newInterval;
  let newReps    = repetitions;
  let newStatus;

  switch (rating) {
    case RATING.AGAIN:
      newReps     = 0;
      newInterval = 1;
      newEase     = Math.max(MIN_EASE, easeFactor - 0.2);
      newStatus   = STATUS.LEARNING;
      break;

    case RATING.HARD:
      newReps     = Math.max(0, repetitions - 1);
      newInterval = Math.max(1, Math.round(interval * 1.2 * intervalModifier));
      newEase     = Math.max(MIN_EASE, easeFactor - 0.15);
      newStatus   = repetitions < 2 ? STATUS.LEARNING : STATUS.REVIEW;
      break;

    case RATING.GOOD:
      newReps = repetitions + 1;
      if (repetitions === 0)      newInterval = 1;
      else if (repetitions === 1) newInterval = 3;
      else                        newInterval = Math.round(interval * easeFactor * intervalModifier);
      newStatus = newReps >= 5 ? STATUS.MASTERED : STATUS.REVIEW;
      break;

    case RATING.EASY:
      newReps = repetitions + 1;
      if (repetitions === 0)      newInterval = 3;
      else if (repetitions === 1) newInterval = 5;
      else                        newInterval = Math.round(interval * easeFactor * easyBonus * intervalModifier);
      newEase   = Math.min(MAX_EASE, easeFactor + 0.15);
      newStatus = newReps >= 4 ? STATUS.MASTERED : STATUS.REVIEW;
      break;
  }

  // Globales Maximum einhalten
  newInterval = Math.min(newInterval, maxIntervalDays);

  const dueDate   = addDays(todayStr(), newInterval);
  const lastReview = todayStr();

  // Verlaufseintrag anhängen
  const historyEntry = {
    date:     lastReview,
    rating,
    interval: newInterval,
  };

  return {
    easeFactor:  newEase,
    interval:    newInterval,
    repetitions: newReps,
    status:      newStatus,
    dueDate,
    lastReview,
    history: [...(entry.history ?? []), historyEntry],
  };
}

/** Gibt ein geschätztes Intervall für eine Bewertung zurück (für die UI-Vorschau) */
export function previewInterval(entry, rating) {
  const result = schedule(entry, rating);
  return result.interval;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
