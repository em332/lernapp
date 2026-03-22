# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies (only: vite)
npm run dev        # dev server at http://localhost:5173 with hot reload
npm run build      # production build → dist/
npm run preview    # local preview of dist/
```

There are no tests and no linter configured. Node.js must be available (`node >= 18`).

## Architecture

Single-page app with a **hash-based router** (`#library` | `#learn` | `#stats` | `#settings` | `#io` | `#help`). No framework — pure ES modules bundled by Vite.

**Data flow:**
1. `src/main.js` bootstraps the app, reads the URL hash and calls the matching view's `render(container)` function.
2. Views read and write data exclusively through `src/data/store.js` (localStorage).
3. After a learning rating, views call `src/srs/algorithm.js → schedule(entry, rating)` to get the new SRS state, then persist it via `updateEntry()`.

**Key modules:**

| Path | Role |
|------|------|
| `src/data/model.js` | `createEntry()` factory, `validateEntry()`, status/difficulty constants, `isDue()` |
| `src/data/store.js` | All localStorage CRUD (`loadEntries`, `addEntry`, `updateEntry`, `deleteEntry`, `importEntries`, `loadSettings`, `saveSettings`) |
| `src/srs/algorithm.js` | Pure `schedule(entry, rating) → changes` — returns a diff object, no side-effects |
| `src/views/editor.js` | Modal editor; opened via `openEditor(id, onSave)` from any view |
| `src/views/learn.js` | Session state machine: setup → card loop → summary; delete-during-session button removes card from deck and store immediately |
| `src/views/help.js` | Static help page with FAQ accordion and copyable AI prompt for CSV generation |
| `src/auth.js` | Password gate (`sessionStorage`); on success re-injects full nav HTML and calls `init()`. Password constant at top of file. |
| `src/utils/dom.js` | `qs()`, `qsa()`, `fmtDate()`, `relativeDue()`, `similarity()` (Levenshtein for write-mode answer checking) |
| `src/utils/csv.js` | `toCSV(entries)` / `fromCSV(text)` — CSV maps only first meaning; JSON export is lossless |

**Auth pattern:** `src/auth.js` runs before `init()`. It checks `sessionStorage` for a flag; if absent it replaces `#app` with a login form. On correct password it re-injects the full nav+modal+main HTML (duplicated from `index.html`) and calls `onSuccess()`. When adding nav links, update both `index.html` and the template string in `auth.js`.

**Modal pattern:** A single `#modal-overlay` / `#modal-content` pair lives in `index.html` (and is duplicated in `auth.js`). `editor.js` injects HTML into it and manages open/close. No other view uses this modal.

**Import bug fix:** The drop-zone click handler guards against double-triggering when the inner `<label for="file-input">` is clicked — it returns early if `e.target.closest('label')` matches.

**SRS data fields per entry:** `easeFactor` (default 2.5, min 1.3), `interval` (days), `repetitions`, `status` (`new|learning|review|mastered`), `dueDate` (YYYY-MM-DD), `lastReview`, `history[]`.

**Settings** are stored separately under `lernapp_settings` in localStorage. `loadSettings()` always merges with `DEFAULT_SETTINGS` so missing keys are safe.

**Keyboard shortcuts in learn session:** `Space` = reveal card, `1–4` = rate (Again/Hard/Good/Easy). The handler is attached to `document` and stored on `container._keyHandler` so the router can remove it on navigation.

## Deployment

`vercel.json` sets `buildCommand: npm run build`, `outputDirectory: dist`, and a catch-all rewrite to `index.html`. Push to GitHub and import in Vercel, or use `vercel --prod`.
