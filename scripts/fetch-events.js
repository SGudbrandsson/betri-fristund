/**
 * Fetch, filter, and enrich events from frístund.is
 *
 * Fetches all event listing pages, applies isValidActivity() filter,
 * then enriches each valid event with description/signupUrl from detail pages.
 * Writes result to docs/events.json.
 *
 * No dependencies — uses Node.js built-in https module.
 * Run with: node scripts/fetch-events.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://fristund.is';

// ── Duplicated from app.js (keep in sync) ────────────────────────────

function isValidActivity(card) {
  const t = card.title;
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
  return true;
}

function parseNextData(html) {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  let idx = html.indexOf(marker);
  if (idx === -1) {
    idx = html.indexOf('__NEXT_DATA__');
    if (idx === -1) throw new Error('__NEXT_DATA__ not found');
    const scriptStart = html.lastIndexOf('<script', idx);
    const jsonStart = html.indexOf('>', scriptStart) + 1;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    const data = JSON.parse(html.slice(jsonStart, jsonEnd));
    return data.props || data;
  }
  const start = idx + marker.length;
  const end = html.indexOf('</script>', start);
  const data = JSON.parse(html.slice(start, end));
  return data.props || data;
}

// ── HTTP helpers ─────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (BetriApp)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return httpGet(redirectUrl).then(resolve, reject);
      }
      if (res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\xa0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Date helpers ─────────────────────────────────────────────────────

function getDefaultDates() {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() >= 8) year++; // September or later → next summer
  return {
    from: `${year}-06-01`,
    to: `${year}-08-31`,
  };
}

function toApiDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${parseInt(d, 10)}-${parseInt(m, 10)}-${y}`;
}

// ── Main ─────────────────────────────────────────────────────────────

async function fetchAllListings() {
  const dates = getDefaultDates();
  const from = toApiDate(dates.from);
  const to = toApiDate(dates.to);
  const year = dates.from.split('-')[0];

  const allCards = [];
  let page = 1;
  let hasNext = true;

  console.log(`Fetching event listings for summer ${year}...`);

  while (hasNext) {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', to);
    if (page > 1) params.set('page', String(page));
    const url = `${BASE_URL}/?${params.toString()}`;

    process.stdout.write(`  Page ${page}...`);
    const html = await httpGet(url);
    const data = parseNextData(html);
    const pp = data.pageProps || {};
    const cards = pp.cards || [];
    const pageInfo = pp.pageInfo || {};

    // Deduplicate by id
    for (const card of cards) {
      if (!allCards.some((c) => c.id === card.id)) {
        allCards.push(card);
      }
    }

    console.log(` ${cards.length} cards (total: ${allCards.length}/${pageInfo.itemCount || '?'})`);

    hasNext = pageInfo.hasNextPage || false;
    page++;
    if (hasNext) await sleep(500);
  }

  return allCards;
}

async function enrichEvent(card) {
  try {
    const url = `${BASE_URL}/namskeid/${card.id}`;
    const html = await httpGet(url);
    const data = parseNextData(html);
    const content = (data.pageProps || {}).content || {};

    if (typeof content === 'string') return card; // "notFound" etc.

    return {
      ...card,
      description: stripHtml(content.description || ''),
      locationName: content.location || '',
      signupUrl: content.signupUrl || '',
    };
  } catch (err) {
    console.error(`    Warning: could not enrich ${card.id}: ${err.message}`);
    return card;
  }
}

async function main() {
  const startTime = Date.now();

  // Phase 1: Fetch all listing pages
  const allCards = await fetchAllListings();
  console.log(`\nFetched ${allCards.length} total events.`);

  // Phase 2: Filter
  const valid = [];
  const hidden = [];
  for (const card of allCards) {
    if (isValidActivity(card)) {
      valid.push(card);
    } else {
      hidden.push(card);
    }
  }
  console.log(`Filtered: ${valid.length} valid, ${hidden.length} hidden.`);

  // Phase 3: Enrich each valid event with description
  console.log(`\nEnriching ${valid.length} events with descriptions...`);
  const enriched = [];
  for (let i = 0; i < valid.length; i++) {
    if ((i + 1) % 50 === 0 || i === 0) {
      process.stdout.write(`  ${i + 1}/${valid.length}...`);
    }
    const event = await enrichEvent(valid[i]);
    enriched.push(event);
    if (i < valid.length - 1) await sleep(300);
  }
  console.log(`\n  Done enriching.`);

  // Phase 4: Write output
  const output = {
    fetchedAt: new Date().toISOString(),
    summer: parseInt(getDefaultDates().from.split('-')[0], 10),
    totalFetched: allCards.length,
    validCount: enriched.length,
    hiddenCount: hidden.length,
    cards: enriched,
  };

  const outPath = path.join(__dirname, '..', 'docs', 'events.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nWrote ${enriched.length} events to ${outPath}`);
  console.log(`Total time: ${elapsed}s`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
