# Betri Frístund

Vanilla JS web app helping Icelandic parents find summer activities for children.
Loads pre-fetched `events.json` (daily GitHub Actions) with live CORS proxy fallback.

**Zero dependencies.** No npm, no build tools, no frameworks.

## File Structure

```
docs/                  # GitHub Pages root
  index.html           # Single-page HTML with data-i18n attributes
  app.js               # All logic (~1100 lines, vanilla JS IIFE)
  styles.css           # Mobile-first CSS with variables
  events.json          # Pre-fetched event data (auto-generated)
scripts/fetch-events.js  # Server-side fetch/filter/enrich (no deps)
tests.js               # Test suite: node tests.js (~210 tests)
```

## Architecture

### IIFE Pattern (`docs/app.js`)

All code in `(() => { ... })()`. Key sections in order:
1. Config, TAG_CATEGORIES (23), TAG_LABELS, TRANSLATIONS (IS/EN, ~45 keys each)
2. `isValidActivity()` — exclusion filter (title + description + age + club checks)
3. State object, URL state management (`stateToUrl`, `urlToState`, `pushUrl`)
4. DOM refs, i18n helpers (`t()`, `applyLang()`, `setLang()`)
5. JSON-first loading → `filterCachedCards()` with tag count computation
6. Live CORS fallback → `fetchFilteredLive()` with smart pagination
7. UI rendering: tag chips (with counts, hides empty), cards, results info
8. Actions: `search()`, `loadMore()`, `clearFilters()`
9. Event binding and init

### Data Flow

1. `events.json` loaded (same-origin, cached, 48h staleness check)
2. `filterCachedCards()` applies `isValidActivity()` + age/date/text/location/tag filters
3. Tag counts computed from base-filtered set (without tag filter) for chip display
4. Falls back to live scraping via CORS proxies if JSON unavailable

### Activity Filtering (`isValidActivity()`)

Filters non-activities: fees, gift cards, memberships, adult-only, supporter clubs, etc.
Checks title (regex), club name, age array (min ≥ 18), and description (gjafakort, supporter patterns).

**Synced across 3 files**: `docs/app.js`, `tests.js`, `scripts/fetch-events.js`

### Client-side Filtering (`filterCachedCards()`)

- Re-applies `isValidActivity()` to catch stale data
- Age filter: cards with single-element age arrays handled correctly
- Text search: matches title, club, description
- Accepts `{ skipTags: true }` for computing tag counts

### Card Features

- Expandable descriptions (CSS line-clamp with toggle)
- Always-visible age tag (shows "All ages" when no age data)
- Location links to Google Maps (new window)
- "View details" link always first, optional "Sign up" link second

## i18n

HTML `data-i18n="key"` → `TRANSLATIONS.is/en` → `t(key)` and `applyLang()`.
Dynamic content re-rendered on language switch. Lang toggle bound early (not in init).

## Testing

```bash
node tests.js
```

All tests must pass before pushing. Tests duplicate pure functions from app.js.
When changing `isValidActivity()` or translations, update all 3 files + tests.

## How-To

### New Exclusion Filter
1. Add regex in `isValidActivity()` in `docs/app.js`
2. Copy function to `tests.js` and `scripts/fetch-events.js`
3. Add test cases, run `node tests.js`

### New Translation Key
1. Add to `TRANSLATIONS.is` and `.en` in `docs/app.js`
2. Use `data-i18n="key"` in HTML or `t('key')` in JS
3. Mirror in `tests.js` TRANSLATIONS + `htmlI18nKeys` array if HTML element
4. Run `node tests.js`

### Refresh Events
```bash
node scripts/fetch-events.js      # local (~5-7 min)
gh workflow run fetch-events.yml   # trigger GitHub Action
```

## Analytics

Umami (self-hosted, privacy-friendly, no cookies — no consent banner needed).
Script tag in `docs/index.html` `<head>`, loaded from `umami.snjall.is`.
Website ID: `86aca15b-0009-4992-af72-285570135580`. Dashboard at `umami.snjall.is`.

## Development

1. Edit files in `docs/` (app.js, index.html, styles.css)
2. Keep pure functions synced in tests.js
3. `node tests.js` — all must pass
4. Deployed via GitHub Pages from `docs/` on `main`
