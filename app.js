(() => {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────

  const BASE_URL = 'https://fristund.is';
  const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];

  // ── Tag categories ────────────────────────────────────────────────

  const TAG_CATEGORIES = [
    { label: 'Sumarbúðir',     icon: '☀️', tags: ['summer_camp'] },
    { label: 'Fótbolti',       icon: '⚽', tags: ['football'] },
    { label: 'Sund',           icon: '🏊', tags: ['swimming'] },
    { label: 'Fimleikar',      icon: '🤸', tags: ['gymnastics'] },
    { label: 'Handbolti',      icon: '🤾', tags: ['handball'] },
    { label: 'Körfubolti',     icon: '🏀', tags: ['basketball'] },
    { label: 'Dans',           icon: '💃', tags: ['Dans', 'dance'] },
    { label: 'Myndlist',       icon: '🎨', tags: ['Myndlist', 'arts'] },
    { label: 'Tónlist',        icon: '🎵', tags: ['Tónlist', 'music'] },
    { label: 'Leiklist',       icon: '🎭', tags: ['Sviðslist', 'drama'] },
    { label: 'Hestar',         icon: '🐴', tags: ['equestrian'] },
    { label: 'Tennis',         icon: '🎾', tags: ['tennis'] },
    { label: 'Bardaíþróttir',  icon: '🥋', tags: ['judo', 'karate', 'taekwondo', 'aikido', 'jiu_jitsu', 'wrestling', 'boxing', 'mma', 'wushu', 'fencing', 'self_defense'] },
    { label: 'Klifur',         icon: '🧗', tags: ['climbing'] },
    { label: 'Skátar',         icon: '🏕️', tags: ['scouts'] },
    { label: 'Frjálsar',       icon: '🏃', tags: ['athletics', 'running'] },
    { label: 'Skák',           icon: '♟️', tags: ['chess'] },
    { label: 'Hjól',           icon: '🚴', tags: ['cycling'] },
    { label: 'Jóga',           icon: '🧘', tags: ['yoga', 'pilates'] },
    { label: 'Skautar',        icon: '⛸️', tags: ['ice_skating', 'figure_skating', 'ice_hockey'] },
    { label: 'Boltar',         icon: '🏐', tags: ['volleyball', 'badminton', 'table_tennis'] },
    { label: 'Sirkus',         icon: '🎪', tags: ['circus'] },
    { label: 'Námskeið',       icon: '📚', tags: ['education', 'Fræðsla', 'language_courses', 'computer_courses'] },
  ];

  // ── Tag display names ─────────────────────────────────────────────

  const TAG_LABELS = {
    football: 'Fótbolti', basketball: 'Körfubolti', handball: 'Handbolti',
    swimming: 'Sund', gymnastics: 'Fimleikar', athletics: 'Frjálsíþróttir',
    running: 'Hlaup', tennis: 'Tennis', badminton: 'Badminton',
    volleyball: 'Blak', table_tennis: 'Borðtennis', ice_hockey: 'Íshokkí',
    ice_skating: 'Skautaíþróttir', figure_skating: 'Listhlaupaíþróttir',
    alpine_skiing: 'Skíðaíþróttir', ski: 'Skíði', rugby: 'Rugby',
    american_football: 'Amerískur fótbolti', flag_football: 'Flagfótbolti',
    triathlon: 'Þríþraut', cycling: 'Hjólreiðar', water_polo: 'Vatnsbolti',
    frisbee_golf: 'Frisbeegolf', boccia: 'Boccia', bowling: 'Keilan',
    sailing: 'Sigling', equestrian: 'Hestaíþróttir', climbing: 'Klifur',
    public_sports: 'Almenningsíþróttir', judo: 'Júdó', karate: 'Karate',
    taekwondo: 'Taekwondo', aikido: 'Aikido', jiu_jitsu: 'Jiu-jitsu',
    wrestling: 'Glíma', boxing: 'Box', mma: 'MMA', wushu: 'Wushu',
    fencing: 'Skylmingar', self_defense: 'Sjálfsvörn', archery: 'Bogfimi',
    Myndlist: 'Myndlist', Dans: 'Dans', dance: 'Dans',
    Tónlist: 'Tónlist', music: 'Tónlist', Sviðslist: 'Sviðslistir',
    drama: 'Leiklist', arts: 'Listir', Hönnun: 'Hönnun',
    Bókmenntir: 'Bókmenntir', circus: 'Sirkus', yoga: 'Jóga',
    pilates: 'Pilates', gym: 'Líkamsrækt', health: 'Heilsa',
    crossfit: 'CrossFit', parkour: 'Parkour', education: 'Menntun',
    Fræðsla: 'Fræðsla', language_courses: 'Tungumálanámskeið',
    computer_courses: 'Tölvunámskeið', summer_camp: 'Sumarbúðir',
    youth_activity: 'Æskulýðsstarf', leisure_: 'Tómstundir',
    scouts: 'Skátar', travel: 'Ferðalög', other: 'Annað',
    chess: 'Skák', Fjölmenning: 'Fjölmenning', Tungumál: 'Tungumál',
    Börn: 'Börn', Ungmenni: 'Ungmenni', Smiðja: 'Smiðja',
    Náttúra: 'Náttúra', roller_derby: 'Hjólabretti',
    ice_scatting: 'Skautahlaup', disabled: 'Fatlaðir',
    esports: 'Esport', social_work: 'Félagsstarf',
    fundraising: 'Fjáröflun', Saga: 'Saga', motorsport: 'Motorsport',
    gliding: 'Svifflug', weightlifting: 'Lyftingar',
    powerlifting: 'Styrktarlyftingar', self_empowerment: 'Sjálfstyrkur',
  };

  // ── Postal codes ──────────────────────────────────────────────────

  const POSTAL_NAMES = {
    '101': 'Miðborg', '104': 'Laugardalur', '107': 'Vesturbær',
    '108': 'Háaleiti', '109': 'Breiðholt', '110': 'Árbær',
    '111': 'Breiðholt', '112': 'Grafarvogur', '113': 'Grafarholt',
    '116': 'Kjalarnes', '121': 'Mosfellsbær', '125': 'Álftanes',
    '128': 'Seltjarnarnes', '130': 'Garðabær',
    '201': 'Kópavogur', '220': 'Hafnarfjörður',
  };

  const POSTAL_CODES = Object.keys(POSTAL_NAMES);

  // ── Tag → icon lookup ─────────────────────────────────────────────

  const TAG_ICONS = {};
  TAG_CATEGORIES.forEach((cat) => {
    cat.tags.forEach((t) => { TAG_ICONS[t] = cat.icon; });
  });

  // ── Smart exclusion rules ─────────────────────────────────────────

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

  // ── State ─────────────────────────────────────────────────────────

  const state = {
    age: '',
    from: '',
    to: '',
    tags: '',
    postCode: '',
    sortBy: '',
    page: 1,
    cards: [],
    pageInfo: null,
    loading: false,
    error: null,
    hasSearched: false,
  };

  // ── DOM refs ──────────────────────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const welcomeEl = $('#welcome');
  const filtersEl = $('#filters');
  const ageWelcome = $('#age-welcome');
  const ageSelect = $('#age-select');
  const dateFrom = $('#date-from');
  const dateTo = $('#date-to');
  const locationSelect = $('#location-select');
  const sortSelect = $('#sort-select');
  const tagChipsEl = $('#tag-chips');
  const searchBtn = $('#search-btn');
  const clearBtn = $('#clear-btn');
  const resultsGrid = $('#results-grid');
  const resultsInfo = $('#results-info');
  const loadMoreWrap = $('#load-more-wrap');
  const loadMoreBtn = $('#load-more-btn');
  const loadingState = $('#loading-state');
  const emptyState = $('#empty-state');
  const errorState = $('#error-state');
  const errorMessage = $('#error-message');
  const retryBtn = $('#retry-btn');

  // ── Helpers ────────────────────────────────────────────────────────

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

  function getTagLabel(tag) {
    return TAG_LABELS[tag] || tag;
  }

  function getCardIcon(tags) {
    for (const t of tags) {
      if (TAG_ICONS[t]) return TAG_ICONS[t];
    }
    return '🌟';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getDefaultDates() {
    const now = new Date();
    let year = now.getFullYear();
    if (now.getMonth() > 7) year++;
    return { from: `${year}-06-01`, to: `${year}-08-31` };
  }

  // ── API ────────────────────────────────────────────────────────────

  function buildUrl() {
    const params = new URLSearchParams();
    if (state.age) params.set('age', state.age);
    if (state.from) params.set('from', toApiDate(state.from));
    if (state.to) params.set('to', toApiDate(state.to));
    if (state.tags) params.set('tags', state.tags);
    if (state.postCode) params.set('postCodes', state.postCode);
    if (state.sortBy) params.set('sortBy', state.sortBy);
    if (state.page > 1) params.set('page', String(state.page));
    return `${BASE_URL}/?${params.toString()}`;
  }

  function parseNextData(html) {
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    let start = html.indexOf(marker);
    if (start !== -1) {
      const jsonStart = start + marker.length;
      const jsonEnd = html.indexOf('</script>', jsonStart);
      return JSON.parse(html.substring(jsonStart, jsonEnd));
    }
    // Fallback: look for any script with __NEXT_DATA__
    const alt = '__NEXT_DATA__';
    const altIdx = html.indexOf(alt);
    if (altIdx === -1) throw new Error('Gat ekki lesið gögn');
    const scriptStart = html.lastIndexOf('<script', altIdx);
    const scriptEnd = html.indexOf('</script>', altIdx);
    if (scriptStart === -1 || scriptEnd === -1) throw new Error('Gat ekki lesið gögn');
    const tagEnd = html.indexOf('>', scriptStart) + 1;
    return JSON.parse(html.substring(tagEnd, scriptEnd));
  }

  async function fetchPage() {
    const url = buildUrl();

    // Try direct fetch
    try {
      const res = await fetch(url);
      if (res.ok) {
        return parseNextData(await res.text()).pageProps;
      }
    } catch (_) { /* CORS blocked */ }

    // Try proxies
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = CORS_PROXIES[i](url);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return parseNextData(await res.text()).pageProps;
      } catch (err) {
        if (i === CORS_PROXIES.length - 1) throw err;
      }
    }

    throw new Error('Ekki tókst að ná sambandi við frístund.is');
  }

  // ── UI: Populate dropdowns ────────────────────────────────────────

  function populateAgeOptions(selectEl) {
    for (let i = 1; i <= 17; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i} ára`;
      selectEl.appendChild(opt);
    }
  }

  function populateLocationSelect() {
    POSTAL_CODES.forEach((code) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = getLocationName(code);
      locationSelect.appendChild(opt);
    });
  }

  // ── UI: Tag chips ─────────────────────────────────────────────────

  function renderTagChips() {
    tagChipsEl.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'tag-chip';
    allChip.setAttribute('aria-pressed', state.tags === '' ? 'true' : 'false');
    allChip.textContent = 'Allar tegundir';
    allChip.addEventListener('click', () => { state.tags = ''; updateTagChips(); });
    tagChipsEl.appendChild(allChip);

    TAG_CATEGORIES.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip';
      const apiTags = cat.tags.join(',');
      chip.dataset.tags = apiTags;
      chip.setAttribute('aria-pressed', state.tags === apiTags ? 'true' : 'false');
      chip.innerHTML = `<span class="chip-icon">${cat.icon}</span>${cat.label}`;
      chip.addEventListener('click', () => { state.tags = apiTags; updateTagChips(); });
      tagChipsEl.appendChild(chip);
    });
  }

  function updateTagChips() {
    tagChipsEl.querySelectorAll('.tag-chip').forEach((chip) => {
      const tags = chip.dataset.tags;
      const isActive = tags === undefined ? state.tags === '' : state.tags === tags;
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // ── UI: Activity cards ────────────────────────────────────────────

  function renderCard(card) {
    const icon = getCardIcon(card.tags);
    const hasImage = card.imageUrl && card.imageUrl !== 'null' && card.imageUrl !== '';
    const detailUrl = `${BASE_URL}/namskeid/${card.id}`;
    const locationStr = card.location ? getLocationShort(card.location) : '';
    const dateStr = card.date
      ? card.date.start === card.date.end
        ? formatDate(card.date.start)
        : `${formatDate(card.date.start)} – ${formatDate(card.date.end)}`
      : '';
    const clubStr = card.clubname || '';

    const el = document.createElement('article');
    el.className = 'card';

    let imgHtml;
    if (hasImage) {
      let imgSrc;
      if (card.imageUrl.startsWith('http')) {
        imgSrc = card.imageUrl;
      } else if (card.channelId === 'hvirfill-indexer') {
        imgSrc = `https://hvirfill.reykjavik.is${card.imageUrl}`;
      } else {
        imgSrc = `${BASE_URL}${card.imageUrl}`;
      }
      imgHtml = `<img class="card-img" src="${imgSrc}" alt="" loading="lazy"
                   onerror="this.outerHTML='<div class=\\'card-placeholder\\'>${icon}</div>'">`;
    } else {
      imgHtml = `<div class="card-placeholder">${icon}</div>`;
    }

    const tagBadges = card.tags
      .slice(0, 3)
      .map((t) => `<span class="card-tag">${escapeHtml(getTagLabel(t))}</span>`)
      .join('');

    el.innerHTML = `
      ${imgHtml}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(card.title)}</h3>
        ${clubStr ? `<div class="card-club">
          <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${escapeHtml(clubStr)}
        </div>` : ''}
        <div class="card-tags">${tagBadges}</div>
        <div class="card-meta">
          ${dateStr ? `<span class="card-meta-item">
            <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${dateStr}
          </span>` : ''}
          ${locationStr ? `<span class="card-meta-item">
            <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${locationStr}
          </span>` : ''}
        </div>
        <a class="card-link" href="${detailUrl}" target="_blank" rel="noopener">
          Skoða nánar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    `;

    return el;
  }

  function renderResults(cards, append) {
    if (!append) resultsGrid.innerHTML = '';
    cards.forEach((card) => resultsGrid.appendChild(renderCard(card)));
  }

  function updateResultsInfo() {
    if (!state.pageInfo || state.cards.length === 0) {
      resultsInfo.hidden = true;
      return;
    }
    resultsInfo.hidden = false;
    const total = state.pageInfo.itemCount;
    const shown = state.cards.length;
    resultsInfo.innerHTML = `<strong>${shown}</strong> af <strong>${total}</strong> niðurstöðum`;
  }

  function updateLoadMore() {
    const hasMore = state.pageInfo && state.pageInfo.hasNextPage;
    loadMoreWrap.hidden = !hasMore;
    loadMoreBtn.disabled = state.loading;
    loadMoreBtn.innerHTML = state.loading
      ? '<span class="spinner"></span> Hleð...'
      : 'Sýna meira';
  }

  function showState(which) {
    loadingState.hidden = which !== 'loading';
    emptyState.hidden = which !== 'empty';
    errorState.hidden = which !== 'error';
    if (which === 'results' || which === 'loading') {
      resultsGrid.hidden = which === 'loading' && state.cards.length === 0;
    } else if (which === 'empty' || which === 'error') {
      resultsGrid.hidden = true;
      resultsInfo.hidden = true;
      loadMoreWrap.hidden = true;
    }
  }

  // ── Transition: welcome → filters ─────────────────────────────────

  function showFiltersView() {
    welcomeEl.hidden = true;
    filtersEl.hidden = false;
    state.hasSearched = true;
  }

  // ── Actions ────────────────────────────────────────────────────────

  function readFilters() {
    state.age = ageSelect.value;
    state.from = dateFrom.value;
    state.to = dateTo.value;
    state.postCode = locationSelect.value;
    state.sortBy = sortSelect.value;
  }

  async function search(append) {
    readFilters();

    if (!append) {
      state.page = 1;
      state.cards = [];
    }

    state.loading = true;
    state.error = null;

    if (!append) showState('loading');
    updateLoadMore();

    try {
      const data = await fetchPage();
      const filtered = (data.cards || []).filter(isValidActivity);

      state.cards = append ? state.cards.concat(filtered) : filtered;
      state.pageInfo = data.pageInfo || null;
      state.loading = false;

      if (state.cards.length === 0 && !state.pageInfo?.hasNextPage) {
        showState('empty');
      } else {
        showState('results');
        renderResults(filtered, append);
        updateResultsInfo();
        updateLoadMore();
      }
    } catch (err) {
      state.loading = false;
      state.error = err.message;
      if (state.cards.length > 0) {
        showState('results');
        updateLoadMore();
      } else {
        errorMessage.textContent = err.message || 'Ekki tókst að ná sambandi. Reyndu aftur.';
        showState('error');
      }
    }
  }

  async function loadMore() {
    if (state.loading || !state.pageInfo?.hasNextPage) return;
    state.page++;
    await search(true);
  }

  function clearFilters() {
    const defaults = getDefaultDates();
    dateFrom.value = defaults.from;
    dateTo.value = defaults.to;
    locationSelect.value = '';
    sortSelect.value = '';
    ageSelect.value = '';
    state.tags = '';
    state.sortBy = '';
    state.page = 1;
    state.cards = [];
    state.pageInfo = null;
    state.hasSearched = false;
    updateTagChips();
    resultsGrid.innerHTML = '';
    resultsInfo.hidden = true;
    loadMoreWrap.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = true;
    loadingState.hidden = true;
    resultsGrid.hidden = false;
    // Go back to welcome
    filtersEl.hidden = true;
    welcomeEl.hidden = false;
    ageWelcome.value = '';
  }

  // ── Event binding ─────────────────────────────────────────────────

  function bindEvents() {
    // Welcome screen: auto-search when age is selected
    ageWelcome.addEventListener('change', () => {
      const age = ageWelcome.value;
      if (!age) return;
      state.age = age;
      ageSelect.value = age;
      showFiltersView();
      search(false);
    });

    // Filters: manual search
    searchBtn.addEventListener('click', () => search(false));
    clearBtn.addEventListener('click', clearFilters);
    loadMoreBtn.addEventListener('click', loadMore);
    retryBtn.addEventListener('click', () => search(false));

    // Age change in filters also triggers search
    ageSelect.addEventListener('change', () => search(false));

    // Enter key on inputs triggers search
    [dateFrom, dateTo, locationSelect, sortSelect].forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') search(false);
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────

  function init() {
    populateAgeOptions(ageWelcome);
    populateAgeOptions(ageSelect);
    populateLocationSelect();

    const defaults = getDefaultDates();
    dateFrom.value = defaults.from;
    dateTo.value = defaults.to;

    renderTagChips();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
