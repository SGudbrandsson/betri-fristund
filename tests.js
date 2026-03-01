/**
 * Automated tests for Betri Frístund
 * Run with: node tests.js
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
  }
}

// ── Extract pure functions from app.js for testing ──────────────────

function toApiDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${parseInt(d, 10)}-${parseInt(m, 10)}-${y}`;
}

function formatDate(apiDate) {
  if (!apiDate) return '';
  const parts = apiDate.split('-');
  if (parts.length !== 3) return apiDate;
  const [d, m, y] = parts;
  const months = ['jan.', 'feb.', 'mars', 'apríl', 'maí', 'júní',
                   'júlí', 'ágúst', 'sept.', 'okt.', 'nóv.', 'des.'];
  return `${parseInt(d, 10)}. ${months[parseInt(m, 10) - 1]} ${y}`;
}

const POSTAL_NAMES = {
  '101': 'Miðborg', '104': 'Laugardalur', '107': 'Vesturbær',
  '108': 'Háaleiti', '109': 'Breiðholt', '110': 'Árbær',
  '111': 'Breiðholt', '112': 'Grafarvogur', '113': 'Grafarholt',
  '116': 'Kjalarnes', '121': 'Mosfellsbær', '125': 'Álftanes',
  '128': 'Seltjarnarnes', '130': 'Garðabær',
  '201': 'Kópavogur', '220': 'Hafnarfjörður',
};

function getLocationName(code) {
  const trimmed = code.trim();
  return POSTAL_NAMES[trimmed]
    ? `${POSTAL_NAMES[trimmed]} (${trimmed})`
    : trimmed;
}

function getLocationShort(code) {
  const trimmed = code.trim();
  return POSTAL_NAMES[trimmed] || trimmed;
}

const TAG_LABELS = {
  football: 'Fótbolti', basketball: 'Körfubolti', handball: 'Handbolti',
  swimming: 'Sund', gymnastics: 'Fimleikar', summer_camp: 'Sumarbúðir',
};

function getTagLabel(tag) {
  return TAG_LABELS[tag] || tag;
}

const TAG_CATEGORIES = [
  { label: 'Sumarbúðir', icon: '☀️', tags: ['summer_camp'] },
  { label: 'Fótbolti',   icon: '⚽', tags: ['football'] },
  { label: 'Sund',       icon: '🏊', tags: ['swimming'] },
];

const TAG_ICONS = {};
TAG_CATEGORIES.forEach((cat) => {
  cat.tags.forEach((t) => { TAG_ICONS[t] = cat.icon; });
});

function getCardIcon(tags) {
  for (const t of tags) {
    if (TAG_ICONS[t]) return TAG_ICONS[t];
  }
  return '🌟';
}

function isValidActivity(card) {
  const t = card.title;
  if (/keikogi|æfingagalli/i.test(t)) return false;
  if (/gjafakort|gift\s*card/i.test(t)) return false;
  if (/^áfrýjunargjald$/i.test(t)) return false;
  if (card.tags.length === 1 && card.tags[0] === 'other') {
    if (/\bgjald\b|\bgjöld\b/i.test(t) && !/æfing|þjálfun|námskeið|leikskóli/i.test(t)) {
      return false;
    }
  }
  if (/world\s*class/i.test(t) && /gjafakort|gift/i.test(t)) return false;
  if (/^greiðsla\b|^kvittun\b/i.test(t)) return false;
  return true;
}

function parseNextData(html) {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  let start = html.indexOf(marker);
  let data;
  if (start !== -1) {
    const jsonStart = start + marker.length;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    data = JSON.parse(html.substring(jsonStart, jsonEnd));
  } else {
    const alt = '__NEXT_DATA__';
    const altIdx = html.indexOf(alt);
    if (altIdx === -1) throw new Error('Gat ekki lesið gögn');
    const scriptStart = html.lastIndexOf('<script', altIdx);
    const scriptEnd = html.indexOf('</script>', altIdx);
    if (scriptStart === -1 || scriptEnd === -1) throw new Error('Gat ekki lesið gögn');
    const tagEnd = html.indexOf('>', scriptStart) + 1;
    data = JSON.parse(html.substring(tagEnd, scriptEnd));
  }
  return data.props || data;
}

function getDefaultDates() {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() > 7) year++;
  return { from: `${year}-06-01`, to: `${year}-08-31` };
}

// ── Tests ───────────────────────────────────────────────────────────

console.log('\n=== toApiDate ===');
assertEqual(toApiDate('2026-06-01'), '1-6-2026', 'converts ISO date to API format');
assertEqual(toApiDate('2026-08-31'), '31-8-2026', 'converts end-of-month date');
assertEqual(toApiDate('2026-12-05'), '5-12-2026', 'strips leading zeros');
assertEqual(toApiDate(''), '', 'handles empty string');
assertEqual(toApiDate(undefined), '', 'handles undefined');

console.log('\n=== formatDate ===');
assertEqual(formatDate('1-6-2026'), '1. júní 2026', 'formats June date in Icelandic');
assertEqual(formatDate('31-8-2026'), '31. ágúst 2026', 'formats August date');
assertEqual(formatDate('15-1-2026'), '15. jan. 2026', 'formats January date');
assertEqual(formatDate('25-12-2025'), '25. des. 2025', 'formats December date');
assertEqual(formatDate(''), '', 'handles empty string');
assertEqual(formatDate('invalid'), 'invalid', 'returns invalid input as-is');

console.log('\n=== getLocationName ===');
assertEqual(getLocationName('101'), 'Miðborg (101)', 'returns full location name');
assertEqual(getLocationName('220'), 'Hafnarfjörður (220)', 'returns Hafnarfjörður');
assertEqual(getLocationName(' 101 '), 'Miðborg (101)', 'trims whitespace');
assertEqual(getLocationName('999'), '999', 'returns unknown code as-is');

console.log('\n=== getLocationShort ===');
assertEqual(getLocationShort('101'), 'Miðborg', 'returns short location name');
assertEqual(getLocationShort('999'), '999', 'returns unknown code as-is');

console.log('\n=== getTagLabel ===');
assertEqual(getTagLabel('football'), 'Fótbolti', 'translates known tag');
assertEqual(getTagLabel('swimming'), 'Sund', 'translates swimming');
assertEqual(getTagLabel('unknown_tag'), 'unknown_tag', 'returns unknown tag as-is');

console.log('\n=== getCardIcon ===');
assertEqual(getCardIcon(['football']), '⚽', 'returns football icon');
assertEqual(getCardIcon(['swimming', 'summer_camp']), '🏊', 'returns first matching icon');
assertEqual(getCardIcon(['unknown']), '🌟', 'returns default star for unknown tags');
assertEqual(getCardIcon([]), '🌟', 'returns default for empty tags');

console.log('\n=== isValidActivity ===');
assert(isValidActivity({ title: 'Sumarfótbolti', tags: ['football'] }), 'accepts normal activity');
assert(isValidActivity({ title: 'Sumarbúðir 2026', tags: ['summer_camp'] }), 'accepts summer camp');
assert(!isValidActivity({ title: 'Keikogi stór', tags: ['other'] }), 'rejects keikogi (merchandise)');
assert(!isValidActivity({ title: 'Gjafakort', tags: ['other'] }), 'rejects gift cards');
assert(!isValidActivity({ title: 'World Class Gjafakort', tags: ['other'] }), 'rejects World Class gift cards');
assert(!isValidActivity({ title: 'Áfrýjunargjald', tags: ['other'] }), 'rejects appeal fees');
assert(!isValidActivity({ title: 'Greiðsla vegna námskeiðs', tags: ['other'] }), 'rejects payments');
assert(!isValidActivity({ title: 'Kvittun', tags: ['other'] }), 'rejects receipts');
assert(isValidActivity({ title: 'Skráningargjald', tags: ['other'] }), 'allows compound word Skráningargjald (gjald not standalone)');
assert(!isValidActivity({ title: 'Skráningar gjald', tags: ['other'] }), 'rejects standalone gjald with single other tag');
assert(isValidActivity({ title: 'Skráningar gjald', tags: ['football', 'other'] }), 'accepts gjald with multiple tags');
assert(isValidActivity({ title: 'Æfingargjald', tags: ['other'] }), 'accepts training fee (has æfing)');

console.log('\n=== parseNextData ===');

// Test with standard Next.js structure (props.pageProps)
const nextDataHtml = '<html><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"cards":[{"id":"1","title":"Test"}],"pageInfo":{"page":1}}}}</script></html>';
const parsed = parseNextData(nextDataHtml);
assert(parsed.pageProps !== undefined, 'extracts pageProps from props wrapper');
assertEqual(parsed.pageProps.cards.length, 1, 'finds cards array');
assertEqual(parsed.pageProps.cards[0].title, 'Test', 'card data is correct');
assertEqual(parsed.pageProps.pageInfo.page, 1, 'pageInfo is correct');

// Test with flat structure (pageProps at top level — backward compat)
const flatDataHtml = '<html><script id="__NEXT_DATA__" type="application/json">{"pageProps":{"cards":[{"id":"2","title":"Flat"}],"pageInfo":{"page":1}}}</script></html>';
const parsedFlat = parseNextData(flatDataHtml);
assert(parsedFlat.pageProps !== undefined, 'handles flat structure (no props wrapper)');
assertEqual(parsedFlat.pageProps.cards[0].title, 'Flat', 'flat structure card data is correct');

// Test with missing __NEXT_DATA__
let parseError = null;
try {
  parseNextData('<html><body>No data here</body></html>');
} catch (e) {
  parseError = e.message;
}
assertEqual(parseError, 'Gat ekki lesið gögn', 'throws on missing __NEXT_DATA__');

console.log('\n=== getDefaultDates ===');
const defaults = getDefaultDates();
assert(defaults.from.endsWith('-06-01'), 'default from date is June 1');
assert(defaults.to.endsWith('-08-31'), 'default to date is August 31');
const year = parseInt(defaults.from.split('-')[0], 10);
const now = new Date();
if (now.getMonth() > 7) {
  assertEqual(year, now.getFullYear() + 1, 'after August, defaults to next year');
} else {
  assertEqual(year, now.getFullYear(), 'before September, defaults to current year');
}

// ── Integration: live API test ──────────────────────────────────────

console.log('\n=== Live API integration ===');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function testLiveApi() {
  try {
    const BASE_URL = 'https://fristund.is';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(BASE_URL + '/?age=6&from=1-6-2026&to=31-8-2026')}`;

    const res = await httpsGet(proxyUrl);
    assertEqual(res.status, 200, `CORS proxy returns HTTP ${res.status}`);

    const html = res.body;
    assert(html.includes('__NEXT_DATA__'), 'response contains __NEXT_DATA__');

    const data = parseNextData(html);
    assert(data.pageProps !== undefined, 'parseNextData returns pageProps');

    const cards = data.pageProps.cards;
    assert(Array.isArray(cards), 'cards is an array');
    assert(cards.length > 0, `got ${cards.length} cards from API`);

    const pageInfo = data.pageProps.pageInfo;
    assert(pageInfo !== undefined, 'pageInfo exists');
    assert(typeof pageInfo.itemCount === 'number', `total items: ${pageInfo.itemCount}`);
    assert(typeof pageInfo.hasNextPage === 'boolean', 'hasNextPage is boolean');

    // Verify card structure
    const card = cards[0];
    assert(typeof card.id === 'string', 'card has id');
    assert(typeof card.title === 'string', 'card has title');
    assert(Array.isArray(card.tags), 'card has tags array');

    // Verify filtering works
    const filtered = cards.filter(isValidActivity);
    assert(filtered.length > 0, `${filtered.length} of ${cards.length} cards pass filter`);
    console.log(`  ℹ ${filtered.length}/${cards.length} cards are valid activities`);

  } catch (err) {
    if (err.code === 'EAI_AGAIN' || err.code === 'ENOTFOUND') {
      console.log(`  ⊘ Skipped (no network): ${err.message}`);
    } else {
      failed++;
      console.error(`  ✗ Live API test failed: ${err.message}`);
    }
  }
}

testLiveApi().then(() => {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
});
