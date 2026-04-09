/**
 * Benutzerauthentifizierung vor dem App-Start.
 *
 * Benutzerliste in .env setzen:
 *   VITE_USERS=[{"name":"Alice","password":"pw1"},{"name":"Bob","password":"pw2"}]
 * Auf Vercel: Umgebungsvariable VITE_USERS im Projekt-Dashboard eintragen.
 */

const USERS = (() => {
  try { return JSON.parse(import.meta.env.VITE_USERS ?? '[]'); } catch { return []; }
})();

const SESSION_KEY      = 'lernapp_auth';
const SESSION_USER_KEY = 'lernapp_user';

/** Aktuell angemeldeten Benutzernamen aus sessionStorage lesen */
export function currentUsername() {
  return sessionStorage.getItem(SESSION_USER_KEY) ?? '';
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  location.reload();
}

/**
 * Prüft ob bereits authentifiziert (sessionStorage).
 * Falls nicht, zeigt Login-Screen und ruft onSuccess() nach korrektem Login auf.
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
          Bitte anmelden um fortzufahren
        </p>

        <form id="login-form" novalidate>
          <input
            id="login-user"
            type="text"
            placeholder="Benutzername"
            autocomplete="username"
            style="font-size:1rem;margin-bottom:.5rem;width:100%;box-sizing:border-box"
            autofocus
          >
          <div style="position:relative;margin-bottom:.75rem">
            <input
              id="login-pw"
              type="password"
              placeholder="Passwort"
              autocomplete="current-password"
              style="font-size:1rem;width:100%;padding-right:2.5rem;box-sizing:border-box"
            >
            <button type="button" id="btn-toggle-pw" title="Passwort anzeigen" style="
              position:absolute;right:.6rem;top:50%;transform:translateY(-50%);
              background:none;border:none;cursor:pointer;font-size:1rem;
              color:var(--color-text-muted);padding:.25rem;line-height:1;
            ">👁</button>
          </div>
          <div id="login-error" style="
            display:none;
            color:var(--color-danger);
            font-size:.8125rem;
            margin-bottom:.75rem;
          ">Unbekannter Benutzer oder falsches Passwort</div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">
            Anmelden →
          </button>
        </form>
      </div>
    </div>
  `;

  const form     = document.getElementById('login-form');
  const userInput = document.getElementById('login-user');
  const pwInput  = document.getElementById('login-pw');
  const error    = document.getElementById('login-error');
  const togglePw = document.getElementById('btn-toggle-pw');

  togglePw.addEventListener('click', () => {
    const visible = pwInput.type === 'text';
    pwInput.type = visible ? 'password' : 'text';
    togglePw.title = visible ? 'Passwort anzeigen' : 'Passwort verbergen';
    togglePw.textContent = visible ? '👁' : '🙈';
    pwInput.focus();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = userInput.value.trim();
    const pw   = pwInput.value;
    const user = USERS.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === pw);

    if (user) {
      sessionStorage.setItem(SESSION_KEY, '1');
      sessionStorage.setItem(SESSION_USER_KEY, user.name);
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
            <span id="nav-username" style="font-size:.8125rem;color:var(--color-text-muted);white-space:nowrap"></span>
            <button id="btn-add-entry" class="btn btn-primary btn-sm">+ Neu</button>
            <button id="btn-logout" class="btn btn-secondary btn-sm">Abmelden</button>
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
      pwInput.value = '';
      pwInput.focus();
      pwInput.style.borderColor = 'var(--color-danger)';
      setTimeout(() => { pwInput.style.borderColor = ''; }, 1200);
    }
  });
}
