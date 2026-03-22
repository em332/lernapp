/**
 * Einstellungen-View: Lernparameter konfigurieren.
 */

import { loadSettings, saveSettings, DEFAULT_SETTINGS, loadEntries, saveEntries } from '../data/store.js';
import { qs } from '../utils/dom.js';

export function render(container) {
  const s = loadSettings();

  container.innerHTML = `
    <h1 class="section-title">Einstellungen</h1>

    <div class="settings-sections">

      <div class="settings-section">
        <h3>Tagespensum</h3>
        ${settingRow('Neue Karten pro Tag', 'newCardsPerDay', 'number', s.newCardsPerDay,
          'Wie viele neue Karten werden pro Tag eingeführt.', { min: 1, max: 200 })}
        ${settingRow('Reviews pro Sitzung', 'reviewsPerSession', 'number', s.reviewsPerSession,
          'Maximale Anzahl Wiederholungen in einer Sitzung.', { min: 1, max: 500 })}
      </div>

      <div class="settings-section">
        <h3>SRS-Algorithmus</h3>
        ${settingRow('Leicht-Bonus', 'easyBonus', 'number', s.easyBonus,
          'Multiplikator für das Intervall bei Bewertung „Leicht" (Standard: 1.3).', { min: 1.0, max: 3.0, step: 0.05 })}
        ${settingRow('Intervall-Modifier', 'intervalModifier', 'number', s.intervalModifier,
          'Globaler Faktor für alle Intervalle. < 1 = intensiver, > 1 = lockerer (Standard: 1.0).', { min: 0.1, max: 3.0, step: 0.05 })}
        ${settingRow('Max. Intervall (Tage)', 'maxIntervalDays', 'number', s.maxIntervalDays,
          'Längst mögliches Wiederholungsintervall in Tagen.', { min: 30, max: 3650 })}
      </div>

      <div class="settings-section">
        <h3>Darstellung</h3>
        ${settingRow('Beispiel auf Vorderseite', 'showExampleOnFront', 'checkbox', s.showExampleOnFront,
          'Beispielsatz bereits auf der Vorderseite der Karteikarte anzeigen.')}
      </div>

      <div class="settings-section">
        <h3>Daten</h3>
        <p style="font-size:.875rem;color:var(--color-text-muted);margin-bottom:1rem">
          Einstellungen und Lernfortschritt werden lokal im Browser gespeichert.
        </p>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-secondary" id="btn-reset-settings">Einstellungen zurücksetzen</button>
          <button class="btn btn-danger"    id="btn-clear-data">Alle Daten löschen</button>
        </div>
        <p class="form-hint mt-1">„Alle Daten löschen" entfernt alle Einträge unwiderruflich aus dem Browser.</p>
      </div>

    </div>

    <div id="settings-saved" class="import-result success hidden" style="max-width:600px;margin-top:1rem">
      Einstellungen gespeichert.
    </div>
  `;

  bindSettingsEvents(container, s);
}

function settingRow(label, key, type, value, hint, attrs = {}) {
  let control = '';
  if (type === 'checkbox') {
    control = `<input type="checkbox" id="s-${key}" ${value ? 'checked' : ''} style="width:auto;accent-color:var(--color-primary)">`;
  } else {
    const extra = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    control = `<input type="number" id="s-${key}" value="${value}" ${extra} style="width:100px;text-align:right">`;
  }
  return `
    <div class="setting-row">
      <div class="setting-info">
        <h4>${label}</h4>
        <p>${hint}</p>
      </div>
      <div class="setting-control">${control}</div>
    </div>`;
}

function bindSettingsEvents(container, initialSettings) {
  const keys = ['newCardsPerDay','reviewsPerSession','easyBonus','intervalModifier','maxIntervalDays','showExampleOnFront'];

  function readSettings() {
    const s = { ...initialSettings };
    for (const key of keys) {
      const el = qs(`#s-${key}`, container);
      if (!el) continue;
      if (el.type === 'checkbox') s[key] = el.checked;
      else s[key] = parseFloat(el.value) || DEFAULT_SETTINGS[key];
    }
    return s;
  }

  // Auto-save bei jeder Änderung
  container.addEventListener('change', e => {
    if (e.target.closest('.settings-section')) {
      saveSettings(readSettings());
      const saved = qs('#settings-saved', container);
      saved.classList.remove('hidden');
      setTimeout(() => saved.classList.add('hidden'), 2000);
    }
  });

  qs('#btn-reset-settings', container).addEventListener('click', () => {
    if (!confirm('Einstellungen auf Standard zurücksetzen?')) return;
    saveSettings({ ...DEFAULT_SETTINGS });
    render(container);
  });

  qs('#btn-clear-data', container).addEventListener('click', () => {
    const count = loadEntries().length;
    if (!confirm(`Wirklich alle ${count} Einträge unwiderruflich löschen?`)) return;
    saveEntries([]);
    alert('Alle Einträge wurden gelöscht.');
  });
}
