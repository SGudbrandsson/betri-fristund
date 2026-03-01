# Betri Frístund

A vanilla JavaScript web app that helps Icelandic parents find summer activities
for their children. Scrapes data from [frístund.is](https://fristund.is) via
CORS proxies and presents it with a clean, mobile-first UI.

**Zero dependencies.** No npm, no build tools, no frameworks. Just HTML, CSS,
and a single JS file.

## File Structure

```
betri-fristund/
  CLAUDE.md          # This file — project reference for Claude sessions
  tests.js           # Test suite (node tests.js), ~130 tests
  .gitignore
  docs/              # Served by GitHub Pages
    index.html       # Single-page HTML with data-i18n attributes
    app.js           # All application logic (~850 lines, vanilla JS IIFE)
    styles.css       # All styles (~817 lines, mobile-first, CSS variables)
```

## How It Works (User Flow)

1. User lands on welcome screen, selects child's age
2. App fetches HTML from fristund.is via CORS proxy chain
3. Parses `__NEXT_DATA__` JSON embedded in the HTML response
4. Filters out non-activity items (fees, merchandise, subscriptions, spam)
5. Smart pagination: auto-fetches more API pages if filtering removes too many
   results, ensuring at least 6 valid items per batch
6. Renders activity cards with images, dates, locations, and tag badges
7. URL query params sync with filter state for shareable/bookmarkable links
8. Browser back/forward works via History API
9. Language toggle (IS/EN) translates all UI text and re-renders cards

## Architecture

### IIFE Pattern (`docs/app.js`)

The entire app is wrapped in `(() => { ... })()`. All state and functions are
private. The IIFE runs on page load and binds `init()` to `DOMContentLoaded`.

Key sections in order:
1. **Configuration** — `BASE_URL`, `CORS_PROXIES` array
2. **TAG_CATEGORIES** — 23 categories with `label`, `labelEn`, `icon`, `tags`
3. **TAG_LABELS** — display name lookup for all known API tags
4. **TRANSLATIONS** — IS/EN strings (33 keys per language)
5. **POSTAL_NAMES** — postal code → neighborhood name map (16 entries)
6. **isValidActivity()** — exclusion filter (17 regex rules)
7. **State object** — `age`, `from`, `to`, `tags`, `postCode`, `sortBy`, `page`,
   `cards`, `pageInfo`, `loading`, `error`, `hasSearched`, `lang`
8. **URL state** — `stateToUrl()`, `urlToState()`, `syncFormFromState()`, `pushUrl()`
9. **DOM refs** — all cached with `$()` shorthand
10. **Lang toggle early binding** — click handler bound immediately, not in `init()`
11. **i18n helpers** — `t()`, `applyLang()`, `setLang()`
12. **Pure helpers** — `toApiDate()`, `formatDate()`, `getLocationName()`, etc.
13. **API** — `buildUrl()`, `parseNextData()`, `fetchPage()`, `fetchFiltered()`
14. **UI rendering** — dropdowns, tag chips, cards, results info, load more
15. **Actions** — `search()`, `loadMore()`, `clearFilters()`
16. **Event binding** — `bindEvents()`
17. **Init** — `init()`

### CORS Proxy Chain

Direct fetch to fristund.is is blocked by CORS. The app tries proxies in order:
1. `api.allorigins.win/raw?url=...`
2. `corsproxy.io/?url=...`

If all proxies fail, an error state is shown.

### `__NEXT_DATA__` Parsing

fristund.is is a Next.js app. The data is embedded as JSON in a
`<script id="__NEXT_DATA__">` tag. `parseNextData()` extracts it and handles
both `{ props: { pageProps } }` (standard) and `{ pageProps }` (flat) structures.

### Smart Pagination (`fetchFiltered()`)

Heavy filtering (via `isValidActivity()`) can remove most results from a page.
`fetchFiltered()` loops through API pages until at least `MIN_RESULTS` (6) valid
cards are accumulated, or there are no more pages. This prevents showing empty
result screens.

## i18n System

### How It Works

1. HTML elements have `data-i18n="key"` attributes (e.g., `data-i18n="tagline"`)
2. `TRANSLATIONS` object has `is` and `en` sub-objects with 33 keys each
3. `t(key)` returns the translated string for the current `state.lang`
4. `applyLang()` iterates all `[data-i18n]` elements and sets `.textContent`
5. Dynamic content (age dropdowns, tag chips, cards) is re-rendered on switch

### Language Toggle

- Fixed floating segmented control at bottom-right (`IS | EN`)
- Active language gets orange highlight (`lang-option--active`)
- **Early binding pattern**: click handler is bound immediately after DOM refs
  are created, NOT inside `init()`/`bindEvents()`. This ensures it works even
  if other init steps fail.
- Language persisted to `localStorage` with try-catch for Safari private browsing

### TAG_CATEGORIES Translation

Each category has `label` (Icelandic) and `labelEn` (English). The tag chip
renderer picks the right one based on `state.lang`.

## Activity Filtering (`isValidActivity()`)

This function filters out non-activity items from the API. It returns `false`
for any title matching these patterns:

| Rule | Regex | Example rejected |
|------|-------|-----------------|
| Spam duplicates | `/^Get Together/i` | "Get Together: List..." |
| Membership fees | `/félagsgjald/i` | "Árlegt félagsgjald" |
| Gift cards | `/gjafabréf\|gjafakort\|gift\s*card/i` | "10.000 kr gjafabréf" |
| Merchandise | `/keikogi\|æfingagalli\|fatnaður/i` | "Hjólafatnaður" |
| Appeal fees | `/^áfrýjunargjald$/i` | "Áfrýjunargjald" |
| Subscriptions | `/áskrift\|árskort\|ársgjald\|staðgreidd kort\|námsmannakort\|félagsskírteini/i` | "Mánaðarleg áskrift" |
| Payments | `/^greiðsla\b\|^kvittun\b/i` | "Greiðsla vegna..." |
| Practice fees | `/æfingagj[aö]/i` | "Æfingagjöld" |
| Donations | `/almannaheill\|styrktarlína\|styrktaraðilar/i` | "Styrktarlína Elliða" |
| Competition passes | `/keppnispassi/i` | "Keppnispassi haust" |
| Generic fees (other tag) | `/\bgjald\b\|\bgjöld\b/i` (only with single `other` tag) | "Skráningar gjald" |
| Supporters clubs | `/stuðningsfélagar/i` | "Stuðningsfélagar" |
| Donations to teams | `/\bstyrkur\b\|\bstyrkir\b/i` (except frístundastyrkur) | "Styrkur til AFREKSHÓPS" |
| Foreign fees | `/mokestis/i` | Lithuanian membership fee |
| Bus passes | `/fylkisrút/i` | "Fylkisrútan 2025-2026" |
| School escorts | `/\bfylgd\b/i` | "Grandaskóli - fylgd" |
| Card purchases | `/^Kort\b\|opið kort\|stakir mánuðir/i` | "Kort / Cards" |

## URL State Management

Filter state is serialized to URL query params for shareable links:

- `stateToUrl()` — builds `URLSearchParams` from state (skips empty/default values)
- `urlToState()` — reads `window.location.search` back into state
- `pushUrl()` — calls `history.pushState()` with the serialized state
- `popstate` event handler — restores state on browser back/forward

Supported params: `age`, `from`, `to`, `tags`, `postCode`, `sortBy`, `page`

## CSS Design System (`docs/styles.css`)

### Variables (`:root`)

- Colors: `--color-primary: #EA580C` (orange), `--color-bg: #FFFBF5` (warm white)
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-card`
- Radii: `--radius-sm: 8px` through `--radius-full: 9999px`
- Font: `--font-sans: 'Inter', system-ui, sans-serif`
- Transition: `--transition: 180ms ease`

### Breakpoints (mobile-first)

- `520px` — cards go from 1 to 2 columns
- `640px` — container padding increases, header enlarges
- `768px` — filters go from 2-col to 5-col grid
- `860px` — cards go to 3 columns

## Testing

### Running Tests

```bash
node tests.js
```

All tests must pass before pushing. Currently ~130 tests.

### Test Architecture

Since `app.js` is a browser IIFE, pure functions cannot be imported directly.
Instead, `tests.js` **duplicates** the pure function implementations. When you
change a pure function in `app.js`, you must update the same function in
`tests.js`.

### What's Tested

- `toApiDate()` — ISO → API date format (5 tests)
- `formatDate()` — API date → Icelandic display (6 tests)
- `getLocationName()` / `getLocationShort()` — postal code lookups (6 tests)
- `getTagLabel()` / `getCardIcon()` — tag display names and icons (7 tests)
- `isValidActivity()` — exclusion filter (62 tests)
- `stateToUrl()` / `parseUrlState()` — URL serialization roundtrip (15 tests)
- `parseNextData()` — `__NEXT_DATA__` extraction (3 tests)
- `getDefaultDates()` — summer date defaults (3 tests)
- i18n — translation key parity, `t()` helper, TAG_CATEGORIES labels, HTML key
  coverage (19 tests)
- Live API integration — optional, skipped when offline

## Deployment

GitHub Pages from the `docs/` directory on the `main` branch.

In GitHub repo Settings → Pages:
- Source: "Deploy from a branch"
- Branch: `main`
- Folder: `/docs`

## How-To Guides

### Adding a New Exclusion Filter

1. Open `docs/app.js`, find `isValidActivity()`
2. Add a new `if` line with your regex pattern, return `false`
3. Copy the updated function to `tests.js` (replace the old version)
4. Add test cases in `tests.js` under the `isValidActivity` section
5. Run `node tests.js`

### Adding a New Translation Key

1. Add the key to both `TRANSLATIONS.is` and `TRANSLATIONS.en` in `docs/app.js`
2. Add `data-i18n="yourKey"` to the HTML element in `docs/index.html` (for
   static text), or use `t('yourKey')` in JS for dynamic text
3. Duplicate the updated `TRANSLATIONS` in `tests.js`
4. Add the key to the `htmlI18nKeys` array in `tests.js` if it's on an HTML element
5. Run `node tests.js`

### Adding a New Tag Category

1. Add an entry to `TAG_CATEGORIES` in `docs/app.js`:
   ```js
   { label: 'Íslenska', labelEn: 'English', icon: '🎯', tags: ['api_tag'] },
   ```
2. Add the tag(s) to `TAG_LABELS` with Icelandic display names
3. Update `TAG_CATEGORIES_FULL` in `tests.js` with `label` and `labelEn`
4. Run `node tests.js`

### Adding a New Filter Dropdown

1. Add `<select>` HTML in `docs/index.html` inside the `.filters-top` grid
2. Add a DOM ref in `docs/app.js` (e.g., `const mySelect = $('#my-select')`)
3. Add the field to `state`, `stateToUrl()`, `urlToState()`, `syncFormFromState()`
4. Add the field to `readFilters()` and `buildUrl()` if it maps to an API param
5. Add the field to `resetToWelcome()` for clearing
6. Add `data-i18n` attributes and translations for label/options
7. Mirror `stateToUrl`/`parseUrlState` changes in `tests.js`
8. Run `node tests.js`

### Changing Styles

All visual properties are controlled by CSS variables in `:root` at the top of
`docs/styles.css`. Change the variable value to update everywhere at once.

## Development Workflow

1. Branch from `main`
2. Make changes in `docs/` (app.js, index.html, styles.css)
3. If you changed a pure function in `app.js`, update it in `tests.js` too
4. Run `node tests.js` — all tests must pass
5. Test locally: open `docs/index.html` in a browser
6. Commit and push
