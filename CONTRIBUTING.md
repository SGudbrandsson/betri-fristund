# Contributing to Betri Frístund

Thanks for your interest — all contributions are welcome, from small copy fixes to new filter features.

## Setup

No install step needed.

```bash
git clone https://github.com/SGudbrandsson/betri-fristund.git
cd betri-fristund
open docs/index.html   # or: npx serve docs
```

That's it. There's no `npm install`, no build step, and no dev server required.

## Running tests

```bash
node tests.js
```

All tests must pass before submitting a PR. The suite covers `isValidActivity()`, translations, URL state, age filtering, and more (~210 tests).

## Key rule: synced functions

Three files must stay in sync at all times:

| File | Contains |
|------|---------|
| `docs/app.js` | Canonical source |
| `tests.js` | Duplicate of pure functions for testing |
| `scripts/fetch-events.js` | Server-side copy for the data pipeline |

**`isValidActivity()`** and the **`TRANSLATIONS`** object must be identical across all three files. If you change one, update the others.

## Common contribution types

### New exclusion filter

Something slipping through that isn't a real activity for children? Add a filter:

1. Add a regex or condition to `isValidActivity()` in `docs/app.js`
2. Copy the updated function verbatim to `tests.js` and `scripts/fetch-events.js`
3. Add test cases to `tests.js` covering the new rule
4. Run `node tests.js` — all tests must pass

### New translation key

1. Add the key to both `TRANSLATIONS.is` and `TRANSLATIONS.en` in `docs/app.js`
2. Use `data-i18n="key"` in `docs/index.html` or `t('key')` in JS
3. Mirror the key in the `TRANSLATIONS` object in `tests.js`
4. If the key is used in a static HTML element, add it to the `htmlI18nKeys` array in `tests.js`
5. Run `node tests.js`

### Refreshing event data locally

```bash
node scripts/fetch-events.js
```

This takes ~5–7 minutes and writes a fresh `docs/events.json`. You don't need to commit this file — it's auto-generated daily by GitHub Actions.

## Pull request checklist

- [ ] `node tests.js` passes with no failures
- [ ] If you touched `isValidActivity()` or `TRANSLATIONS`, all three synced files are updated
- [ ] Icelandic copy has been reviewed for correctness (ask if unsure — we're happy to help)
- [ ] No npm packages, build tools, or frameworks introduced

## Where to get help

Open an issue — questions, ideas, and bug reports are all welcome.
