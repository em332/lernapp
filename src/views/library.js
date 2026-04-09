/**
 * Bibliothek-View: Liste aller Einträge mit Suche, Filter und Aktionen.
 */

import { loadEntries, deleteEntry } from '../data/store.js';
import { isDue, STATUS } from '../data/model.js';
import { qs, esc, fmtDate, relativeDue } from '../utils/dom.js';
import { openEditor } from './editor.js';

export function render(container) {
  const entries = loadEntries();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="section-title">Bibliothek</h1>
      <span class="text-muted" style="font-size:.875rem">${entries.length} Einträge</span>
    </div>

    <div class="library-stats-bar">
      ${statsBar(entries)}
    </div>

    <div class="library-toolbar">
      <input type="search" id="lib-search" placeholder="Begriff suchen…" style="max-width:260px">
      <select id="lib-filter-status">
        <option value="">Alle Status</option>
        <option value="new">Neu</option>
        <option value="learning">Lernend</option>
        <option value="review">Wiederholung</option>
        <option value="mastered">Beherrscht</option>
      </select>
      <select id="lib-filter-lang">
        <option value="">Alle Sprachen</option>
        ${uniqueValues(entries, 'language').map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('')}
      </select>
      <select id="lib-filter-tag">
        <option value="">Alle Tags</option>
        ${allTags(entries).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
      </select>
      <select id="lib-filter-due">
        <option value="">Alle</option>
        <option value="due">Nur fällige</option>
      </select>
    </div>

    <div class="library-grid" id="lib-grid"></div>
  `;

  renderGrid(container, entries);
  bindEvents(container, entries);
}

// ── Rendering ────────────────────────────────────────────────────────────────

function renderGrid(container, allEntries) {
  const grid   = qs('#lib-grid', container);
  const search = (qs('#lib-search', container)?.value ?? '').toLowerCase();
  const status = qs('#lib-filter-status', container)?.value ?? '';
  const lang   = qs('#lib-filter-lang', container)?.value ?? '';
  const tag    = qs('#lib-filter-tag', container)?.value ?? '';
  const due    = qs('#lib-filter-due', container)?.value ?? '';

  let filtered = allEntries.filter(e => {
    if (search && !e.term.toLowerCase().includes(search) &&
        !e.meanings?.some(m => m.definition.toLowerCase().includes(search) || m.translation.toLowerCase().includes(search))) {
      return false;
    }
    if (status && e.status !== status) return false;
    if (lang   && e.language !== lang) return false;
    if (tag    && !(e.tags ?? []).includes(tag)) return false;
    if (due    && !isDue(e)) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="library-empty" style="grid-column:1/-1">
        <h2>Keine Einträge gefunden</h2>
        <p class="text-muted">Passe die Filter an oder erstelle einen neuen Eintrag.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(e => entryCardHTML(e)).join('');
}

function entryCardHTML(e) {
  const first = e.meanings?.[0] ?? {};
  const def   = first.definition || first.translation || '—';
  const due   = isDue(e) ? `<span style="color:var(--color-danger);font-size:.75rem">● fällig</span>` : '';
  return `
    <div class="entry-card" data-id="${e.id}">
      <div class="entry-card-meta">
        <span class="badge badge-${e.status}">${statusLabel(e.status)}</span>
        ${e.language ? `<span class="tag">${esc(e.language)}</span>` : ''}
        ${due}
      </div>
      <div class="entry-card-term">${esc(e.term)}</div>
      <div class="entry-card-definition">${esc(def)}</div>
      <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.25rem">
        ${(e.tags ?? []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem">
        <span style="font-size:.75rem;color:var(--color-text-subtle)">${relativeDue(e.dueDate)}</span>
        <span style="font-size:.75rem;color:var(--color-text-subtle)">×${e.repetitions ?? 0}</span>
      </div>
    </div>`;
}

function statsBar(entries) {
  const due      = entries.filter(isDue).length;
  const mastered = entries.filter(e => e.status === STATUS.MASTERED).length;
  const learning = entries.filter(e => e.status === STATUS.LEARNING).length;
  return `
    <div class="stat-pill"><strong>${due}</strong> fällig</div>
    <div class="stat-pill"><strong>${learning}</strong> lernend</div>
    <div class="stat-pill"><strong>${mastered}</strong> beherrscht</div>
    <div class="stat-pill"><strong>${entries.length}</strong> gesamt</div>`;
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents(container, entries) {
  // Filter & Suche — re-render bei jeder Änderung
  ['#lib-search','#lib-filter-status','#lib-filter-lang','#lib-filter-tag','#lib-filter-due'].forEach(sel => {
    qs(sel, container)?.addEventListener('input', () => renderGrid(container, loadEntries()));
  });

  // Klick auf Karte → Editor öffnen
  qs('#lib-grid', container).addEventListener('click', e => {
    const card = e.target.closest('.entry-card');
    if (!card) return;
    openEditor(card.dataset.id, () => render(container));
  });

  // Kontextmenü / Rechtsklick → Löschen (einfach via confirm)
  qs('#lib-grid', container).addEventListener('contextmenu', e => {
    e.preventDefault();
    const card = e.target.closest('.entry-card');
    if (!card) return;
    const entry = loadEntries().find(x => x.id === card.dataset.id);
    if (!entry) return;
    if (confirm(`Eintrag „${entry.term}" wirklich löschen?`)) {
      deleteEntry(entry.id);
      render(container);
    }
  });
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function uniqueValues(entries, key) {
  return [...new Set(entries.map(e => e[key]).filter(Boolean))].sort();
}

function allTags(entries) {
  const set = new Set();
  entries.forEach(e => (e.tags ?? []).forEach(t => set.add(t)));
  return [...set].sort();
}

function statusLabel(s) {
  return { new: 'Neu', learning: 'Lernend', review: 'Wiederholung', mastered: 'Beherrscht' }[s] ?? s;
}

