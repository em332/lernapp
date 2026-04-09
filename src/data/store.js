/**
 * Datenpersistenz via localStorage.
 * Alle Lerneinträge liegen unter ENTRIES_KEY als JSON-Array.
 * Einstellungen liegen separat unter SETTINGS_KEY.
 */

import { createEntry } from './model.js';

const SESSION_USER_KEY = 'lernapp_user';

function userPrefix() {
  return sessionStorage.getItem(SESSION_USER_KEY) ?? 'default';
}

const entriesKey  = () => `lernapp_entries_${userPrefix()}`;
const settingsKey = () => `lernapp_settings_${userPrefix()}`;

// ── Einträge ────────────────────────────────────────────────────────────────

/** Alle Einträge laden */
export function loadEntries() {
  try {
    const raw = localStorage.getItem(entriesKey());
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Alle Einträge speichern (kompletter Überschreib) */
export function saveEntries(entries) {
  localStorage.setItem(entriesKey(), JSON.stringify(entries));
}

/** Einzelnen Eintrag hinzufügen */
export function addEntry(data) {
  const entries = loadEntries();
  const entry   = createEntry(data);
  entries.push(entry);
  saveEntries(entries);
  return entry;
}

/** Eintrag aktualisieren (per id) */
export function updateEntry(id, changes) {
  const entries = loadEntries();
  const idx     = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...changes, updatedAt: new Date().toISOString() };
  saveEntries(entries);
  return entries[idx];
}

/** Eintrag löschen */
export function deleteEntry(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

/** Eintrag per id suchen */
export function getEntry(id) {
  return loadEntries().find(e => e.id === id) ?? null;
}

/** Mehrere Einträge auf einmal importieren (überschreibt bestehende per id) */
export function importEntries(newEntries, mode = 'merge') {
  if (mode === 'replace') {
    saveEntries(newEntries);
    return;
  }
  // merge: bestehende id überschreiben, neue hinzufügen
  const existing = loadEntries();
  const map       = new Map(existing.map(e => [e.id, e]));
  for (const e of newEntries) {
    map.set(e.id, e);
  }
  saveEntries([...map.values()]);
}

// ── Einstellungen ────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  newCardsPerDay:      20,
  reviewsPerSession:   50,
  easyBonus:           1.3,   // Intervall-Multiplikator bei "Leicht"
  intervalModifier:    1.0,   // Globaler Multiplikator (z. B. 0.8 = kürzere Intervalle)
  maxIntervalDays:     365,
  learnMode:           'flashcard', // 'flashcard' | 'write'
  showExampleOnFront:  false,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(settingsKey());
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(settingsKey(), JSON.stringify(settings));
}
