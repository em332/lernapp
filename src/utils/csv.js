/**
 * CSV-Parser und -Generator für Lerneinträge.
 *
 * Spaltenreihenfolge (CSV-Header):
 *   term, language, definition, translation, exampleSentence, notes,
 *   difficulty, tags, status
 *
 * Mehrere Bedeutungen werden in einer CSV-Zeile nicht unterstützt —
 * nur definition/translation der ersten Bedeutung wird exportiert.
 * Für volle Bedeutungsvielfalt → JSON-Export verwenden.
 */

const HEADERS = [
  'term', 'language', 'definition', 'translation',
  'exampleSentence', 'notes', 'difficulty', 'tags', 'status',
];

/** Array von Einträgen → CSV-String */
export function toCSV(entries) {
  const rows = [HEADERS.join(',')];
  for (const e of entries) {
    const first = e.meanings?.[0] ?? {};
    const row = [
      e.term,
      e.language,
      first.definition ?? '',
      first.translation ?? '',
      e.exampleSentence ?? '',
      e.notes ?? '',
      e.difficulty ?? '',
      (e.tags ?? []).join(';'),
      e.status ?? '',
    ].map(csvCell);
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

/** CSV-String → Array von Roh-Objekten (noch nicht createEntry-normalisiert) */
export function fromCSV(text) {
  const lines  = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV ist leer oder hat nur einen Header.');
  const header = parseRow(lines[0]).map(h => h.trim().toLowerCase());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseRow(line);
    const obj   = {};
    header.forEach((h, idx) => { obj[h] = cells[idx] ?? ''; });

    // Normalisierung
    result.push({
      term:            obj.term,
      language:        obj.language || '',
      meanings: [{
        definition:  obj.definition || '',
        translation: obj.translation || '',
      }],
      exampleSentence: obj.examplesentence || obj.example_sentence || '',
      notes:           obj.notes || '',
      difficulty:      obj.difficulty || 'medium',
      tags:            obj.tags ? obj.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
      status:          obj.status || 'new',
    });
  }
  return result;
}

// ── Interne Hilfsfunktionen ──────────────────────────────────────────────────

/** Zelle in CSV-sicheres Format bringen */
function csvCell(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Eine CSV-Zeile in Zellen aufteilen (respektiert Anführungszeichen) */
function parseRow(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      cells.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}
