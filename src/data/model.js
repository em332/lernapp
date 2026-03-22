/**
 * Datenmodell: Typen, Factory-Funktionen, Validierung
 */

export const STATUS = {
  NEW:      'new',       // noch nie gelernt
  LEARNING: 'learning',  // in der Einlernphase (< 2 erfolgreiche Reviews)
  REVIEW:   'review',    // reguläre Wiederholung
  MASTERED: 'mastered',  // >= 5 erfolgreiche Wiederholungen, langes Intervall
};

export const DIFFICULTY = {
  EASY:   'easy',
  MEDIUM: 'medium',
  HARD:   'hard',
};

// Standard-Ease-Faktor für den SM-2-Algorithmus
export const DEFAULT_EASE = 2.5;
export const MIN_EASE     = 1.3;
export const MAX_EASE     = 3.5;

/**
 * Erstellt einen neuen, vollständigen Lerneintrag.
 * Fehlende Felder werden mit sinnvollen Defaults befüllt.
 *
 * @param {Partial<LernEintrag>} data
 * @returns {LernEintrag}
 */
export function createEntry(data = {}) {
  const today = todayStr();
  return {
    id:              data.id              ?? crypto.randomUUID(),
    term:            data.term            ?? '',
    language:        data.language        ?? '',
    // Mehrere Bedeutungen / Nuancen möglich
    meanings: Array.isArray(data.meanings) && data.meanings.length
      ? data.meanings.map(m => ({ definition: m.definition ?? '', translation: m.translation ?? '' }))
      : [{ definition: data.definition ?? '', translation: data.translation ?? '' }],
    exampleSentence: data.exampleSentence ?? '',
    notes:           data.notes           ?? '',
    difficulty:      data.difficulty      ?? DIFFICULTY.MEDIUM,
    tags: Array.isArray(data.tags)
      ? data.tags.map(t => String(t).trim()).filter(Boolean)
      : (data.tags ? String(data.tags).split(',').map(t => t.trim()).filter(Boolean) : []),

    // SRS-Felder (SM-2)
    easeFactor:  data.easeFactor  ?? DEFAULT_EASE,
    interval:    data.interval    ?? 0,      // Tage bis zur nächsten Wiederholung
    repetitions: data.repetitions ?? 0,      // Anzahl erfolgreicher Wiederholungen

    status:     data.status     ?? STATUS.NEW,
    dueDate:    data.dueDate    ?? today,
    lastReview: data.lastReview ?? null,

    // Verlauf jeder Bewertung
    history: Array.isArray(data.history) ? data.history : [],

    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Validiert Rohdaten vor dem Import oder Speichern.
 * @param {object} data
 * @returns {string[]} Fehlermeldungen (leer = gültig)
 */
export function validateEntry(data) {
  const errors = [];
  if (!data.term || typeof data.term !== 'string' || !data.term.trim()) {
    errors.push('Pflichtfeld "term" fehlt oder ist leer.');
  }
  if (data.meanings !== undefined) {
    if (!Array.isArray(data.meanings)) {
      errors.push('"meanings" muss ein Array sein.');
    } else if (data.meanings.length === 0) {
      errors.push('"meanings" darf nicht leer sein.');
    }
  }
  if (data.difficulty && !Object.values(DIFFICULTY).includes(data.difficulty)) {
    errors.push(`"difficulty" muss einen der Werte ${Object.values(DIFFICULTY).join(', ')} haben.`);
  }
  if (data.status && !Object.values(STATUS).includes(data.status)) {
    errors.push(`"status" muss einen der Werte ${Object.values(STATUS).join(', ')} haben.`);
  }
  return errors;
}

/** ISO-Datumsstring für heute (YYYY-MM-DD) */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Gibt true zurück wenn eine Karte heute oder früher fällig ist */
export function isDue(entry) {
  return entry.dueDate <= todayStr();
}
