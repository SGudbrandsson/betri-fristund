# Betri Frístund

A vanilla JavaScript web app that helps Icelandic parents find summer activities
for their children. It scrapes data from [frístund.is](https://fristund.is) via
CORS proxies and presents it with a clean, mobile-friendly UI.

## File Structure

```
betri-fristund/
  CLAUDE.md          # This file
  tests.js           # Test suite (node tests.js)
  .gitignore
  docs/              # Served by GitHub Pages
    index.html       # Single page HTML
    app.js           # All application logic (vanilla JS IIFE)
    styles.css       # All styles (mobile-first, no preprocessor)
```

## How It Works

1. User selects child's age on the welcome screen
2. App fetches HTML from fristund.is via CORS proxies (allorigins, corsproxy.io)
3. Parses `__NEXT_DATA__` JSON from the HTML response
4. Filters out non-activity items (fees, merchandise, subscriptions, spam)
5. Smart pagination: auto-fetches additional API pages if filtering removes too
   many results, ensuring each "page" shown has at least 6 valid items
6. Renders activity cards with images, dates, locations, and tags
7. URL query params sync with filter state for shareable/bookmarkable links
8. Browser back/forward works via History API

## Running Tests

```bash
node tests.js
```

Tests include unit tests for pure functions (date formatting, location lookup,
activity filtering, URL state serialization) and an optional live API integration
test (skipped when offline). All tests must pass before pushing.

## Deployment

The app is deployed via GitHub Pages from the `docs/` directory on the `main`
branch. In GitHub repo Settings > Pages, set Source to "Deploy from a branch",
select `main` branch and `/docs` folder.

## Development Workflow

- Branch from `main` for feature work
- Keep everything vanilla JS — no npm, no build tools, no frameworks
- Update `tests.js` when changing pure functions (functions are duplicated for
  Node.js testing since `app.js` runs as a browser IIFE)
- Test locally by opening `docs/index.html` in a browser
- Run `node tests.js` before pushing

## Key Architecture

- `app.js` is a single IIFE — all state and functions are private
- Pure functions are duplicated in `tests.js` for Node.js testing
- CORS proxies are tried in sequence if direct fetch fails
- `isValidActivity()` filters out non-activity items (fees, merchandise, gift
  cards, subscriptions, spam like "Get Together" duplicates). To add a new
  exclusion pattern, add a regex test to this function
- `fetchFiltered()` implements smart pagination: keeps fetching API pages in a
  loop until at least `MIN_RESULTS` (6) valid items are accumulated, so users
  don't see empty pages when heavy filtering removes most raw results
- URL state management syncs filter state to query params via History API
