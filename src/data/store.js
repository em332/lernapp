/**
 * Datenpersistenz via Supabase.
 *
 * Strategie: In-Memory-Cache für synchrone Lesezugriffe.
 * initStore() lädt einmalig nach dem Login alle Daten vom Server.
 * Schreiboperationen aktualisieren den Cache sofort und persistieren
 * asynchron im Hintergrund (fire-and-forget mit Fehlerlogging).
 */

import { createEntry } from './model.js';
import { supabase }    from './supabase.js';

const SESSION_USER_KEY = 'lernapp_user';

function currentUser() {
  return sessionStorage.getItem(SESSION_USER_KEY) ?? 'default';
}

// ── In-Memory-Cache ──────────────────────────────────────────────────────────

let _entries  = null;
let _settings = null;

/**
 * Einmalig nach dem Login aufrufen.
 * Lädt alle Daten des aktuellen Users von Supabase in den Cache.
 */
export async function initStore() {
  const username = currentUser();

  const [{ data: entryRow }, { data: settingsRow }] = await Promise.all([
    supabase.from('entries').select('data').eq('username', username).maybeSingle(),
    supabase.from('settings').select('data').eq('username', username).maybeSingle(),
  ]);

  _entries  = entryRow?.data  ?? [];
  _settings = settingsRow?.data ?? null;
}

// ── Hintergrund-Persistenz ───────────────────────────────────────────────────

async function persistEntries(entries) {
  const { error } = await supabase
    .from('entries')
    .upsert({ username: currentUser(), data: entries });
  if (error) console.error('Supabase entries save error:', error);
}

async function persistSettings(settings) {
  const { error } = await supabase
    .from('settings')
    .upsert({ username: currentUser(), data: settings });
  if (error) console.error('Supabase settings save error:', error);
}

// ── Einträge ────────────────────────────────────────────────────────────────

export function loadEntries() {
  return _entries ?? [];
}

export function saveEntries(entries) {
  _entries = entries;
  persistEntries(entries);
}

export function addEntry(data) {
  const entry   = createEntry(data);
  const entries = [...loadEntries(), entry];
  saveEntries(entries);
  return entry;
}

export function updateEntry(id, changes) {
  const entries = loadEntries();
  const idx     = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...changes, updatedAt: new Date().toISOString() };
  saveEntries([...entries]);
  return entries[idx];
}

export function deleteEntry(id) {
  saveEntries(loadEntries().filter(e => e.id !== id));
}

export function getEntry(id) {
  return loadEntries().find(e => e.id === id) ?? null;
}

export function importEntries(newEntries, mode = 'merge') {
  if (mode === 'replace') {
    saveEntries(newEntries);
    return;
  }
  const existing = loadEntries();
  const map      = new Map(existing.map(e => [e.id, e]));
  for (const e of newEntries) map.set(e.id, e);
  saveEntries([...map.values()]);
}

// ── Einstellungen ────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  newCardsPerDay:     20,
  reviewsPerSession:  50,
  easyBonus:          1.3,
  intervalModifier:   1.0,
  maxIntervalDays:    365,
  learnMode:          'flashcard',
  showExampleOnFront: false,
};

export function loadSettings() {
  return _settings ? { ...DEFAULT_SETTINGS, ..._settings } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  _settings = settings;
  persistSettings(settings);
}
