/**
 * App-Bootstrap und Hash-basiertes Routing.
 *
 * Routen: #library (default) | #learn | #stats | #settings | #io
 */

import { requireAuth }           from './auth.js';
import { loadEntries, addEntry } from './data/store.js';
import { createEntry }           from './data/model.js';
import { EXAMPLE_ENTRIES }       from './data/examples.js';
import { openEditor }            from './views/editor.js';
import { render as renderLibrary  } from './views/library.js';
import { render as renderLearn    } from './views/learn.js';
import { render as renderStats    } from './views/stats.js';
import { render as renderSettings } from './views/settings.js';
import { render as renderIO       } from './views/io.js';
import { render as renderHelp     } from './views/help.js';

// ── Initialisierung ───────────────────────────────────────────────────────────

function init() {
  // Beispieldaten laden, wenn keine Einträge vorhanden
  if (loadEntries().length === 0) {
    EXAMPLE_ENTRIES.forEach(e => addEntry(e));
  }

  setupNav();
  route();

  // "+ Neu"-Button in der Navbar
  document.getElementById('btn-add-entry')?.addEventListener('click', () => {
    openEditor(null, () => route());
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

const VIEWS = {
  library:  renderLibrary,
  learn:    renderLearn,
  stats:    renderStats,
  settings: renderSettings,
  io:       renderIO,
  help:     renderHelp,
};

function route() {
  // Laufenden Key-Handler aufräumen (aus Learn-View)
  const container = document.getElementById('view-container');
  if (container?._keyHandler) {
    document.removeEventListener('keydown', container._keyHandler);
    container._keyHandler = null;
  }

  const hash   = window.location.hash.replace('#', '') || 'library';
  const viewFn = VIEWS[hash] ?? VIEWS.library;

  updateNavHighlight(hash);
  viewFn(container);
}

window.addEventListener('hashchange', route);

// ── Navigation ────────────────────────────────────────────────────────────────

function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      // Sofortige Highlight-Aktualisierung ohne auf hashchange warten
      updateNavHighlight(link.dataset.view);
    });
  });
}

function updateNavHighlight(activeView) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === activeView);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => requireAuth(init));
