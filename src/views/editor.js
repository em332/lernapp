/**
 * Eintrag-Editor: Modal zum Erstellen und Bearbeiten von Lerneinträgen.
 * Wird über openEditor() aufgerufen, öffnet sich als Modal.
 */

import { addEntry, updateEntry, getEntry, loadEntries } from '../data/store.js';
import { createEntry, validateEntry, DIFFICULTY } from '../data/model.js';
import { qs } from '../utils/dom.js';

const overlay = () => qs('#modal-overlay');
const modalEl = () => qs('#modal-content');

/**
 * Modal öffnen.
 * @param {string|null} id       - null = neuer Eintrag, string = bestehenden bearbeiten
 * @param {Function}    onSave   - Callback nach erfolgreichem Speichern
 */
export function openEditor(id = null, onSave = () => {}) {
  const entry = id ? getEntry(id) : null;
  renderModal(entry, onSave);
  overlay().classList.remove('hidden');
}

export function closeEditor() {
  overlay().classList.add('hidden');
  modalEl().innerHTML = '';
}

// ── Rendering ────────────────────────────────────────────────────────────────

function renderModal(entry, onSave) {
  const isNew   = !entry;
  const data    = entry ?? createEntry();
  const langs   = [...new Set(loadEntries().map(e => e.language).filter(Boolean))];
  const allTags = [...new Set(loadEntries().flatMap(e => e.tags ?? []))];

  modalEl().innerHTML = `
    <div class="modal-header">
      <h2>${isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</h2>
      <button class="btn-icon modal-close" title="Schliessen">✕</button>
    </div>

    <form id="entry-form" novalidate>
      <div class="form-row">
        <div class="form-group">
          <label for="f-term">Begriff / Vokabel *</label>
          <input id="f-term" type="text" value="${esc(data.term)}" placeholder="z. B. Epiphanie" required autofocus>
        </div>
        <div class="form-group">
          <label for="f-lang">Sprache / Kategorie</label>
          <input id="f-lang" type="text" list="lang-list" value="${esc(data.language)}" placeholder="z. B. Deutsch">
          <datalist id="lang-list">
            ${langs.map(l => `<option value="${esc(l)}">`).join('')}
          </datalist>
        </div>
      </div>

      <div class="form-group">
        <label>Bedeutungen <button type="button" id="btn-add-meaning" class="btn btn-secondary btn-sm" style="margin-left:.5rem">+ Bedeutung</button></label>
        <div id="meanings-list" class="meanings-list">
          ${data.meanings.map((m, i) => meaningRowHTML(m, i)).join('')}
        </div>
      </div>

      <div class="form-group">
        <label for="f-example">Beispielsatz</label>
        <textarea id="f-example" rows="2" placeholder="Ein Beispielsatz im Kontext…">${esc(data.exampleSentence)}</textarea>
      </div>

      <div class="form-group">
        <label for="f-notes">Notizen</label>
        <textarea id="f-notes" rows="2" placeholder="Herkunft, Merkhinweis, verwandte Wörter…">${esc(data.notes)}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="f-difficulty">Schwierigkeit</label>
          <select id="f-difficulty">
            <option value="easy"   ${data.difficulty === 'easy'   ? 'selected' : ''}>Leicht</option>
            <option value="medium" ${data.difficulty === 'medium' ? 'selected' : ''}>Mittel</option>
            <option value="hard"   ${data.difficulty === 'hard'   ? 'selected' : ''}>Schwer</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tags</label>
          <div class="tags-input-wrapper" id="tags-wrapper"></div>
          <p class="form-hint">Enter drücken oder Komma zum Hinzufügen</p>
        </div>
      </div>

      <div id="form-errors" class="import-result error hidden"></div>
    </form>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" id="btn-cancel">Abbrechen</button>
      ${!isNew ? `<button type="button" class="btn btn-danger" id="btn-delete">Löschen</button>` : ''}
      <button type="button" class="btn btn-primary" id="btn-save">Speichern</button>
    </div>
  `;

  initTagsInput(data.tags ?? [], allTags);
  bindEditorEvents(data, isNew, onSave);
}

function meaningRowHTML(m, i) {
  return `
    <div class="meaning-item" data-index="${i}">
      <input type="text" class="m-definition" value="${esc(m.definition)}" placeholder="Definition / Erklärung">
      <input type="text" class="m-translation" value="${esc(m.translation)}" placeholder="Übersetzung (optional)">
      <button type="button" class="btn btn-icon remove-meaning" title="Entfernen" ${i === 0 ? 'style="opacity:.3;pointer-events:none"' : ''}>✕</button>
    </div>`;
}

// ── Tags-Input ────────────────────────────────────────────────────────────────

function initTagsInput(initial, suggestions) {
  const wrapper = qs('#tags-wrapper');
  let tags      = [...initial];

  function renderTags() {
    wrapper.innerHTML = tags.map(t =>
      `<span class="tag" data-tag="${esc(t)}">${esc(t)} ✕</span>`
    ).join('') + `<input type="text" id="tags-input" list="tags-suggestions" placeholder="${tags.length ? '' : 'Tag eingeben…'}">`;

    const dataList = document.createElement('datalist');
    dataList.id = 'tags-suggestions';
    suggestions.filter(s => !tags.includes(s)).forEach(s => {
      const opt = document.createElement('option'); opt.value = s;
      dataList.appendChild(opt);
    });
    wrapper.appendChild(dataList);

    // Tag entfernen
    wrapper.querySelectorAll('.tag').forEach(el => {
      el.addEventListener('click', () => {
        tags = tags.filter(t => t !== el.dataset.tag);
        renderTags();
      });
    });

    // Tag hinzufügen
    const inp = qs('#tags-input', wrapper);
    inp?.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) {
        e.preventDefault();
        const t = inp.value.trim().replace(/,$/, '');
        if (t && !tags.includes(t)) tags.push(t);
        inp.value = '';
        renderTags();
      }
    });
  }

  renderTags();
  wrapper.getTags = () => tags;
  wrapper.addEventListener('click', () => qs('#tags-input', wrapper)?.focus());
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEditorEvents(data, isNew, onSave) {
  const modal = modalEl();

  // Schliessen
  qs('.modal-close', modal).addEventListener('click', closeEditor);
  qs('#btn-cancel',  modal).addEventListener('click', closeEditor);
  overlay().addEventListener('click', e => { if (e.target === overlay()) closeEditor(); });

  // Bedeutung hinzufügen
  qs('#btn-add-meaning', modal).addEventListener('click', () => {
    const list  = qs('#meanings-list', modal);
    const count = list.querySelectorAll('.meaning-item').length;
    list.insertAdjacentHTML('beforeend', meaningRowHTML({ definition: '', translation: '' }, count));
    list.querySelector('.meaning-item:last-child .m-definition').focus();
  });

  // Bedeutung entfernen
  qs('#meanings-list', modal).addEventListener('click', e => {
    const btn = e.target.closest('.remove-meaning');
    if (!btn) return;
    btn.closest('.meaning-item').remove();
    // Index neu setzen für ersten Eintrag (kein Löschen)
    qs('#meanings-list', modal).querySelectorAll('.meaning-item').forEach((el, i) => {
      el.dataset.index = i;
      el.querySelector('.remove-meaning').style.opacity = i === 0 ? '.3' : '1';
      el.querySelector('.remove-meaning').style.pointerEvents = i === 0 ? 'none' : '';
    });
  });

  // Löschen
  qs('#btn-delete', modal)?.addEventListener('click', () => {
    if (confirm(`Eintrag „${data.term}" wirklich löschen?`)) {
      import('../data/store.js').then(({ deleteEntry }) => {
        deleteEntry(data.id);
        closeEditor();
        onSave();
      });
    }
  });

  // Speichern
  qs('#btn-save', modal).addEventListener('click', () => saveEntry(data, isNew, onSave));

  // Enter im Formular → Speichern (nicht für Textarea)
  qs('#entry-form', modal).addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      saveEntry(data, isNew, onSave);
    }
  });
}

function saveEntry(data, isNew, onSave) {
  const modal = modalEl();

  const term     = qs('#f-term', modal).value.trim();
  const language = qs('#f-lang', modal).value.trim();
  const example  = qs('#f-example', modal).value.trim();
  const notes    = qs('#f-notes', modal).value.trim();
  const diff     = qs('#f-difficulty', modal).value;
  const tags     = qs('#tags-wrapper', modal)?.getTags?.() ?? [];

  // Bedeutungen sammeln
  const meanings = [...modal.querySelectorAll('.meaning-item')].map(row => ({
    definition:  row.querySelector('.m-definition')?.value.trim() ?? '',
    translation: row.querySelector('.m-translation')?.value.trim() ?? '',
  })).filter(m => m.definition || m.translation);

  const raw = { term, language, meanings, exampleSentence: example, notes, difficulty: diff, tags };
  const errs = validateEntry(raw);

  const errBox = qs('#form-errors', modal);
  if (errs.length) {
    errBox.innerHTML = errs.map(e => `<div>• ${e}</div>`).join('');
    errBox.classList.remove('hidden');
    return;
  }
  errBox.classList.add('hidden');

  if (isNew) {
    addEntry(raw);
  } else {
    updateEntry(data.id, { ...raw, updatedAt: new Date().toISOString() });
  }

  closeEditor();
  onSave();
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
