/**
 * Hilfe-View: Bedienungsanleitung, FAQ und KI-Prompt zur CSV-Erzeugung.
 */

import { qs } from '../utils/dom.js';

const AI_PROMPT = `Du bist ein Sprachexperte und erzeugst eine CSV-Datei für eine Lernkarten-App (Spaced Repetition).
WICHTIG — Automatische Fehlerkorrektur:
Erkenne und korrigiere alle Rechtschreib-, Tipp- und Gross-/Kleinschreibungsfehler in der Wortliste.
Verwende im Feld "term" immer die korrekte Schreibweise.
Falls du eine Korrektur vorgenommen hast, schreibe in "notes": (korrigiert von: original)
Ausgabeformat — exakt diese Spalten, erste Zeile ist der Header:
term,language,definition,translation,exampleSentence,notes,difficulty,tags,status
Regeln:
- Trenne Felder mit Komma. Felder mit Komma oder Zeilenumbruch in "..." einschliessen.
- Mehrere Tags mit Semikolon trennen (kein Leerzeichen): Englisch;Informatik
- difficulty: easy | medium | hard  (nach Bekanntheit und Komplexität einschätzen)
- status: immer "new"
- language: Sprache des Begriffs (Deutsch, Englisch, Französisch, Latein …)
- definition: präzise deutschsprachige Erklärung, 1–2 Sätze
- translation: deutsche Übersetzung oder englisches Äquivalent (falls sinnvoll, sonst leer lassen)
- exampleSentence: natürlicher Beispielsatz in der Originalsprache des Begriffs
- notes: Herkunft, Merkhinweis, verwandte Wörter — oder "(korrigiert von: xxx)" bei Tippfehlern
Tags — vergib passende Tags aus dieser Liste (mehrere möglich, Erweiterung erlaubt):
  Fremdwort, Englisch, Deutsch, Informatik, Schach, Philosophie, Psychologie,
  Wirtschaft, Wissenschaft, Latein, Französisch, Japanisch, Medizin,
  Recht, Kunst, Mathematik, Management, Natur, Geschichte
Gib NUR die CSV aus — keinen erklärenden Text davor oder danach.
###
Wort 1
Wort 2
…`;

export function render(container) {
  container.innerHTML = `
    <div style="max-width:780px">
      <h1 class="section-title">Hilfe & FAQ</h1>

      <!-- Schnellnavigation -->
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:2rem">
        ${['Erste Schritte','Lernmodi','Bewertungen','Import & Export','KI-Prompt','FAQ']
          .map((t, i) => `<a href="#help-${i}" class="btn btn-secondary btn-sm">${t}</a>`)
          .join('')}
      </div>

      <!-- 0 Erste Schritte -->
      <div class="io-section" id="help-0" style="margin-bottom:1.25rem">
        <h3>Erste Schritte</h3>
        <p style="margin-bottom:1rem">LernApp funktioniert nach dem Prinzip <strong>Spaced Repetition</strong>:
        Karten, die du gut kennst, werden seltener wiederholt — schwierige Karten öfter.
        So lernst du effizient und nachhaltig.</p>
        <ol style="padding-left:1.25rem;display:grid;gap:.5rem;font-size:.875rem;list-style:decimal">
          <li>Klicke oben rechts auf <strong>+ Neu</strong>, um deinen ersten Eintrag anzulegen.</li>
          <li>Oder importiere eine CSV-/JSON-Datei unter <strong>Import / Export</strong>.</li>
          <li>Wechsle zu <strong>Lernen</strong> und starte eine Sitzung.</li>
          <li>Bewerte nach jeder Karte ehrlich — das bestimmt, wann du sie das nächste Mal siehst.</li>
          <li>In der <strong>Statistik</strong> siehst du deinen Fortschritt.</li>
        </ol>
      </div>

      <!-- 1 Lernmodi -->
      <div class="io-section" id="help-1" style="margin-bottom:1.25rem">
        <h3>Lernmodi</h3>
        <div style="display:grid;gap:.75rem;font-size:.875rem">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:.5rem 1rem;align-items:start">
            <span style="font-size:1.25rem">📅</span>
            <div><strong>Fällige Karten</strong> — zeigt alle Karten, die heute oder früher zur Wiederholung fällig sind. Das ist der normale Tagesmodus.</div>
            <span style="font-size:1.25rem">✨</span>
            <div><strong>Nur neue Karten</strong> — führt ausschliesslich neue Karten ein (max. pro Tag in den Einstellungen konfigurierbar).</div>
            <span style="font-size:1.25rem">🎯</span>
            <div><strong>Schwierige Karten</strong> — Karten, die du in letzter Zeit mit „Nochmal" bewertet hast. Gut für gezieltes Nachüben.</div>
          </div>
          <hr style="border:none;border-top:1px solid var(--color-border)">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:.5rem 1rem;align-items:start">
            <span style="font-size:1.25rem">🃏</span>
            <div><strong>Karteikarte</strong> — Begriff anzeigen, mit Leertaste oder Klick aufdecken, dann bewerten. Ideal für den täglichen Review.</div>
            <span style="font-size:1.25rem">✍️</span>
            <div><strong>Schreiben</strong> — du tippst die Antwort selbst ein. Die App vergleicht deine Eingabe und gibt Feedback. Stärkerer Lerneffekt durch aktiven Abruf.</div>
          </div>
        </div>
      </div>

      <!-- 2 Bewertungen -->
      <div class="io-section" id="help-2" style="margin-bottom:1.25rem">
        <h3>Bewertungen (Tastatur: 1–4)</h3>
        <div style="display:grid;gap:.6rem;font-size:.875rem">
          <div style="display:grid;grid-template-columns:110px 1fr;gap:.5rem;align-items:center">
            <span class="badge" style="background:#fee2e2;color:#b91c1c;justify-self:start">1 — Nochmal</span>
            <span>Nicht gewusst. Karte kommt morgen wieder. Intervall wird zurückgesetzt.</span>
            <span class="badge" style="background:#ffedd5;color:#c2410c;justify-self:start">2 — Schwer</span>
            <span>Gewusst, aber mit viel Mühe. Intervall wächst kaum.</span>
            <span class="badge" style="background:#dcfce7;color:#15803d;justify-self:start">3 — Gut</span>
            <span>Sicher gewusst. Normales Intervallwachstum gemäss SM-2.</span>
            <span class="badge" style="background:#dbeafe;color:#1d4ed8;justify-self:start">4 — Leicht</span>
            <span>Sofort gewusst. Intervall wächst stärker, Ease-Faktor steigt.</span>
          </div>
        </div>
        <p style="font-size:.8125rem;color:var(--color-text-muted);margin-top:.75rem">
          Tipp: Sei ehrlich mit dir. „Leicht" nur dann, wenn du die Antwort wirklich sofort wusstest.
          Das System funktioniert nur, wenn die Bewertungen stimmen.
        </p>
      </div>

      <!-- 3 Import & Export -->
      <div class="io-section" id="help-3" style="margin-bottom:1.25rem">
        <h3>Import &amp; Export</h3>
        <div style="font-size:.875rem;display:grid;gap:.6rem">
          <p><strong>Alle Daten werden lokal im Browser gespeichert (localStorage).</strong>
          Sie bleiben dauerhaft erhalten — auch nach Browser-Neustart. Nur das Leeren des
          Browser-Caches oder „Alle Daten löschen" in den Einstellungen entfernt sie.</p>
          <p><strong>Importformate:</strong> JSON (vollständig, inkl. Lernfortschritt) und CSV (Basisfelder).
          Beim Import wird der Lernstatus übernommen, falls vorhanden — sonst startet jede Karte als „Neu".</p>
          <p><strong>Importmodus „Zusammenführen"</strong> — bestehende Einträge mit gleicher ID werden
          überschrieben, neue hinzugefügt. Empfohlen für Updates.</p>
          <p><strong>Importmodus „Ersetzen"</strong> — alle bestehenden Einträge werden gelöscht und durch
          die importierten ersetzt. Gut für einen kompletten Neustart.</p>
          <p><strong>Export:</strong> JSON-Export enthält alle Felder inkl. SRS-Daten und Lernhistorie —
          ideal als Backup. CSV-Export enthält nur die Basisfelder.</p>
        </div>
      </div>

      <!-- 4 KI-Prompt -->
      <div class="io-section" id="help-4" style="margin-bottom:1.25rem">
        <h3>KI-Prompt — CSV mit Claude oder ChatGPT erzeugen</h3>
        <p style="font-size:.875rem;margin-bottom:1rem">
          Kopiere diesen Prompt in Claude, ChatGPT oder ein anderes Sprachmodell.
          Füge deine Wörter <strong>nach dem <code>###</code></strong> ein — einfach zeilenweise.
          Die KI erkennt und korrigiert automatisch Tippfehler, wählt die Sprache,
          vergibt Tags und erzeugt eine importfertige CSV.
        </p>
        <div style="position:relative">
          <button id="btn-copy-prompt" class="btn btn-primary btn-sm"
            style="position:absolute;top:.6rem;right:.6rem;z-index:1">
            Kopieren
          </button>
          <pre id="prompt-block" class="code-block" style="white-space:pre-wrap;padding-top:2.5rem">${escHtml(AI_PROMPT)}</pre>
        </div>
        <p style="font-size:.8125rem;color:var(--color-text-muted);margin-top:.75rem">
          Die erzeugte CSV direkt als <code>.csv</code> speichern und unter
          <a href="#io" style="color:var(--color-primary)">Import / Export</a> hochladen.
          Für grosse Listen (&gt; 40 Begriffe) lieber in Blöcken von 20–30 arbeiten.
        </p>
      </div>

      <!-- 5 FAQ -->
      <div class="io-section" id="help-5">
        <h3>FAQ</h3>
        <div id="faq-list" style="display:grid;gap:.5rem">
          ${FAQ.map((item, i) => faqItem(item, i)).join('')}
        </div>
      </div>

    </div>
  `;

  // Kopier-Button
  qs('#btn-copy-prompt', container)?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    const btn = qs('#btn-copy-prompt', container);
    btn.textContent = 'Kopiert ✓';
    btn.style.background = 'var(--color-success)';
    setTimeout(() => { btn.textContent = 'Kopieren'; btn.style.background = ''; }, 2000);
  });

  // FAQ Akkordeon
  qs('#faq-list', container)?.addEventListener('click', e => {
    const header = e.target.closest('.faq-header');
    if (!header) return;
    const item = header.parentElement;
    const body = item.querySelector('.faq-body');
    const isOpen = item.dataset.open === '1';
    item.dataset.open = isOpen ? '0' : '1';
    body.style.display = isOpen ? 'none' : 'block';
    header.querySelector('.faq-arrow').textContent = isOpen ? '›' : '‹';
  });
}

// ── Daten ─────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Gehen meine Daten verloren, wenn ich den Browser schliesse?',
    a: 'Nein. Alle Daten liegen im localStorage deines Browsers und bleiben dauerhaft erhalten — unabhängig davon, ob du den Tab oder den Browser schliesst. Nur das manuelle Leeren des Browser-Caches oder „Alle Daten löschen" in den Einstellungen entfernt sie.',
  },
  {
    q: 'Was passiert, wenn ich dieselbe CSV zweimal importiere?',
    a: 'Im Modus „Zusammenführen" (Standard) werden bestehende Einträge mit gleicher ID überschrieben — dein Lernfortschritt geht dabei verloren, falls die IDs übereinstimmen. Für Updates besser neue Begriffe separat importieren oder den JSON-Export als Backup verwenden.',
  },
  {
    q: 'Wie viele neue Karten soll ich pro Tag einführen?',
    a: 'Für Einsteiger sind 10–15 neue Karten pro Tag ein guter Start. Bedenke: jede neue Karte erzeugt über Wochen wiederkehrende Reviews. Zu viele neue Karten auf einmal lassen den Review-Berg schnell anwachsen. Passe den Wert in den Einstellungen an.',
  },
  {
    q: 'Was bedeutet der Ease-Faktor?',
    a: 'Der Ease-Faktor (Standard: 2.5) bestimmt, wie stark das Intervall nach einer guten Bewertung wächst. Bei „Leicht" steigt er, bei „Schwer" oder „Nochmal" sinkt er (Minimum: 1.3). Ein sinkender Ease-Faktor bedeutet, dass die Karte öfter wiederholt wird.',
  },
  {
    q: 'Kann ich mehrere Bedeutungen pro Begriff eingeben?',
    a: 'Ja. Im Editor kannst du über „+ Bedeutung" beliebig viele Bedeutungen oder Nuancen hinzufügen. Im Schreibmodus wird deine Antwort mit allen hinterlegten Bedeutungen verglichen.',
  },
  {
    q: 'Was tun, wenn die CSV nicht importiert werden kann?',
    a: 'Häufige Ursachen: (1) Das Pflichtfeld "term" fehlt oder ist leer. (2) Die Datei ist nicht UTF-8-kodiert — in Excel als "CSV UTF-8" speichern. (3) Felder mit Komma sind nicht in Anführungszeichen eingeschlossen. Prüfe die Datei mit einem Texteditor und vergleiche sie mit dem Beispiel im Import-Bereich.',
  },
  {
    q: 'Wie exportiere ich meine Daten als Backup?',
    a: 'Unter Import / Export → „JSON exportieren". JSON enthält alle Felder inkl. Lernfortschritt, SRS-Daten und Verlauf. Diese Datei kann jederzeit wieder importiert werden, um den Stand vollständig wiederherzustellen.',
  },
  {
    q: 'Kann ich die App auf mehreren Geräten nutzen?',
    a: 'Aktuell nein — die Daten liegen lokal im Browser. Für einen Geräteübertrag: JSON exportieren, auf dem anderen Gerät importieren. Eine Cloud-Sync-Funktion ist nicht eingebaut.',
  },
];

function faqItem({ q, a }, i) {
  return `
    <div data-open="0" style="border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden">
      <div class="faq-header" style="display:flex;justify-content:space-between;align-items:center;
           padding:.75rem 1rem;cursor:pointer;user-select:none;background:var(--color-surface-2)">
        <span style="font-size:.875rem;font-weight:500">${escHtml(q)}</span>
        <span class="faq-arrow" style="font-size:1.25rem;color:var(--color-text-muted);line-height:1">›</span>
      </div>
      <div class="faq-body" style="display:none;padding:.75rem 1rem;font-size:.875rem;
           color:var(--color-text-muted);border-top:1px solid var(--color-border)">
        ${escHtml(a)}
      </div>
    </div>`;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
