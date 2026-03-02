# Betri Frístund

**Hjálpar foreldrum að finna sumarnámskeið og frístundastarfsemi fyrir börn — helps Icelandic parents find summer activities for children.**

Live site: **https://fristund.snjall.is**

## What it does

Betri Frístund aggregates summer activity listings from Reykjavík-area clubs and organisations into a single searchable page. Parents can filter by:

- **Age** — show only activities suitable for their child's age
- **Date** — filter by when activities run
- **Location** — find activities in a specific neighbourhood
- **Tag** — browse by category (swimming, sports, arts, etc.)
- **Free text** — search titles, clubs, and descriptions

The UI is fully bilingual (Icelandic / English) and works on mobile.

## Tech stack

- **Vanilla JS** — zero dependencies, no npm, no build step
- **GitHub Pages** — deployed directly from `docs/`
- **GitHub Actions** — refreshes `events.json` daily

## Project structure

| File | Purpose |
|------|---------|
| `docs/index.html` | Single-page HTML with `data-i18n` attributes |
| `docs/app.js` | All client-side logic (~1100 lines, vanilla JS IIFE) |
| `docs/styles.css` | Mobile-first CSS with custom properties |
| `docs/events.json` | Pre-fetched event data (auto-generated, do not edit) |
| `tests.js` | Test suite — run with `node tests.js` |
| `scripts/fetch-events.js` | Server-side fetch/filter/enrich script (no deps) |

## Running locally

No install step needed. Just open the page in a browser:

```bash
open docs/index.html
# or serve it locally:
npx serve docs
```

Run the test suite:

```bash
node tests.js
```

All tests must pass before pushing.

## Data pipeline

`docs/events.json` is auto-refreshed every day via the `fetch-events.yml` GitHub Actions workflow. To refresh it manually:

```bash
node scripts/fetch-events.js          # runs locally (~5–7 min)
gh workflow run fetch-events.yml      # trigger the GitHub Action
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, the synced-functions rule, and a PR checklist.

## License

MIT
