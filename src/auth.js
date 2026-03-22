/**
 * Einfache Passwortabfrage vor dem App-Start.
 *
 * Passwort hier ändern:
 */
const PASSWORD = 'learn2026';

const SESSION_KEY = 'lernapp_auth';

/**
 * Prüft ob bereits authentifiziert (sessionStorage).
 * Falls nicht, zeigt Login-Screen und ruft onSuccess() nach korrektem Passwort auf.
 *
 * @param {Function} onSuccess - wird nach erfolgreicher Authentifizierung aufgerufen
 */
export function requireAuth(onSuccess) {
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    onSuccess();
    return;
  }
  renderLogin(onSuccess);
}

function renderLogin(onSuccess) {
  document.getElementById('app').innerHTML = `
    <div id="login-screen" style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg);
      padding: 1rem;
    ">
      <div style="
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 2.5rem 2rem;
        width: 100%;
        max-width: 360px;
        text-align: center;
      ">
        <div style="font-size:2.5rem;margin-bottom:.75rem">◈</div>
        <h1 style="font-size:1.35rem;font-weight:700;margin-bottom:.25rem">LernApp</h1>
        <p style="font-size:.875rem;color:var(--color-text-muted);margin-bottom:1.75rem">
          Passwort eingeben um fortzufahren
        </p>

        <form id="login-form" novalidate>
          <input
            id="login-pw"
            type="password"
            placeholder="Passwort"
            autocomplete="current-password"
            style="text-align:center;font-size:1rem;margin-bottom:.75rem"
            autofocus
          >
          <div id="login-error" style="
            display:none;
            color:var(--color-danger);
            font-size:.8125rem;
            margin-bottom:.75rem;
          ">Falsches Passwort</div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">
            Weiter →
          </button>
        </form>
      </div>
    </div>
  `;

  const form  = document.getElementById('login-form');
  const input = document.getElementById('login-pw');
  const error = document.getElementById('login-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (input.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      // App-Grundstruktur wiederherstellen und starten
      document.getElementById('app').innerHTML = `
        <nav id="main-nav">
          <div class="nav-brand">
            <span class="nav-logo">◈</span>
            <span class="nav-title">LernApp</span>
          </div>
          <div class="nav-links">
            <a href="#library"  class="nav-link" data-view="library">Bibliothek</a>
            <a href="#learn"    class="nav-link" data-view="learn">Lernen</a>
            <a href="#stats"    class="nav-link" data-view="stats">Statistik</a>
            <a href="#settings" class="nav-link" data-view="settings">Einstellungen</a>
            <a href="#io"       class="nav-link" data-view="io">Import / Export</a>
            <a href="#help"     class="nav-link" data-view="help">Hilfe</a>
          </div>
          <div class="nav-actions">
            <button id="btn-add-entry" class="btn btn-primary btn-sm">+ Neu</button>
          </div>
        </nav>
        <div id="modal-overlay" class="modal-overlay hidden">
          <div id="modal-content" class="modal-content"></div>
        </div>
        <main id="view-container"></main>
      `;
      onSuccess();
    } else {
      error.style.display = 'block';
      input.value = '';
      input.focus();
      // Kurzes Schütteln als visuelles Feedback
      input.style.animation = 'none';
      input.offsetHeight; // reflow
      input.style.borderColor = 'var(--color-danger)';
      setTimeout(() => { input.style.borderColor = ''; }, 1200);
    }
  });
}
