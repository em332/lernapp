/**
 * Import/Export-View: JSON und CSV importieren und exportieren.
 */

import { loadEntries, importEntries, saveEntries } from '../data/store.js';
import { createEntry, validateEntry }               from '../data/model.js';
import { toCSV, fromCSV }                           from '../utils/csv.js';
import { qs }                                       from '../utils/dom.js';

export function render(container) {
  container.innerHTML = `
    <h1 class="section-title">Import / Export</h1>

    <div class="io-sections">

      <!-- Export -->
      <div class="io-section">
        <h3>Export</h3>
        <p>Alle ${loadEntries().length} Einträge exportieren — inkl. Lernfortschritt und SRS-Daten.</p>
        <div class="io-actions">
          <button class="btn btn-primary" id="btn-export-json">JSON exportieren</button>
          <button class="btn btn-secondary" id="btn-export-csv">CSV exportieren</button>
        </div>
        <p class="form-hint mt-1">JSON enthält alle Felder (empfohlen für Backup). CSV enthält nur die Basisfelder.</p>
      </div>

      <!-- Import -->
      <div class="io-section">
        <h3>Import</h3>
        <p>JSON- oder CSV-Datei importieren. Bestehende Einträge mit gleicher ID werden überschrieben.</p>

        <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
          <label style="font-size:.8125rem;font-weight:600;color:var(--color-text-muted)">Importmodus:</label>
          <label style="display:flex;align-items:center;gap:.35rem;font-size:.875rem;cursor:pointer">
            <input type="radio" name="import-mode" value="merge" checked> Zusammenführen (empfohlen)
          </label>
          <label style="display:flex;align-items:center;gap:.35rem;font-size:.875rem;cursor:pointer">
            <input type="radio" name="import-mode" value="replace"> Ersetzen (löscht alle bestehenden!)
          </label>
        </div>

        <div class="drop-zone" id="drop-zone">
          <div style="font-size:2rem;margin-bottom:.5rem">📂</div>
          <div>Datei hier ablegen oder <label for="file-input" style="color:var(--color-primary);cursor:pointer;font-weight:500">auswählen</label></div>
          <div style="font-size:.75rem;color:var(--color-text-subtle);margin-top:.25rem">JSON oder CSV</div>
          <input type="file" id="file-input" accept=".json,.csv" class="hidden">
        </div>

        <div id="import-result"></div>
      </div>

      <!-- Format-Dokumentation -->
      <div class="io-section">
        <h3>Importformat — JSON</h3>
        <p>Array von Einträgen. Pflichtfeld: <code>term</code>. Alle anderen Felder sind optional.</p>
        <div class="code-block">${jsonExampleEsc()}</div>
      </div>

      <div class="io-section">
        <h3>Importformat — CSV</h3>
        <p>Erste Zeile ist der Header. Pflichtfeld: <code>term</code>. Mehrere Tags mit Semikolon trennen.</p>
        <div class="code-block">term,language,definition,translation,exampleSentence,notes,difficulty,tags,status
Epiphanie,Deutsch,"Plötzliche Erkenntnis",epiphany,"Sie hatte eine Epiphanie.",,medium,Fremdwort;Philosophie,new
Procrastination,Englisch,Aufschieberitis,procrastination,,,easy,Psychologie,new</div>
      </div>

    </div>
  `;

  bindIOEvents(container);
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindIOEvents(container) {
  // Export JSON
  qs('#btn-export-json', container).addEventListener('click', () => {
    const data = JSON.stringify(loadEntries(), null, 2);
    download(data, 'lernapp-export.json', 'application/json');
  });

  // Export CSV
  qs('#btn-export-csv', container).addEventListener('click', () => {
    const data = toCSV(loadEntries());
    download(data, 'lernapp-export.csv', 'text/csv');
  });

  // Datei-Input
  qs('#file-input', container).addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) processFile(container, file);
    e.target.value = '';
  });

  // Drop-Zone
  const zone = qs('#drop-zone', container);
  zone.addEventListener('click', e => {
    // Label öffnet den Picker nativ via for="file-input" — kein zweites .click() nötig
    if (e.target.closest('label')) return;
    qs('#file-input', container).click();
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(container, file);
  });
}

function processFile(container, file) {
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const mode = container.querySelector('input[name="import-mode"]:checked')?.value ?? 'merge';
    try {
      if (file.name.endsWith('.csv')) {
        importCSV(container, text, mode);
      } else {
        importJSON(container, text, mode);
      }
    } catch (err) {
      showResult(container, false, [`Fehler beim Lesen der Datei: ${err.message}`]);
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function importJSON(container, text, mode) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new Error('Ungültiges JSON.'); }

  if (!Array.isArray(raw)) {
    // Auch einzelne Einträge oder { entries: [...] } akzeptieren
    if (raw && Array.isArray(raw.entries)) raw = raw.entries;
    else if (raw && typeof raw === 'object' && raw.term) raw = [raw];
    else throw new Error('JSON muss ein Array von Einträgen sein.');
  }

  validateAndImport(container, raw, mode);
}

function importCSV(container, text, mode) {
  const raw = fromCSV(text);
  validateAndImport(container, raw, mode);
}

function validateAndImport(container, raw, mode) {
  const errors   = [];
  const valid    = [];

  for (let i = 0; i < raw.length; i++) {
    const errs = validateEntry(raw[i]);
    if (errs.length) {
      errors.push(`Zeile ${i + 1} (${raw[i].term ?? '?'}): ${errs.join(', ')}`);
    } else {
      valid.push(createEntry(raw[i]));
    }
  }

  if (valid.length === 0 && errors.length > 0) {
    showResult(container, false, errors);
    return;
  }

  if (mode === 'replace' && !confirm(`Alle bestehenden Einträge löschen und durch ${valid.length} importierte ersetzen?`)) return;

  importEntries(valid, mode);

  const msgs = [`${valid.length} Einträge erfolgreich importiert.`];
  if (errors.length) msgs.push(`${errors.length} Zeile(n) übersprungen.`, ...errors.slice(0, 5));
  showResult(container, errors.length === 0 || valid.length > 0, msgs);

  // Zähler aktualisieren
  const exportSec = qs('.io-section p', container);
  if (exportSec) exportSec.textContent = `Alle ${loadEntries().length} Einträge exportieren — inkl. Lernfortschritt und SRS-Daten.`;
}

function showResult(container, success, messages) {
  const el = qs('#import-result', container);
  el.innerHTML = `
    <div class="import-result ${success ? 'success' : 'error'}">
      ${messages[0]}
      ${messages.length > 1 ? `<ul>${messages.slice(1).map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function download(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function jsonExampleEsc() {
  const example = [
    {
      term: 'Epiphanie',
      language: 'Deutsch',
      meanings: [
        { definition: 'Plötzliche Erkenntnis', translation: 'epiphany' }
      ],
      exampleSentence: 'Sie hatte eine Epiphanie beim Lesen.',
      notes: 'Von griech. epiphaneia – Erscheinung.',
      difficulty: 'medium',
      tags: ['Fremdwort', 'Philosophie']
    }
  ];
  return JSON.stringify(example, null, 2)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
