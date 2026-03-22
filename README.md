<<<<<<< HEAD
# lernapp
=======
# LernApp

Lokale Vokabel- und Fremdwort-Lern-App mit Spaced-Repetition, mehreren Lernmodi und Import/Export. Deploybar auf Vercel.

## Schnellstart (lokal)

```bash
cd lernapp
npm install
npm run dev
# → http://localhost:5173
```

## Build & Vercel-Deploy

```bash
# Lokaler Produktions-Build (Ausgabe in dist/)
npm run build
npm run preview   # lokale Vorschau des Builds

# Vercel CLI (einmalig installieren: npm i -g vercel)
vercel            # erstes Deployment mit Setup-Dialog
vercel --prod     # Produktions-Deployment
```

Alternativ: Repo auf GitHub pushen und in Vercel importieren — die `vercel.json` konfiguriert alles automatisch.

## Projektstruktur

```
lernapp/
├── index.html              # Einstiegspunkt
├── package.json            # Vite als einzige Dependency
├── vite.config.js
├── vercel.json             # Build-Konfiguration für Vercel
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js             # Routing & Bootstrap
│   ├── style.css           # Alle Styles (CSS Custom Properties)
│   ├── data/
│   │   ├── model.js        # Datenmodell, Typen, Validierung
│   │   ├── store.js        # localStorage CRUD
│   │   └── examples.js     # Beispieldaten für den ersten Start
│   ├── srs/
│   │   └── algorithm.js    # SM-2 Spaced-Repetition-Algorithmus
│   ├── views/
│   │   ├── library.js      # Kartei-Bibliothek
│   │   ├── editor.js       # Eintrag erstellen / bearbeiten (Modal)
│   │   ├── learn.js        # Lernsitzung (Karteikarte + Schreiben)
│   │   ├── stats.js        # Statistik-Dashboard
│   │   ├── settings.js     # Einstellungen
│   │   └── io.js           # Import / Export
│   └── utils/
│       ├── dom.js          # DOM-Helpers, Ähnlichkeitsvergleich
│       └── csv.js          # CSV-Parser und -Generator
└── examples/
    ├── sample.json         # Beispiel-Import JSON
    └── sample.csv          # Beispiel-Import CSV
```

## Datenmodell (intern)

```jsonc
{
  "id":              "uuid",
  "term":            "Epiphanie",           // Pflichtfeld
  "language":        "Deutsch",
  "meanings": [
    { "definition": "Plötzliche Erkenntnis", "translation": "epiphany" }
    // mehrere Bedeutungen möglich
  ],
  "exampleSentence": "Sie hatte eine Epiphanie.",
  "notes":           "Von griech. epiphaneia.",
  "difficulty":      "easy | medium | hard",
  "tags":            ["Fremdwort", "Philosophie"],

  // SRS-Felder (SM-2)
  "easeFactor":      2.5,    // Wiederholungs-Multiplikator (min 1.3)
  "interval":        3,      // Tage bis zur nächsten Wiederholung
  "repetitions":     2,      // Anzahl erfolgreicher Reviews
  "status":          "new | learning | review | mastered",
  "dueDate":         "2026-03-21",
  "lastReview":      "2026-03-18",

  // Verlauf jeder Bewertung
  "history": [
    { "date": "2026-03-18", "rating": 2, "interval": 3 }
  ],

  "createdAt": "2026-03-18T10:00:00.000Z",
  "updatedAt": "2026-03-18T10:00:00.000Z"
}
```

## Import-Format JSON

Array von Einträgen. Pflichtfeld: `term`. Alle anderen Felder sind optional (werden mit Defaults befüllt).

```json
[
  {
    "term": "Serendipität",
    "language": "Deutsch",
    "meanings": [{ "definition": "Glücklicher Zufallsfund", "translation": "serendipity" }],
    "exampleSentence": "...",
    "difficulty": "hard",
    "tags": ["Fremdwort"]
  }
]
```

## Import-Format CSV

```csv
term,language,definition,translation,exampleSentence,notes,difficulty,tags,status
Serendipität,Deutsch,Glücklicher Zufallsfund,serendipity,...,,hard,Fremdwort;Philosophie,new
```

- Mehrere Tags mit Semikolon trennen: `Tag1;Tag2;Tag3`
- Felder mit Komma in Anführungszeichen einschliessen: `"Definition, mit Komma"`
- CSV unterstützt nur eine Bedeutung pro Zeile; für mehrere Bedeutungen → JSON verwenden

## SRS-Algorithmus (vereinfachtes SM-2)

| Bewertung | Tastatur | Effekt |
|-----------|----------|--------|
| Nochmal   | 1        | Intervall zurück auf 1 Tag, Ease −0.2 |
| Schwer    | 2        | Intervall × 1.2, Ease −0.15 |
| Gut       | 3        | rep=0→1d, rep=1→3d, sonst × Ease |
| Leicht    | 4        | Wie Gut, aber × easyBonus, Ease +0.15 |

Keyboard-Shortcuts in der Lernsitzung: `Leertaste` = Aufdecken, `1–4` = Bewerten.

## Lokale Entwicklung

```bash
npm run dev     # Dev-Server mit Hot-Reload
npm run build   # Produktions-Build → dist/
npm run preview # Lokale Vorschau des Builds
```

Alle Daten liegen im `localStorage` des Browsers. Für Backup → JSON-Export verwenden.
>>>>>>> 85fa3e4 (initaler commoit für Lernapp)
