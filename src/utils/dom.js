/** Kleine DOM-Hilfsfunktionen */

/** querySelector shorthand */
export const qs  = (sel, root = document) => root.querySelector(sel);

/** querySelectorAll shorthand */
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Element erstellen mit optionalem HTML */
export function el(tag, cls, html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** Datum YYYY-MM-DD → lesbares DE-Datum */
export function fmtDate(dateStr) {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

/** Fälligkeit beschreiben: "heute", "morgen", "in 5 Tagen", "vor 2 Tagen" */
export function relativeDue(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dateStr + 'T00:00:00');
  const diff  = Math.round((due - today) / 86400000);
  if (diff === 0) return 'heute fällig';
  if (diff === 1) return 'morgen fällig';
  if (diff === -1) return '1 Tag überfällig';
  if (diff < 0) return `${-diff} Tage überfällig`;
  return `in ${diff} Tagen`;
}

/** HTML-Zeichen maskieren */
export function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Text normalisieren für Antwortvergleich */
export function normalizeAnswer(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?'"]/g, '');
}

/** Levenshtein-Ähnlichkeit 0–1 */
export function similarity(a, b) {
  a = normalizeAnswer(a);
  b = normalizeAnswer(b);
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function levenshtein(a, b) {
  if (a.length < b.length) [a, b] = [b, a];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}
