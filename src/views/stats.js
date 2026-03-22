/**
 * Statistik-View: Überblick über Lernfortschritt und fällige Karten.
 */

import { loadEntries } from '../data/store.js';
import { isDue, STATUS } from '../data/model.js';
import { fmtDate } from '../utils/dom.js';

export function render(container) {
  const entries = loadEntries();
  const today   = new Date(); today.setHours(0, 0, 0, 0);

  // Fälligkeitsverteilung: heute + nächste 6 Tage
  const dueDist = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    return { label: i === 0 ? 'Heute' : dayLabel(d), count: entries.filter(e => e.dueDate === key).length };
  });
  const maxBar = Math.max(...dueDist.map(d => d.count), 1);

  // Status-Verteilung
  const counts = {
    [STATUS.NEW]:      entries.filter(e => e.status === STATUS.NEW).length,
    [STATUS.LEARNING]: entries.filter(e => e.status === STATUS.LEARNING).length,
    [STATUS.REVIEW]:   entries.filter(e => e.status === STATUS.REVIEW).length,
    [STATUS.MASTERED]: entries.filter(e => e.status === STATUS.MASTERED).length,
  };
  const total  = entries.length || 1;

  // Gesamtstatistik aus Verlauf
  const allHistory = entries.flatMap(e => e.history ?? []);
  const totalReviews  = allHistory.length;
  const correctReviews = allHistory.filter(h => h.rating >= 2).length;
  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

  // Lernstreak (Tage hintereinander, an denen eine Sitzung stattfand)
  const streak = calcStreak(allHistory);

  container.innerHTML = `
    <h1 class="section-title">Statistik</h1>

    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-card-value" style="color:var(--color-danger)">${entries.filter(isDue).length}</div>
        <div class="stats-card-label">Heute fällig</div>
      </div>
      <div class="stats-card">
        <div class="stats-card-value">${entries.length}</div>
        <div class="stats-card-label">Einträge gesamt</div>
      </div>
      <div class="stats-card">
        <div class="stats-card-value" style="color:var(--color-success)">${counts[STATUS.MASTERED]}</div>
        <div class="stats-card-label">Beherrscht</div>
      </div>
      <div class="stats-card">
        <div class="stats-card-value">${accuracy}%</div>
        <div class="stats-card-label">Trefferquote</div>
      </div>
      <div class="stats-card">
        <div class="stats-card-value">${totalReviews}</div>
        <div class="stats-card-label">Reviews gesamt</div>
      </div>
      <div class="stats-card">
        <div class="stats-card-value" style="color:var(--color-warning)">${streak}</div>
        <div class="stats-card-label">Tage-Streak</div>
      </div>
    </div>

    <div class="due-chart">
      <h3>Fällige Karten — nächste 7 Tage</h3>
      <div class="chart-bars">
        ${dueDist.map(d => `
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height:${Math.round((d.count / maxBar) * 100)}px" title="${d.count} Karten"></div>
            <div class="chart-bar-label">${d.label}<br><strong>${d.count}</strong></div>
          </div>`).join('')}
      </div>
    </div>

    <div class="status-breakdown">
      <h3>Status-Verteilung</h3>
      ${statusRow('Neu',          STATUS.NEW,      counts, total, '#8b5cf6')}
      ${statusRow('Lernend',      STATUS.LEARNING, counts, total, '#f59e0b')}
      ${statusRow('Wiederholung', STATUS.REVIEW,   counts, total, '#3b82f6')}
      ${statusRow('Beherrscht',   STATUS.MASTERED, counts, total, '#22c55e')}
    </div>
  `;
}

function statusRow(label, key, counts, total, color) {
  const pct = Math.round((counts[key] / total) * 100);
  return `
    <div class="status-row">
      <span class="status-row-label">${label}</span>
      <div class="status-bar-wrap">
        <div class="status-bar" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="status-row-count">${counts[key]}</span>
    </div>`;
}

function dayLabel(d) {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return days[d.getDay()];
}

function calcStreak(history) {
  if (!history.length) return 0;
  const days = new Set(history.map(h => h.date));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().split('T')[0])) streak++;
    else if (i > 0) break;
  }
  return streak;
}
