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
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
