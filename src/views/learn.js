/**
 * Lern-View: Setup-Screen + Lernsitzung
 *
 * Modi:
 *  - flashcard : Begriff anzeigen, umblättern, bewerten
 *  - write     : Begriff anzeigen, Antwort eintippen, vergleichen, bewerten
 *
 * Quellen:
 *  - due       : heute fällige Karten (neue + Review)
 *  - new       : nur neue Karten
 *  - difficult : Karten mit schlechter Bewertungshistorie (oft "Nochmal")
 */

import { loadEntries, updateEntry, deleteEntry, loadSettings } from '../data/store.js';
import { isDue, STATUS }                          from '../data/model.js';
import { schedule, RATING, RATING_LABELS, RATING_COLORS } from '../srs/algorithm.js';
import { qs, similarity }                         from '../utils/dom.js';

export function render(container) {
  renderSetup(container);
}

// ── Setup-Screen ──────────────────────────────────────────────────────────────

function renderSetup(container) {
  const entries  = loadEntries();
  const settings = loadSettings();
  const dueCards = entries.filter(isDue);
  const newCards = entries.filter(e => e.status === STATUS.NEW);
  const hardCards= entries.filter(e => (e.history ?? []).slice(-3).some(h => h.rating === 0));

  container.innerHTML = `
    <div class="learn-setup">
      <h1>Lernen</h1>

      <div class="mode-selector" id="source-selector">
        <div class="mode-card selected" data-source="due">
          <span class="mode-card-icon">📅</span>
          <div>
            <h3>Fällige Karten</h3>
            <p>${dueCards.length} Karten fällig (neue + Wiederholungen)</p>
          </div>
        </div>
        <div class="mode-card" data-source="new">
          <span class="mode-card-icon">✨</span>
          <div>
            <h3>Nur neue Karten</h3>
            <p>${Math.min(newCards.length, settings.newCardsPerDay)} neue Karten (max. ${settings.newCardsPerDay}/Tag)</p>
          </div>
        </div>
        <div class="mode-card" data-source="difficult">
          <span class="mode-card-icon">🎯</span>
          <div>
            <h3>Schwierige Karten</h3>
            <p>${hardCards.length} Karten, die zuletzt falsch beantwortet wurden</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom:1.25rem">
        <label style="font-size:.8125rem;font-weight:600;color:var(--color-text-muted);display:block;margin-bottom:.5rem">Lernmodus</label>
        <div class="mode-selector" id="learn-mode-selector">
          <div class="mode-card selected" data-mode="flashcard">
            <span class="mode-card-icon">🃏</span>
            <div><h3>Karteikarte</h3><p>Begriff anzeigen, umblättern und selbst bewerten</p></div>
          </div>
          <div class="mode-card" data-mode="write">
            <span class="mode-card-icon">✍️</span>
            <div><h3>Schreiben</h3><p>Begriff anzeigen, Antwort eintippen und vergleichen</p></div>
          </div>
        </div>
      </div>

      <button id="btn-start-session" class="btn btn-primary btn-lg" style="width:100%">
        Sitzung starten →
      </button>

      ${dueCards.length === 0 && newCards.length === 0
        ? `<p class="text-muted mt-2" style="text-align:center">Toll — keine fälligen Karten! Leg neue an oder komm später wieder.</p>`
        : ''}
    </div>`;

  let selectedSource = 'due';
  let selectedMode   = 'flashcard';

  qs('#source-selector', container).addEventListener('click', e => {
    const card = e.target.closest('.mode-card');
    if (!card) return;
    qs('#source-selector .selected', container)?.classList.remove('selected');
    card.classList.add('selected');
    selectedSource = card.dataset.source;
  });

  qs('#learn-mode-selector', container).addEventListener('click', e => {
    const card = e.target.closest('.mode-card');
    if (!card) return;
    qs('#learn-mode-selector .selected', container)?.classList.remove('selected');
    card.classList.add('selected');
    selectedMode = card.dataset.mode;
  });

  qs('#btn-start-session', container).addEventListener('click', () => {
    const cards = buildDeck(selectedSource, entries, settings);
    if (cards.length === 0) {
      alert('Keine Karten für diese Auswahl verfügbar.');
      return;
    }
    startSession(container, cards, selectedMode);
  });
}

// ── Deck bauen ────────────────────────────────────────────────────────────────

function buildDeck(source, entries, settings) {
  let pool;
  if (source === 'due') {
    pool = entries.filter(isDue).slice(0, settings.reviewsPerSession);
  } else if (source === 'new') {
    pool = entries.filter(e => e.status === STATUS.NEW).slice(0, settings.newCardsPerDay);
  } else {
    pool = entries.filter(e => (e.history ?? []).slice(-3).some(h => h.rating === 0));
  }
  // Mischen (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// ── Sitzung ───────────────────────────────────────────────────────────────────

function startSession(container, cards, mode) {
  const session = {
    cards,
    current: 0,
    mode,
    results: [],  // { rating, term }
    revealed: false,
  };
  renderCard(container, session);
}

function renderCard(container, session) {
  const { cards, current, mode } = session;
  if (current >= cards.length) { renderSummary(container, session); return; }

  const entry    = cards[current];
  const pct      = Math.round((current / cards.length) * 100);
  const settings = loadSettings();

  container.innerHTML = `
    <div class="learn-session">
      <div class="session-progress">
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="progress-text">${current + 1} / ${cards.length}</span>
      </div>

      <div class="flashcard-wrap">
        <div class="flashcard" id="flashcard">
          <button id="btn-delete-card" title="Eintrag löschen" style="
            position:absolute;top:.6rem;right:.6rem;
            background:none;border:none;cursor:pointer;
            font-size:.8rem;color:var(--color-text-subtle);
            padding:.25rem .4rem;border-radius:var(--radius-sm);
            transition:background var(--transition),color var(--transition);
          " onmouseover="this.style.background='#fee2e2';this.style.color='var(--color-danger)'"
             onmouseout="this.style.background='none';this.style.color='var(--color-text-subtle)'">
            🗑 Löschen
          </button>
          ${cardFrontHTML(entry, settings)}
          <div id="card-answer" class="flashcard-answer hidden"></div>
        </div>
      </div>

      ${mode === 'write' ? writeInputHTML() : ''}

      <div id="action-area">
        ${mode === 'flashcard' ? revealButtonHTML() : writeSubmitHTML()}
      </div>
    </div>`;

  bindCardEvents(container, session);
}

function cardFrontHTML(entry, settings) {
  const first = entry.meanings?.[0] ?? {};
  return `
    <div class="flashcard-language">${esc(entry.language || 'Begriff')}</div>
    <div class="flashcard-term">${esc(entry.term)}</div>
    ${settings.showExampleOnFront && entry.exampleSentence
      ? `<div class="flashcard-example">${esc(entry.exampleSentence)}</div>` : ''}`;
}

function cardAnswerHTML(entry) {
  const meanings = entry.meanings ?? [];
  const mHtml = meanings.map(m => `
    <div class="flashcard-definition">${esc(m.definition)}</div>
    ${m.translation ? `<div class="flashcard-translation">${esc(m.translation)}</div>` : ''}
  `).join('<hr style="border:none;border-top:1px solid var(--color-border);margin:.5rem 0">');

  return `
    ${mHtml}
    ${entry.exampleSentence
      ? `<div class="flashcard-example">${esc(entry.exampleSentence)}</div>` : ''}
    ${entry.notes
      ? `<div class="flashcard-notes">${esc(entry.notes)}</div>` : ''}`;
}

function revealButtonHTML() {
  return `
    <div style="display:flex;gap:.75rem;justify-content:center">
      <button class="btn btn-primary btn-lg" id="btn-reveal" style="min-width:200px">
        Umblättern (Leertaste)
      </button>
    </div>
    <p class="reveal-hint">Leertaste oder Klicken zum Aufdecken</p>`;
}

function writeInputHTML() {
  return `
    <div class="write-area">
      <input type="text" class="write-input" id="write-input"
             placeholder="Antwort eingeben…" autocomplete="off" spellcheck="false">
      <div id="write-feedback" class="write-feedback hidden"></div>
    </div>`;
}

function writeSubmitHTML() {
  return `
    <div style="display:flex;gap:.75rem;justify-content:center">
      <button class="btn btn-primary btn-lg" id="btn-write-submit" style="min-width:200px">
        Prüfen (Enter)
      </button>
    </div>`;
}

function ratingButtonsHTML(entry) {
  return `
    <div class="rating-buttons">
      ${RATING_LABELS.map((label, i) => {
        const days = previewDays(entry, i);
        return `<button class="rating-btn rating-btn-${i}" data-rating="${i}" style="background:${RATING_COLORS[i]}">
          ${label}
          <span>${days}</span>
        </button>`;
      }).join('')}
    </div>
    <p class="reveal-hint" style="text-align:center;margin-top:.75rem">
      Tastatur: 1 = Nochmal, 2 = Schwer, 3 = Gut, 4 = Leicht
    </p>`;
}

function previewDays(entry, rating) {
  const { schedule: sched } = (() => {
    try { return { schedule: schedule(entry, rating) }; } catch { return { schedule: { interval: 1 } }; }
  })();
  const days = sched.interval;
  if (days <= 0) return 'jetzt';
  if (days === 1) return '1 Tag';
  return `${days} Tage`;
}

// ── Events (Karteikarte + Schreiben) ─────────────────────────────────────────

function bindCardEvents(container, session) {
  const { mode } = session;

  if (mode === 'flashcard') {
    const revealBtn  = qs('#btn-reveal', container);
    const flashcard  = qs('#flashcard', container);
    const answer     = qs('#card-answer', container);
    const actionArea = qs('#action-area', container);

    function reveal() {
      if (session.revealed) return;
      session.revealed = true;
      answer.innerHTML = cardAnswerHTML(session.cards[session.current]);
      answer.classList.remove('hidden');
      flashcard.classList.add('revealed');
      actionArea.innerHTML = ratingButtonsHTML(session.cards[session.current]);
      bindRatingEvents(container, session);
    }

    revealBtn?.addEventListener('click', reveal);
    // Klick auf Karte aufdecken, aber nicht wenn Löschen-Button gedrückt
    flashcard.addEventListener('click', e => {
      if (e.target.closest('#btn-delete-card')) return;
      reveal();
    });
  } else {
    // Write mode
    const input  = qs('#write-input', container);
    input?.focus();

    function submitWrite() {
      if (session.revealed) return;
      const userAnswer = input?.value ?? '';
      session.revealed = true;
      evaluateWrite(container, session, userAnswer);
    }

    qs('#btn-write-submit', container)?.addEventListener('click', submitWrite);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') submitWrite(); });
  }

  // Eintrag während der Sitzung löschen
  qs('#btn-delete-card', container)?.addEventListener('click', () => {
    const entry = session.cards[session.current];
    if (!confirm(`„${entry.term}" wirklich löschen?`)) return;
    deleteEntry(entry.id);
    // Karte aus dem Deck entfernen und zur nächsten springen
    session.cards.splice(session.current, 1);
    if (session.current >= session.cards.length) session.current = session.cards.length - 1;
    if (session.cards.length === 0) { renderSummary(container, session); return; }
    session.revealed = false;
    renderCard(container, session);
  });

  // Tastenkürzel für Bewertung und Aufdecken
  const keyHandler = e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (!session.revealed && mode === 'flashcard') qs('#btn-reveal', container)?.click();
    }
    if (session.revealed) {
      const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (map[e.key] !== undefined) {
        document.removeEventListener('keydown', keyHandler);
        applyRating(container, session, map[e.key]);
      }
    }
  };
  document.addEventListener('keydown', keyHandler);
  // Handler sauber entfernen wenn View wechselt
  container._keyHandler = keyHandler;
}

function evaluateWrite(container, session, userAnswer) {
  const entry    = session.cards[session.current];
  const targets  = (entry.meanings ?? []).flatMap(m => [m.definition, m.translation]).filter(Boolean);
  const best     = Math.max(...targets.map(t => similarity(userAnswer, t)));

  const feedback = qs('#write-feedback', container);
  const actionArea = qs('#action-area', container);

  let cls, msg;
  if (best >= 0.9) {
    cls = 'correct';   msg = `Richtig! ✓`;
  } else if (best >= 0.65) {
    cls = 'partial';   msg = `Fast! Erwartet: ${targets[0]}`;
  } else {
    cls = 'incorrect'; msg = `Falsch. Erwartet: ${targets[0]}`;
  }

  feedback.className = `write-feedback ${cls}`;
  feedback.innerHTML = msg + (entry.exampleSentence ? `<br><em>${esc(entry.exampleSentence)}</em>` : '');
  feedback.classList.remove('hidden');

  // Antwort auch auf Karteikarte zeigen
  const answer = qs('#card-answer', container);
  answer.innerHTML = cardAnswerHTML(entry);
  answer.classList.remove('hidden');
  qs('#flashcard', container).classList.add('revealed');

  actionArea.innerHTML = ratingButtonsHTML(entry);
  bindRatingEvents(container, session);
}

function bindRatingEvents(container, session) {
  qs('#action-area', container).addEventListener('click', e => {
    const btn = e.target.closest('.rating-btn');
    if (!btn) return;
    const rating = parseInt(btn.dataset.rating);
    if (isNaN(rating)) return;
    applyRating(container, session, rating);
  });
}

function applyRating(container, session, rating) {
  if (container._keyHandler) {
    document.removeEventListener('keydown', container._keyHandler);
    container._keyHandler = null;
  }
  const entry   = session.cards[session.current];
  const changes = schedule(entry, rating);
  updateEntry(entry.id, changes);

  session.results.push({ rating, term: entry.term });
  session.current++;
  session.revealed = false;
  renderCard(container, session);
}

// ── Zusammenfassung ───────────────────────────────────────────────────────────

function renderSummary(container, session) {
  const total   = session.results.length;
  const correct = session.results.filter(r => r.rating >= 2).length;
  const again   = session.results.filter(r => r.rating === 0).length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;

  container.innerHTML = `
    <div class="session-summary">
      <h2>Sitzung abgeschlossen 🎉</h2>
      <p>${total} Karten durchgegangen</p>

      <div class="summary-grid">
        <div class="summary-stat">
          <strong style="color:var(--color-success)">${correct}</strong>
          <span>Richtig (Gut/Leicht)</span>
        </div>
        <div class="summary-stat">
          <strong style="color:var(--color-danger)">${again}</strong>
          <span>Nochmal</span>
        </div>
        <div class="summary-stat">
          <strong>${pct}%</strong>
          <span>Trefferquote</span>
        </div>
      </div>

      <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-lg" id="btn-restart">Neue Sitzung</button>
        <a href="#library" class="btn btn-secondary btn-lg">Zur Bibliothek</a>
      </div>
    </div>`;

  qs('#btn-restart', container)?.addEventListener('click', () => render(container));
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
