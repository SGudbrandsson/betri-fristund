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
  const desc = card.description || '';
  if (/^Get Together/i.test(t)) return false;
  if (/félagsgjald/i.test(t)) return false;
  if (/gjafabréf|gjafakort|gift\s*card/i.test(t)) return false;
  if (/keikogi|æfingagalli|fatnaður/i.test(t)) return false;
  if (/^áfrýjunargjald$/i.test(t)) return false;
  if (/áskrift|árskort|ársgjald|staðgreidd kort|námsmannakort|félagsskírteini/i.test(t)) return false;
  if (/^greiðsla\b|^kvittun\b/i.test(t)) return false;
  if (/æfingagj[aö]/i.test(t)) return false;
  if (/almannaheill|styrktarlína|styrktaraðilar/i.test(t)) return false;
  if (/keppnispassi/i.test(t)) return false;
  if (card.tags.length === 1 && card.tags[0] === 'other') {
    if (/\bgjald\b|\bgjöld\b/i.test(t) && !/æfing|þjálfun|námskeið|leikskóli/i.test(t)) {
      return false;
    }
  }
  if (/stuðningsfélagar/i.test(t)) return false;
  if (/stuðningsaðili/i.test(t)) return false;
  if (/\bstyrkur\b|\bstyrkir\b/i.test(t) && !/frístundastyrkur/i.test(t)) return false;
  if (/mokestis/i.test(t)) return false;
  if (/fylkisrút/i.test(t)) return false;
  if (/\bfylgd\b/i.test(t)) return false;
  if (/^Kort\b|opið kort|stakir mánuðir/i.test(t)) return false;
  if (/iðkendagjald|árgjald/i.test(t)) return false;
  if (/félagsaðild|\baðild\b/i.test(t)) return false;
  if (/\bfullorðin|\bfullorðn/i.test(t) && !/börn/i.test(t)) return false;
  if (/\bmasters\b/i.test(t)) return false;
  if (/\b60\s*\+|60 ára og eldri|\beldri borgar/i.test(t)) return false;
  const club = card.clubname || '';
  if (/^World Class\b/i.test(club) && /infrared|pilates|barre|toning|betra form|hot yoga|mömmu/i.test(t)) return false;
  if (/^Vesenisferðir/i.test(club)) return false;
  if (/hilton.*spa/i.test(club)) return false;
  if (Array.isArray(card.age) && card.age.length >= 1) {
    if (Math.min(...card.age) >= 18) return false;
  }
  if (/\b(FIN|CHE|FRA|ITA|DEN|ESP|AUT|HUN|GER|NOR|SWE)\b/.test(t) && /meistaramót|bikarmót/i.test(t)) return false;
  // Remote/online/distance courses (not physical kid activities)
  if (/fjarnámskeið|\bonline\b|fjarþjálfun/i.test(t)) return false;
  // Mom/pregnancy fitness (adult-only)
  if (/\bmömmu|\bmömmur|meðgöngu/i.test(t)) return false;
  // Clip cards / punch cards (not activities)
  if (/klippikort|clip\s*card/i.test(t)) return false;
  // Gym/health membership cards
  if (/heilsuræktarkort/i.test(t)) return false;
  // Known adult-only clubs (zero kid events)
  if (/^Kramhúsið$/i.test(club)) return false;
  if (/^Pilates Port/i.test(club)) return false;
  if (/^Heilsuklasinn$/i.test(club)) return false;
  if (/^Stígandi/i.test(club)) return false;
  if (/^Orka Studio/i.test(club)) return false;
  if (/^Ultraform$/i.test(club)) return false;
  // The Dance Space: adult fitness classes (keep kids cheerleading)
  if (/^The Dance Space/i.test(club) && /\bpilates\b|\baerobics\b|\baerial\s+yoga\b/i.test(t)) return false;
  // Description-based checks (for enriched data)
  if (desc) {
    if (/\bgjafakort\b/i.test(desc)) return false;
    if (/stuðningsmannaklúbb/i.test(desc)) return false;
    if (/marka\s+fótspor/i.test(desc)) return false;
  }
  return true;
}

// ── URL state functions (mirrored from app.js) ────────────────────

function stateToUrl(s) {
  const params = new URLSearchParams();
  if (s.age) params.set('age', s.age);
  if (s.from) params.set('from', s.from);
  if (s.to) params.set('to', s.to);
  if (s.tags) params.set('tags', s.tags);
  if (s.postCode) params.set('postCode', s.postCode);
  if (s.sortBy) params.set('sortBy', s.sortBy);
  if (s.page > 1) params.set('page', String(s.page));
  return params.toString();
}

function parseUrlState(queryString) {
  const params = new URLSearchParams(queryString);
  return {
    age: params.get('age') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    tags: params.get('tags') || '',
    postCode: params.get('postCode') || '',
    sortBy: params.get('sortBy') || '',
    page: parseInt(params.get('page'), 10) || 1,
  };
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

console.log('\n=== isValidActivity (new filters) ===');

// Get Together spam
assert(!isValidActivity({ title: 'Get Together: List, samfélag og ímyndum', tags: ['Myndlist'] }), 'rejects Get Together spam');
assert(!isValidActivity({ title: 'Get together viðburður', tags: ['other'] }), 'rejects Get Together case-insensitive');
assert(isValidActivity({ title: 'Lets get together and play', tags: ['football'] }), 'allows "get together" mid-title');

// Membership fees
assert(!isValidActivity({ title: 'Félagsgjald Liverpoolklúbbsins', tags: ['leisure_'] }), 'rejects félagsgjald');
assert(!isValidActivity({ title: 'Árlegt félagsgjald', tags: ['climbing'] }), 'rejects árlegt félagsgjald');
assert(!isValidActivity({ title: 'Félagsgjald MUSC Iceland 2025 til 2026', tags: ['social_work'] }), 'rejects MUSC félagsgjald');

// Gift certificates (gjafabréf)
assert(!isValidActivity({ title: '10.000 kr gjafabréf', tags: ['gym'] }), 'rejects gjafabréf');
assert(!isValidActivity({ title: 'Box 101 - gjafabréf', tags: ['other'] }), 'rejects Box gjafabréf');

// Merchandise/clothing
assert(!isValidActivity({ title: 'Hjólafatnaður - Sokkar', tags: ['cycling'] }), 'rejects fatnaður (clothing)');
assert(!isValidActivity({ title: 'Hjólafatnaður - Monton stíðerma treyja', tags: ['cycling'] }), 'rejects cycling jersey');

// Subscriptions
assert(!isValidActivity({ title: 'Mánaðarleg áskrift', tags: ['climbing'] }), 'rejects áskrift');
assert(!isValidActivity({ title: 'Áskrift í GoMove Konur hópþjálfun', tags: ['gym'] }), 'rejects GoMove áskrift');
assert(!isValidActivity({ title: 'Áskriftarleiðir Reykjavík', tags: ['athletics'] }), 'rejects áskriftarleiðir');

// Annual passes and cards
assert(!isValidActivity({ title: 'Árskort GFR', tags: ['boxing'] }), 'rejects árskort');
assert(!isValidActivity({ title: 'Árskort í Keiluhöllina', tags: ['bowling'] }), 'rejects keiluhöll árskort');
assert(!isValidActivity({ title: 'Staðgreidd kort / Pre-paid memberships', tags: ['climbing'] }), 'rejects staðgreidd kort');
assert(!isValidActivity({ title: 'Námsmannakort / Student memberships', tags: ['climbing'] }), 'rejects námsmannakort');

// Membership certificates
assert(!isValidActivity({ title: 'Félagsskírteini Alliance Française', tags: ['other'] }), 'rejects félagsskírteini');

// Supporters clubs
assert(!isValidActivity({ title: 'Stuðningsfélagar borðtennisdeildar', tags: ['table_tennis'] }), 'rejects stuðningsfélagar');

// Practice fees with non-other tags (now always filtered)
assert(!isValidActivity({ title: 'Fótbolti 8. flokkur - æfingagjöld', tags: ['football'] }), 'rejects æfingagjöld with football tag');
assert(!isValidActivity({ title: 'Æfingagjald 8. fl. kk/kvk', tags: ['football'] }), 'rejects æfingagjald with football tag');

// Annual fees (ársgjald)
assert(!isValidActivity({ title: 'NH Vinir (Ársgjald)', tags: ['running'] }), 'rejects ársgjald');

// Donations/fundraising/sponsorship
assert(!isValidActivity({ title: 'Mánaðarlegir styrkir / almannaheill', tags: ['climbing'] }), 'rejects almannaheill donations');
assert(!isValidActivity({ title: 'Eingreiðslu styrkur - almannaheill', tags: ['climbing'] }), 'rejects one-time charity donation');
assert(!isValidActivity({ title: 'Styrktarlína Elliða', tags: ['football'] }), 'rejects styrktarlína fundraising');
assert(!isValidActivity({ title: 'Bakland - styrktaraðilar 2025 - 2026', tags: ['scouts'] }), 'rejects styrktaraðilar sponsorship');

// Competition passes
assert(!isValidActivity({ title: 'Keppnispassi haust 2025 - vor 2026', tags: ['swimming'] }), 'rejects keppnispassi');

// Donations to elite teams (styrkur/styrkir but not frístundastyrkur)
assert(!isValidActivity({ title: 'Eingreiðslu styrkur til AFREKSHÓPS', tags: ['climbing'] }), 'rejects styrkur to elite team');
assert(!isValidActivity({ title: 'Mánaðarlegur styrkur til AFREKSHÓPS', tags: ['climbing'] }), 'rejects monthly styrkur');
assert(isValidActivity({ title: 'Sumarbúðir 10-12 ára - Frístundastyrkur 2026', tags: ['other'] }), 'allows frístundastyrkur');
assert(isValidActivity({ title: '10-12 ára námskeið - frístundastyrkur 2026', tags: ['education'] }), 'allows námskeið with frístundastyrkur');

// Foreign-language fees
assert(!isValidActivity({ title: 'Bendruomenės nario mokestis 2026 m.-', tags: ['social_work'] }), 'rejects Lithuanian membership fee');

// Bus passes
assert(!isValidActivity({ title: 'Fylkisrútan 2025-2026', tags: ['other'] }), 'rejects bus pass');

// School escorts
assert(!isValidActivity({ title: 'Grandaskóli - fylgd', tags: ['youth_activity'] }), 'rejects school escort');
assert(!isValidActivity({ title: 'Melaskóli - fylgd', tags: ['youth_activity'] }), 'rejects school escort');

// Card/pass purchases and subscription periods
assert(!isValidActivity({ title: 'Kort / Cards', tags: ['boxing'] }), 'rejects card purchase');
assert(!isValidActivity({ title: 'Opið kort - Almennt', tags: ['yoga'] }), 'rejects open card');
assert(!isValidActivity({ title: 'Stakir mánuðir', tags: ['other'] }), 'rejects single months subscription');

// Legitimate activities still pass
assert(isValidActivity({ title: 'Fótboltaæfingar', tags: ['football'] }), 'allows normal football training');
assert(isValidActivity({ title: 'Sumarbúðir 10-12 ára', tags: ['summer_camp'] }), 'allows summer camp');
assert(isValidActivity({ title: 'Box 101 unglinga', tags: ['boxing'] }), 'allows boxing class');
assert(isValidActivity({ title: 'Borðtennis 2025-2026', tags: ['table_tennis'] }), 'allows table tennis');
assert(isValidActivity({ title: 'Glíma 7-9 ára', tags: ['jiu_jitsu'] }), 'allows wrestling for kids');

console.log('\n=== isValidActivity (adult/fee/age filters) ===');

// Additional fee terms
assert(!isValidActivity({ title: 'Iðkendagjald 2025-2026 (18 ára og eldri)', tags: ['volleyball'] }), 'rejects iðkendagjald');
assert(!isValidActivity({ title: 'Iðkendagjald 2025-2026 (17 ára og yngri)', tags: ['volleyball'] }), 'rejects iðkendagjald (youth)');
assert(!isValidActivity({ title: 'Ægir3 árgjald fyrir 25 ára og yngri', tags: ['triathlon'] }), 'rejects árgjald');
assert(!isValidActivity({ title: 'Árgjald 20 ára og eldri', tags: ['archery'] }), 'rejects archery árgjald');

// Membership/admission terms
assert(!isValidActivity({ title: 'Félagsaðild 2026 - Silfur', tags: ['frisbee_golf'] }), 'rejects félagsaðild');
assert(!isValidActivity({ title: 'Bundin og óbundin aðild', tags: ['other'] }), 'rejects aðild');
assert(!isValidActivity({ title: 'Félagsaðild 25/26', tags: ['social_work'] }), 'rejects félagsaðild 25/26');

// Adult-only markers
assert(!isValidActivity({ title: 'Fullorðnir', tags: ['jiu_jitsu'] }), 'rejects fullorðnir');
assert(!isValidActivity({ title: 'Box Framhald fullorðnir', tags: ['boxing'] }), 'rejects boxing fullorðnir');
assert(!isValidActivity({ title: 'Fullorðnir vorönn 2026', tags: ['taekwondo'] }), 'rejects taekwondo fullorðnir');
assert(!isValidActivity({ title: 'Einkatímar fyrir fullorðna', tags: ['language_courses'] }), 'rejects fullorðna courses');
assert(isValidActivity({ title: 'Læti! Tónlistartímar fyrir börn og fullorðna', tags: ['Sviðslist'] }), 'allows börn og fullorðna');

// Masters
assert(!isValidActivity({ title: 'Frjálsar, ÍR eldri-masters', tags: ['athletics'] }), 'rejects masters');

// Senior/60+ activities
assert(!isValidActivity({ title: '60+', tags: ['gym'] }), 'rejects 60+');
assert(!isValidActivity({ title: '60+ grunnnámskeið', tags: ['gym'] }), 'rejects 60+ course');
assert(!isValidActivity({ title: '60+ Þrek í Þrótti', tags: ['public_sports'] }), 'rejects 60+ Þrek');
assert(!isValidActivity({ title: 'Eldri borgara leikfimi', tags: ['gym', 'other'] }), 'rejects eldri borgarar');
assert(!isValidActivity({ title: 'Eldri borgarar - Baðstofan og heilsurækt', tags: ['gym'] }), 'rejects eldri borgarar gym');

// World Class adult fitness
assert(!isValidActivity({ title: 'Infrared BarreFit með Töru í Laugum', tags: ['gym'], clubname: 'World Class' }), 'rejects WC infrared barre');
assert(!isValidActivity({ title: 'Infrared Pilates & Barre Mix', tags: ['gym'], clubname: 'World Class' }), 'rejects WC pilates');
assert(!isValidActivity({ title: 'Hot Yoga Posture Clinic', tags: ['gym'], clubname: 'World Class' }), 'rejects WC hot yoga');
assert(!isValidActivity({ title: 'MömmuFit með Guðrúnu', tags: ['gym'], clubname: 'World Class' }), 'rejects WC mömmufit');
assert(!isValidActivity({ title: 'Infrared Betra Form í Egilshöll', tags: ['gym'], clubname: 'World Class' }), 'rejects WC betra form');
assert(isValidActivity({ title: 'DWC Danskeppni', tags: ['dance'], clubname: 'World Class' }), 'allows WC dance competition');
assert(isValidActivity({ title: 'Skólakort 2026', tags: ['gym'], clubname: 'World Class' }), 'allows WC school card');

// Vesenisferðir (adult hiking)
assert(!isValidActivity({ title: 'Langbrölt vor 2026', tags: ['other'], clubname: 'Vesenisferðir ehf.' }), 'rejects Vesenisferðir hiking');
assert(!isValidActivity({ title: 'Hornstrandir með gistingu', tags: ['travel'], clubname: 'Vesenisferðir ehf.' }), 'rejects Vesenisferðir Hornstrandir');

// Hilton SPA
assert(!isValidActivity({ title: 'Yoga Soft Flow', tags: ['gym'], clubname: 'Hilton Reykjavík SPA' }), 'rejects Hilton SPA yoga');
assert(!isValidActivity({ title: '60 plús kl 13:00', tags: ['gym'], clubname: 'Hilton Reykjavík SPA' }), 'rejects Hilton SPA 60+');

// Age-gated 18+ events
assert(!isValidActivity({ title: 'Jóga kvöld', tags: ['yoga'], age: [99, 18] }), 'rejects age 18-99');
assert(!isValidActivity({ title: 'Pilates', tags: ['gym'], age: [25, 18] }), 'rejects age 18-25');
assert(!isValidActivity({ title: 'RS. Snúður', tags: ['scouts'], age: [23, 18] }), 'rejects scouts 18+');
assert(isValidActivity({ title: 'Fótbolti 8 ára', tags: ['football'], age: [12, 8] }), 'allows age 8-12');
assert(isValidActivity({ title: 'Sund 14-17', tags: ['swimming'], age: [17, 14] }), 'allows age 14-17');
assert(isValidActivity({ title: 'Brazilian Jiu Jitsu 101', tags: ['jiu_jitsu'], age: [126, 16] }), 'allows age 16+ (min < 18)');
assert(isValidActivity({ title: 'Dans', tags: ['dance'] }), 'allows no age field');
assert(isValidActivity({ title: 'Ungbarnafimi', tags: ['other'], age: [3, 2] }), 'allows toddler activities');

// International competition trips
assert(!isValidActivity({ title: 'FIN Helsinki Norðurlandameistaramót L 15.-18. okt', tags: ['climbing'] }), 'rejects FIN competition trip');
assert(!isValidActivity({ title: 'ESP Barcelona Evrópumeistaramót G 16.-20. júlí', tags: ['climbing'] }), 'rejects ESP competition trip');
assert(!isValidActivity({ title: 'DEN Kaupmannahöfn Bikarmót L 21.-24. ágúst', tags: ['climbing'] }), 'rejects DEN bikarmót');
assert(isValidActivity({ title: 'Klifurmót KÍ 2026', tags: ['climbing'] }), 'allows local climbing competition');

// Edge cases: "eldri" in kid contexts (not matching "eldri borgar")
assert(isValidActivity({ title: 'Íþróttaskóli Vals - Eldri hópur Vor 2026', tags: ['public_sports'], age: [6, 4] }), 'allows "Eldri hópur" for young kids');
assert(isValidActivity({ title: 'Grunnhópar eldri kk', tags: ['gymnastics'], age: [7] }), 'allows "eldri" group for kids (single age)');

// Remote/online/distance courses
assert(!isValidActivity({ title: 'ONLINE Courses', tags: ['gym'] }), 'rejects ONLINE Courses');
assert(!isValidActivity({ title: 'Stærðfræðifærni 9. bekkur - fjarnámskeið', tags: ['education'], age: [15] }), 'rejects fjarnámskeið');
assert(!isValidActivity({ title: 'Stærðfræðifærni 8. - 10. - Allur pakkinn, fjarnámskeið', tags: ['education'] }), 'rejects allur pakkinn fjarnámskeið');
assert(!isValidActivity({ title: 'Fjarþjálfun grunnnámskeið', tags: ['health'] }), 'rejects fjarþjálfun');
assert(isValidActivity({ title: 'Stærðfræði grunnfærni 7 - 10', tags: ['education'] }), 'allows in-person math course');

// Mom/pregnancy fitness
assert(!isValidActivity({ title: 'Mömmuþjálfun framhald', tags: ['health'] }), 'rejects mömmuþjálfun');
assert(!isValidActivity({ title: 'Mömmuþjálfun Stíganda apríl', tags: ['public_sports', 'health'] }), 'rejects mömmuþjálfun stíganda');
assert(!isValidActivity({ title: 'ULTRA mömmur - Grafarvogi', tags: ['gym'] }), 'rejects ULTRA mömmur');
assert(!isValidActivity({ title: 'Mömmujóga', tags: ['yoga'] }), 'rejects mömmujóga');
assert(!isValidActivity({ title: 'Meðgönguþjálfun', tags: ['health'] }), 'rejects meðgönguþjálfun');
assert(!isValidActivity({ title: 'Meðgöngusund Stíganda kl. 16:45', tags: ['health', 'other'] }), 'rejects meðgöngusund');

// Clip cards
assert(!isValidActivity({ title: 'Klippikort í opna tíma vor 2026', tags: ['health'] }), 'rejects klippikort');
assert(!isValidActivity({ title: 'Studio Clip Card (Klippikort)', tags: ['gym', 'pilates', 'dance'] }), 'rejects studio clip card');

// Gym membership cards
assert(!isValidActivity({ title: 'Heilsuræktarkort', tags: ['gym'], age: [126, 13] }), 'rejects heilsuræktarkort');

// Known adult-only clubs
assert(!isValidActivity({ title: 'Jazz', tags: ['dance'], clubname: 'Kramhúsið' }), 'rejects Kramhúsið');
assert(!isValidActivity({ title: 'Barre', tags: ['dance'], clubname: 'Kramhúsið' }), 'rejects Kramhúsið barre');
assert(!isValidActivity({ title: 'Reformer grunnnámskeið', tags: ['health'], clubname: 'Pilates Port Iceland ' }), 'rejects Pilates Port');
assert(!isValidActivity({ title: 'Þjálfun í vatni', tags: ['gym'], clubname: 'Heilsuklasinn' }), 'rejects Heilsuklasinn');
assert(!isValidActivity({ title: 'Vatnsþjálfun 3 kl. 13:45', tags: ['gym'], clubname: 'Stígandi Sjúkraþjálfun' }), 'rejects Stígandi');
assert(!isValidActivity({ title: 'KvenOrka', tags: ['health'], clubname: 'Orka Studio' }), 'rejects Orka Studio');
assert(!isValidActivity({ title: 'Hóptímar Ultraform', tags: ['gym'], clubname: 'Ultraform' }), 'rejects Ultraform');

// The Dance Space: adult classes rejected, kid classes kept
assert(!isValidActivity({ title: 'Mat Pilates | March', tags: ['gym', 'dance'], clubname: 'The Dance Space Reykjavík' }), 'rejects Dance Space pilates');
assert(!isValidActivity({ title: 'Step aerobics | March', tags: ['gym', 'dance'], clubname: 'The Dance Space Reykjavík' }), 'rejects Dance Space aerobics');
assert(!isValidActivity({ title: 'Aerial Yoga | March', tags: ['gym', 'yoga', 'dance'], clubname: 'The Dance Space Reykjavík' }), 'rejects Dance Space aerial yoga');
assert(isValidActivity({ title: 'Cheerleading for 5-8 y.o.', tags: ['gym', 'dance'], clubname: 'The Dance Space Reykjavík' }), 'allows Dance Space cheerleading');

// Supporter/patron titles
assert(!isValidActivity({ title: 'Stuðningsaðili Ægisbúa', tags: ['scouts'] }), 'rejects stuðningsaðili');
assert(!isValidActivity({ title: 'Stuðningsaðili Fjölnis', tags: ['football'] }), 'rejects stuðningsaðili variant');

// Description-based: gift cards in descriptions
assert(!isValidActivity({ title: 'Þematengt frönskunámskeið (16 klst.)', tags: ['other'], description: 'Þetta gjafakort gildir fyrir þematengt frönskunámskeið' }), 'rejects gjafakort in description');
assert(isValidActivity({ title: 'Frönskunámskeið', tags: ['language_courses'], description: 'Lærðu frönsku í sumar' }), 'allows course without gjafakort');

// Description-based: supporter clubs
assert(!isValidActivity({ title: '112an', tags: ['football'], description: '112an stuðningsmannaklúbbur Fjölnis' }), 'rejects stuðningsmannaklúbbur in description');
assert(!isValidActivity({ title: 'Valssporið', tags: ['handball'], description: 'sem vilja marka fótspor í sögu Vals' }), 'rejects marka fótspor in description');
assert(isValidActivity({ title: 'Fótboltaskóli', tags: ['football'], description: 'Frábær fótboltaskóli fyrir börn' }), 'allows normal activity with description');

// Fixed fullorðinn matching (fullorðinndeildar variant)
assert(!isValidActivity({ title: 'Voræfingar fullorðinndeildar RHC 2026', tags: ['other'], age: [18] }), 'rejects fullorðinndeildar');

// Fixed single-element age array
assert(!isValidActivity({ title: 'Hjólatímar', tags: ['gym'], age: [18], clubname: 'Ultraform' }), 'rejects single age [18]');
assert(!isValidActivity({ title: 'Kvennaþrek', tags: ['public_sports'], age: [19] }), 'rejects single age [19]');
assert(isValidActivity({ title: 'Box101 17 ára og eldri', tags: ['boxing'], age: [17] }), 'allows single age [17]');

console.log('\n=== stateToUrl ===');

assertEqual(
  stateToUrl({ age: '6', from: '2026-06-01', to: '2026-08-31', tags: '', postCode: '', sortBy: '', page: 1 }),
  'age=6&from=2026-06-01&to=2026-08-31',
  'serializes age and dates'
);
assertEqual(
  stateToUrl({ age: '', from: '', to: '', tags: 'football', postCode: '101', sortBy: 'name', page: 1 }),
  'tags=football&postCode=101&sortBy=name',
  'serializes tags, postCode, sortBy'
);
assertEqual(
  stateToUrl({ age: '6', from: '', to: '', tags: '', postCode: '', sortBy: '', page: 3 }),
  'age=6&page=3',
  'includes page when > 1'
);
assertEqual(
  stateToUrl({ age: '', from: '', to: '', tags: '', postCode: '', sortBy: '', page: 1 }),
  '',
  'returns empty string when all defaults'
);
assertEqual(
  stateToUrl({ age: '10', from: '2026-06-15', to: '2026-07-31', tags: 'Dans,dance', postCode: '201', sortBy: 'dateFrom', page: 2 }),
  'age=10&from=2026-06-15&to=2026-07-31&tags=Dans%2Cdance&postCode=201&sortBy=dateFrom&page=2',
  'handles tags with commas and all fields'
);

console.log('\n=== parseUrlState ===');

const p1 = parseUrlState('age=6&from=2026-06-01&to=2026-08-31');
assertEqual(p1.age, '6', 'parses age from URL');
assertEqual(p1.from, '2026-06-01', 'parses from date');
assertEqual(p1.to, '2026-08-31', 'parses to date');
assertEqual(p1.page, 1, 'defaults page to 1 when absent');

const p2 = parseUrlState('tags=football&postCode=101&sortBy=name&page=5');
assertEqual(p2.tags, 'football', 'parses tags');
assertEqual(p2.postCode, '101', 'parses postCode');
assertEqual(p2.sortBy, 'name', 'parses sortBy');
assertEqual(p2.page, 5, 'parses page number');

const p3 = parseUrlState('');
assertEqual(p3.age, '', 'empty query returns empty age');
assertEqual(p3.page, 1, 'empty query returns page 1');

console.log('\n=== URL state roundtrip ===');

const origState = { age: '10', from: '2026-06-15', to: '2026-07-31', tags: 'swimming', postCode: '201', sortBy: 'dateFrom', page: 2 };
const serialized = stateToUrl(origState);
const restored = parseUrlState(serialized);
assertEqual(restored.age, origState.age, 'roundtrip preserves age');
assertEqual(restored.from, origState.from, 'roundtrip preserves from');
assertEqual(restored.to, origState.to, 'roundtrip preserves to');
assertEqual(restored.tags, origState.tags, 'roundtrip preserves tags');
assertEqual(restored.postCode, origState.postCode, 'roundtrip preserves postCode');
assertEqual(restored.sortBy, origState.sortBy, 'roundtrip preserves sortBy');
assertEqual(restored.page, origState.page, 'roundtrip preserves page');

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

function cleanText(str) {
  if (!str) return str;
  return str.replace(/\uFFFD+/g, '');
}

console.log('\n=== cleanText ===');
assertEqual(cleanText('Sumarnámskeið fyrir b\uFFFD\uFFFDrn'), 'Sumarnámskeið fyrir brn', 'strips replacement characters');
assertEqual(cleanText('börn \uFFFD\uFFFD 8.-10.bekk'), 'börn  8.-10.bekk', 'strips mid-text replacement chars');
assertEqual(cleanText('Normal text'), 'Normal text', 'passes clean text through unchanged');
assertEqual(cleanText(''), '', 'handles empty string');
assertEqual(cleanText(null), null, 'handles null');
assertEqual(cleanText(undefined), undefined, 'handles undefined');
assertEqual(cleanText('a\uFFFDb\uFFFD\uFFFDc'), 'abc', 'strips single and consecutive replacement chars');

// ── i18n / Translation tests ────────────────────────────────────────

const TRANSLATIONS = {
  is: {
    tagline: 'Hvað á barnið þitt að gera í sumar?',
    welcomeTitle: 'Byrjaðu hér!',
    welcomeText: 'Veldu aldur barnsins og við finnum allt sem er í boði á höfuðborgarsvæðinu í sumar.',
    welcomeAgeLabel: 'Hversu gamalt er barnið?',
    welcomeAgePlaceholder: 'Veldu aldur...',
    filterAge: 'Aldur',
    filterAgeAll: 'Allir aldurshópar',
    filterFrom: 'Frá',
    filterTo: 'Til',
    filterLocation: 'Hvar?',
    filterLocationAll: 'Alls staðar',
    filterSort: 'Röðun',
    sortDefault: 'Sjálfgefið',
    sortName: 'Nafn A-Ö',
    sortDateFrom: 'Byrjar fyrst',
    sortDateTo: 'Endar síðast',
    filterTagsLabel: 'Hvað langar barnið að gera?',
    searchBtn: 'Sjá úrval',
    clearBtn: 'Hreinsa leit',
    loadMore: 'Sýna meira',
    loadingMore: 'Hleð...',
    emptyTitle: 'Við fundum því miður engin námskeið',
    emptyText: 'Prófaðu að breyta aldrinum, víkka út dagsetningarnar eða fækka leitarskilyrðum til að sjá fleiri spennandi valkosti fyrir sumarið.',
    errorTitle: 'Úps, eitthvað fór úrskeiðis',
    errorText: 'Okkur tókst því miður ekki að ná sambandi við frístund.is. Endilega reyndu aftur eftir smá stund.',
    retryBtn: 'Reyna aftur',
    loadingText: 'Leita að námskeiði, íþrótt, listum...',
    footerData: 'Gögn sótt af',
    footerNote: 'Óopinber vefur, hannaður af foreldrum fyrir foreldra, til að einfalda leitina að skemmtilegum sumarnámskeiðum.',
    allTypes: 'Allar tegundir',
    viewDetails: 'Skoða nánar',
    signUp: 'Skrá mig',
    ageYear: 'ára',
    resultsCount: 'niðurstöður sýndar',
    hiddenCount: 'óskylt falið',
    showHidden: 'Sýna falið',
    hideHidden: 'Fela aftur',
    aboutTitle: 'Af hverju þessi síða?',
    aboutText: 'Frístund.is inniheldur félagsgjöld, gjafabréf, búnað og annað sem er ekki starfsemi fyrir börn. Þessi síða sýnir eingöngu raunverulega frístund — sumarbúðir, íþróttir, list og námskeið — svo þú finnir það sem skiptir máli, hraðar.',
    allAges: 'Allir aldrar',
    searchPlaceholder: 'Leita...',
    searchLabel: 'Leit',
    showMore: 'Lesa meira',
    showLess: 'Minna',
    footerCTO: 'Tækniráðgjöf og tæknistjórnun',
    reportEvent: 'Tilkynna',
  },
  en: {
    tagline: 'What should your child do this summer?',
    welcomeTitle: 'Start here!',
    welcomeText: 'Pick your child\'s age and we\'ll find all the activities available in the Reykjavík area this summer.',
    welcomeAgeLabel: 'How old is your child?',
    welcomeAgePlaceholder: 'Choose age...',
    filterAge: 'Age',
    filterAgeAll: 'All ages',
    filterFrom: 'From',
    filterTo: 'To',
    filterLocation: 'Where?',
    filterLocationAll: 'Everywhere',
    filterSort: 'Sort by',
    sortDefault: 'Default',
    sortName: 'Name A-Z',
    sortDateFrom: 'Starts first',
    sortDateTo: 'Ends last',
    filterTagsLabel: 'What does your child want to do?',
    searchBtn: 'Show activities',
    clearBtn: 'Clear search',
    loadMore: 'Show more',
    loadingMore: 'Loading...',
    emptyTitle: 'No activities found',
    emptyText: 'Try changing the age, widening the dates, or removing some filters to discover more fun options for the summer.',
    errorTitle: 'Oops, something went wrong',
    errorText: 'We couldn\'t connect to frístund.is. Please try again in a moment.',
    retryBtn: 'Try again',
    loadingText: 'Searching for courses, sports, and arts...',
    footerData: 'Data from',
    footerNote: 'An unofficial site, made by parents for parents, to make finding fun summer activities easier.',
    allTypes: 'All types',
    viewDetails: 'View details',
    signUp: 'Sign up',
    ageYear: 'years old',
    resultsCount: 'results shown',
    hiddenCount: 'non-activities hidden',
    showHidden: 'Show hidden',
    hideHidden: 'Hide again',
    aboutTitle: 'Why this page?',
    aboutText: 'Frístund.is lists membership fees, gift cards, merchandise and other items that aren\'t actual activities for kids. This page shows only real activities — summer camps, sports, arts and courses — so you find what matters, faster.',
    allAges: 'All ages',
    searchPlaceholder: 'Search...',
    searchLabel: 'Search',
    showMore: 'Read more',
    showLess: 'Less',
    footerCTO: 'CTO services & tech leadership',
    reportEvent: 'Report',
  },
};

function t(lang, key) {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.is[key] || key;
}

console.log('\n=== i18n: Translation keys ===');

// Verify both languages have the same keys
const isKeys = Object.keys(TRANSLATIONS.is).sort();
const enKeys = Object.keys(TRANSLATIONS.en).sort();
assertEqual(isKeys.length, enKeys.length, `IS and EN have same number of keys (${isKeys.length})`);
assertEqual(JSON.stringify(isKeys), JSON.stringify(enKeys), 'IS and EN have identical key sets');

// Verify no empty values
let hasEmptyValue = false;
for (const lang of ['is', 'en']) {
  for (const [key, val] of Object.entries(TRANSLATIONS[lang])) {
    if (!val || val.trim() === '') {
      hasEmptyValue = true;
      console.error(`  ✗ Empty value for ${lang}.${key}`);
      failed++;
    }
  }
}
if (!hasEmptyValue) {
  passed++;
  console.log('  ✓ No empty translation values');
}

console.log('\n=== i18n: t() helper ===');

assertEqual(t('is', 'tagline'), 'Hvað á barnið þitt að gera í sumar?', 't() returns Icelandic tagline');
assertEqual(t('en', 'tagline'), 'What should your child do this summer?', 't() returns English tagline');
assertEqual(t('is', 'welcomeTitle'), 'Byrjaðu hér!', 't() returns IS welcomeTitle');
assertEqual(t('en', 'welcomeTitle'), 'Start here!', 't() returns EN welcomeTitle');
assertEqual(t('is', 'ageYear'), 'ára', 't() returns IS age unit');
assertEqual(t('en', 'ageYear'), 'years old', 't() returns EN age unit');
assertEqual(t('is', 'viewDetails'), 'Skoða nánar', 't() returns IS viewDetails');
assertEqual(t('en', 'viewDetails'), 'View details', 't() returns EN viewDetails');
assertEqual(t('is', 'nonExistentKey'), 'nonExistentKey', 't() falls back to key name for unknown key');
assertEqual(t('en', 'nonExistentKey'), 'nonExistentKey', 't() falls back to key name for unknown EN key');
assertEqual(t('fr', 'tagline'), 'Hvað á barnið þitt að gera í sumar?', 't() falls back to IS for unknown language');

console.log('\n=== i18n: TAG_CATEGORIES labels ===');

const TAG_CATEGORIES_FULL = [
  { label: 'Sumarbúðir',     labelEn: 'Summer camps' },
  { label: 'Fótbolti',       labelEn: 'Football' },
  { label: 'Sund',           labelEn: 'Swimming' },
  { label: 'Fimleikar',      labelEn: 'Gymnastics' },
  { label: 'Handbolti',      labelEn: 'Handball' },
  { label: 'Körfubolti',     labelEn: 'Basketball' },
  { label: 'Dans',           labelEn: 'Dance' },
  { label: 'Myndlist',       labelEn: 'Visual arts' },
  { label: 'Tónlist',        labelEn: 'Music' },
  { label: 'Leiklist',       labelEn: 'Drama' },
  { label: 'Hestar',         labelEn: 'Horse riding' },
  { label: 'Tennis',         labelEn: 'Tennis' },
  { label: 'Bardaíþróttir',  labelEn: 'Martial arts' },
  { label: 'Klifur',         labelEn: 'Climbing' },
  { label: 'Skátar',         labelEn: 'Scouts' },
  { label: 'Frjálsar',       labelEn: 'Athletics' },
  { label: 'Skák',           labelEn: 'Chess' },
  { label: 'Hjól',           labelEn: 'Cycling' },
  { label: 'Jóga',           labelEn: 'Yoga' },
  { label: 'Skautar',        labelEn: 'Ice skating' },
  { label: 'Boltar',         labelEn: 'Ball sports' },
  { label: 'Sirkus',         labelEn: 'Circus' },
  { label: 'Námskeið',       labelEn: 'Courses' },
];

let allHaveLabels = true;
TAG_CATEGORIES_FULL.forEach((cat) => {
  if (!cat.label || !cat.labelEn) {
    allHaveLabels = false;
    console.error(`  ✗ Missing label for category: ${JSON.stringify(cat)}`);
    failed++;
  }
});
if (allHaveLabels) {
  passed++;
  console.log(`  ✓ All ${TAG_CATEGORIES_FULL.length} categories have IS and EN labels`);
}

assertEqual(TAG_CATEGORIES_FULL[0].label, 'Sumarbúðir', 'first category IS label');
assertEqual(TAG_CATEGORIES_FULL[0].labelEn, 'Summer camps', 'first category EN label');
assertEqual(TAG_CATEGORIES_FULL.length, 23, 'correct number of categories');

console.log('\n=== i18n: Key coverage ===');

// All data-i18n keys from index.html should have translations
const htmlI18nKeys = [
  'tagline', 'welcomeTitle', 'welcomeText', 'welcomeAgeLabel', 'welcomeAgePlaceholder',
  'filterAge', 'filterAgeAll', 'filterFrom', 'filterTo',
  'filterLocation', 'filterLocationAll', 'filterSort',
  'sortDefault', 'sortName', 'sortDateFrom', 'sortDateTo',
  'filterTagsLabel', 'searchBtn', 'clearBtn',
  'loadMore', 'emptyTitle', 'emptyText',
  'errorTitle', 'errorText', 'retryBtn', 'loadingText',
  'footerData', 'footerNote',
  'aboutTitle', 'aboutText',
  'searchLabel', 'footerCTO',
];

let allCovered = true;
htmlI18nKeys.forEach((key) => {
  if (!TRANSLATIONS.is[key]) {
    allCovered = false;
    console.error(`  ✗ Missing IS translation for HTML key: ${key}`);
    failed++;
  }
  if (!TRANSLATIONS.en[key]) {
    allCovered = false;
    console.error(`  ✗ Missing EN translation for HTML key: ${key}`);
    failed++;
  }
});
if (allCovered) {
  passed++;
  console.log(`  ✓ All ${htmlI18nKeys.length} HTML i18n keys have IS and EN translations`);
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
