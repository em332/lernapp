/**
 * Beispieldaten für den ersten Start der App.
 * Werden nur geladen, wenn keine Einträge im localStorage vorhanden sind.
 */

export const EXAMPLE_ENTRIES = [
  {
    term: 'Epiphanie',
    language: 'Deutsch',
    meanings: [
      { definition: 'Plötzliche Erkenntnis, erleuchtender Einfall', translation: 'epiphany' },
    ],
    exampleSentence: 'Beim Spaziergang hatte sie eine Epiphanie: Das Problem war die ganze Zeit lösbar.',
    notes: 'Ursprünglich religiöser Begriff (Erscheinung Gottes), heute auch allgemein für Geistesblitze.',
    difficulty: 'medium',
    tags: ['Fremdwort', 'Philosophie'],
  },
  {
    term: 'Prokrastination',
    language: 'Deutsch',
    meanings: [
      { definition: 'Das Aufschieben von Aufgaben auf einen späteren Zeitpunkt', translation: 'procrastination' },
    ],
    exampleSentence: 'Prokrastination ist kein Zeitmangel-Problem, sondern ein Emotionsregulationsproblem.',
    notes: 'Von lat. procrastinare — auf morgen verschieben.',
    difficulty: 'easy',
    tags: ['Psychologie', 'Fremdwort'],
  },
  {
    term: 'Sonder',
    language: 'Englisch',
    meanings: [
      {
        definition: 'The realization that each passerby has a life as vivid and complex as your own',
        translation: 'Das Bewusstsein, dass jeder Passant ein ebenso komplexes Leben führt wie man selbst',
      },
    ],
    exampleSentence: 'A sudden feeling of sonder washed over him as he watched the crowd from the café window.',
    notes: 'Neologismus aus dem Dictionary of Obscure Sorrows (John Koenig). Nicht offiziell im Wörterbuch.',
    difficulty: 'hard',
    tags: ['Englisch', 'Neologismus'],
  },
  {
    term: 'Lacuna',
    language: 'Englisch',
    meanings: [
      { definition: 'A gap or missing section, especially in a manuscript or argument', translation: 'Lücke, fehlender Teil' },
    ],
    exampleSentence: 'The historical record has a significant lacuna between 1450 and 1480.',
    notes: 'Lat. lacuna = Grube, Vertiefung. Im Deutschen auch "Lakune" (fachsprachlich).',
    difficulty: 'hard',
    tags: ['Englisch', 'Latein', 'Wissenschaft'],
  },
  {
    term: 'mise en place',
    language: 'Französisch',
    meanings: [
      { definition: 'Alles bereitstellen und vorbereiten, bevor man beginnt', translation: 'everything in its place' },
      { definition: 'Küchenfachbegriff: Zutaten und Werkzeuge vor dem Kochen bereitstellen', translation: '' },
    ],
    exampleSentence: 'Gute Mise en place ist das Geheimnis effizienter Profiköche — und produktiver Wissensarbeiter.',
    notes: 'Übertragen auf andere Bereiche: erst strukturieren, dann arbeiten.',
    difficulty: 'medium',
    tags: ['Französisch', 'Kochen', 'Produktivität'],
  },
  {
    term: 'Weltanschauung',
    language: 'Deutsch',
    meanings: [
      { definition: 'Umfassendes Bild der Welt und des eigenen Platzes darin', translation: 'worldview / Weltanschauung' },
    ],
    exampleSentence: 'Jede Kultur entwickelt eine eigene Weltanschauung, die das Denken ihrer Mitglieder prägt.',
    notes: 'Wird in viele Sprachen unübersetzt übernommen (z.B. ins Englische).',
    difficulty: 'easy',
    tags: ['Deutsch', 'Philosophie'],
  },
];
