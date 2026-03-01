(() => {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────

  const BASE_URL = 'https://fristund.is';
  const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];

  // ── Tag categories (grouped for user-friendly display) ─────────────

  const TAG_CATEGORIES = [
    {
      label: 'Sumarbúðir',
      icon: '☀️',
      tags: ['summer_camp'],
    },
    {
      label: 'Fótbolti',
      icon: '⚽',
      tags: ['football'],
    },
    {
      label: 'Sund',
      icon: '🏊',
      tags: ['swimming'],
    },
    {
      label: 'Fimleikar',
      icon: '🤸',
      tags: ['gymnastics'],
    },
    {
      label: 'Handbolti',
      icon: '🤾',
      tags: ['handball'],
    },
    {
      label: 'Körfubolti',
      icon: '🏀',
      tags: ['basketball'],
    },
    {
      label: 'Dans',
      icon: '💃',
      tags: ['Dans', 'dance'],
    },
    {
      label: 'Myndlist',
      icon: '🎨',
      tags: ['Myndlist', 'arts'],
    },
    {
      label: 'Tónlist',
      icon: '🎵',
      tags: ['Tónlist', 'music'],
    },
    {
      label: 'Leiklistir',
      icon: '🎭',
      tags: ['Sviðslist', 'drama'],
    },
    {
      label: 'Hestaíþróttir',
      icon: '🐴',
      tags: ['equestrian'],
    },
    {
      label: 'Tennis',
      icon: '🎾',
      tags: ['tennis'],
    },
    {
      label: 'Bardaíþróttir',
      icon: '🥋',
      tags: ['judo', 'karate', 'taekwondo', 'aikido', 'jiu_jitsu', 'wrestling', 'boxing', 'mma', 'wushu', 'fencing', 'self_defense'],
    },
    {
      label: 'Klifur',
      icon: '🧗',
      tags: ['climbing'],
    },
    {
      label: 'Skátar',
      icon: '🏕️',
      tags: ['scouts'],
    },
    {
      label: 'Frjálsíþróttir',
      icon: '🏃',
      tags: ['athletics', 'running'],
    },
    {
      label: 'Skák',
      icon: '♟️',
      tags: ['chess'],
    },
    {
      label: 'Hjólreiðar',
      icon: '🚴',
      tags: ['cycling'],
    },
    {
      label: 'Jóga',
      icon: '🧘',
      tags: ['yoga', 'pilates'],
    },
    {
      label: 'Skautaíþróttir',
      icon: '⛸️',
      tags: ['ice_skating', 'figure_skating', 'ice_hockey'],
    },
    {
      label: 'Blak',
      icon: '🏐',
      tags: ['volleyball', 'badminton', 'table_tennis'],
    },
    {
      label: 'Sirkus',
      icon: '🎪',
      tags: ['circus'],
    },
    {
      label: 'Námskeið',
      icon: '📚',
      tags: ['education', 'Fræðsla', 'language_courses', 'computer_courses'],
    },
  ];

  // ── Tag display names (Icelandic) ─────────────────────────────────

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

  // ── Postal code → neighborhood names ──────────────────────────────

  const POSTAL_NAMES = {
    '101': 'Miðborg', '102': 'Hlíðar', '103': 'Hlíðar',
    '104': 'Laugardalur', '105': 'Hlíðar', '107': 'Vesturbær',
    '108': 'Háaleiti', '109': 'Breiðholt', '110': 'Árbær',
    '111': 'Breiðholt', '112': 'Grafarvogur', '113': 'Grafarholt',
    '116': 'Kjalarnes', '121': 'Mosfellsbær', '125': 'Álftanes',
    '128': 'Seltjarnarnes', '130': 'Garðabær',
    '200': 'Kópavogur', '201': 'Kópavogur', '203': 'Kópavogur',
    '210': 'Garðabær', '220': 'Hafnarfjörður',
  };

  // Deduplicated postal codes for the location dropdown
  const POSTAL_CODES = [
    '101', '104', '107', '108', '109', '110', '111', '112', '113',
    '116', '121', '125', '128', '130', '201', '220',
  ];

  // Category icon for cards (maps first tag to an emoji)
  const TAG_ICONS = {};
  TAG_CATEGORIES.forEach((cat) => {
    cat.tags.forEach((t) => { TAG_ICONS[t] = cat.icon; });
  });

  // ── Smart exclusion rules ─────────────────────────────────────────
  // These patterns identify items that are NOT actual activities
  // (equipment sales, admin fees, gift cards, etc.)

  function isValidActivity(card) {
    const t = card.title;

    // Equipment / clothing
    if (/keikogi|æfingagalli/i.test(t)) return false;

    // Gift cards
    if (/gjafakort|gift\s*card/i.test(t)) return false;

    // Standalone admin fees (not tied to a specific activity)
    if (/^áfrýjunargjald$/i.test(t)) return false;

    // Generic fee/charge items with tag=other and no real activity context
    if (card.tags.length === 1 && card.tags[0] === 'other') {
      if (/\bgjald\b|\bgjöld\b/i.test(t) && !/æfing|þjálfun|námskeið|leikskóli/i.test(t)) {
        return false;
      }
    }

    // World Class gift card / membership products
    if (/world\s*class/i.test(t) && /gjafakort|gift/i.test(t)) return false;

    // Generic "greiðsla" (payment) or "kvittun" (receipt) items
    if (/^greiðsla\b|^kvittun\b/i.test(t)) return false;

    return true;
  }

  // ── Application State ─────────────────────────────────────────────

  const state = {
    age: '',
    from: '',
    to: '',
    tag: '',          // selected API tag (single value for API query)
    postCode: '',
    page: 1,
    cards: [],
    pageInfo: null,
    loading: false,
    error: null,
    proxyIndex: 0,    // current CORS proxy
  };

  // ── DOM References ────────────────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const ageSelect = $('#age-select');
  const dateFrom = $('#date-from');
  const dateTo = $('#date-to');
  const locationSelect = $('#location-select');
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

  // Convert yyyy-mm-dd → d-m-yyyy (API format)
  function toApiDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${parseInt(d, 10)}-${parseInt(m, 10)}-${y}`;
  }

  // Format d-m-yyyy → readable Icelandic date
  function formatDate(apiDate) {
    if (!apiDate) return '';
    const parts = apiDate.split('-');
    if (parts.length !== 3) return apiDate;
    const [d, m, y] = parts;
    const months = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún',
                     'júl', 'ágú', 'sep', 'okt', 'nóv', 'des'];
    return `${parseInt(d, 10)}. ${months[parseInt(m, 10) - 1]} ${y}`;
  }

  function getLocationName(code) {
    const trimmed = code.trim();
    return POSTAL_NAMES[trimmed]
      ? `${trimmed} ${POSTAL_NAMES[trimmed]}`
      : trimmed;
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

  // ── Default dates (upcoming summer) ────────────────────────────────

  function getDefaultDates() {
    const now = new Date();
    let year = now.getFullYear();
    // If past August, default to next year's summer
    if (now.getMonth() > 7) year++;
    return {
      from: `${year}-06-01`,
      to: `${year}-08-31`,
    };
  }

  // ── API Layer ──────────────────────────────────────────────────────

  function buildUrl() {
    const params = new URLSearchParams();
    if (state.age) params.set('age', state.age);
    if (state.from) params.set('from', toApiDate(state.from));
    if (state.to) params.set('to', toApiDate(state.to));
    if (state.tag) params.set('tags', state.tag);
    if (state.postCode) params.set('postCodes', state.postCode);
    if (state.page > 1) params.set('page', String(state.page));
    return `${BASE_URL}/?${params.toString()}`;
  }

  function parseNextData(html) {
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const start = html.indexOf(marker);
    if (start === -1) {
      // Try alternative format
      const alt = '__NEXT_DATA__';
      const altIdx = html.indexOf(alt);
      if (altIdx === -1) throw new Error('Gat ekki lesið gögn af frístund.is');
      // Try to extract JSON from script tag
      const scriptStart = html.lastIndexOf('<script', altIdx);
      const scriptEnd = html.indexOf('</script>', altIdx);
      if (scriptStart === -1 || scriptEnd === -1) throw new Error('Gat ekki lesið gögn');
      const tagEnd = html.indexOf('>', scriptStart) + 1;
      const json = html.substring(tagEnd, scriptEnd);
      return JSON.parse(json);
    }
    const jsonStart = start + marker.length;
    const jsonEnd = html.indexOf('</script>', jsonStart);
    const json = html.substring(jsonStart, jsonEnd);
    return JSON.parse(json);
  }

  async function fetchWithProxy(url, proxyIndex) {
    const proxyFn = CORS_PROXIES[proxyIndex];
    if (!proxyFn) throw new Error('Allir proxy-þjónar mistókust');
    const proxyUrl = proxyFn(url);
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  async function fetchPage() {
    const url = buildUrl();

    // Try direct fetch first (in case CORS is allowed)
    try {
      const res = await fetch(url);
      if (res.ok) {
        const html = await res.text();
        const data = parseNextData(html);
        state.proxyIndex = -1; // direct works
        return data.pageProps;
      }
    } catch (_) {
      // CORS blocked, expected
    }

    // Try proxies
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const html = await fetchWithProxy(url, i);
        const data = parseNextData(html);
        state.proxyIndex = i; // remember working proxy
        return data.pageProps;
      } catch (err) {
        if (i === CORS_PROXIES.length - 1) throw err;
      }
    }

    throw new Error('Ekki tókst að sækja gögn');
  }

  // ── UI Rendering ──────────────────────────────────────────────────

  function populateAgeSelect() {
    for (let i = 0; i <= 18; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = i === 0 ? 'Yngri en 1 árs' : `${i} ára`;
      ageSelect.appendChild(opt);
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

  function renderTagChips() {
    tagChipsEl.innerHTML = '';

    // "All" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'tag-chip';
    allChip.setAttribute('aria-pressed', state.tag === '' ? 'true' : 'false');
    allChip.dataset.tag = '';
    allChip.textContent = 'Allt';
    allChip.addEventListener('click', () => selectTag(''));
    tagChipsEl.appendChild(allChip);

    TAG_CATEGORIES.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip';
      // For categories with multiple tags, use the first tag for the API query
      const apiTag = cat.tags[0];
      chip.dataset.tag = apiTag;
      chip.dataset.allTags = JSON.stringify(cat.tags);
      chip.setAttribute('aria-pressed', cat.tags.includes(state.tag) ? 'true' : 'false');
      chip.innerHTML = `<span class="chip-icon">${cat.icon}</span>${cat.label}`;
      chip.addEventListener('click', () => selectTag(apiTag));
      tagChipsEl.appendChild(chip);
    });
  }

  function updateTagChips() {
    tagChipsEl.querySelectorAll('.tag-chip').forEach((chip) => {
      const tag = chip.dataset.tag;
      const allTags = chip.dataset.allTags ? JSON.parse(chip.dataset.allTags) : [tag];
      const isActive = tag === '' ? state.tag === '' : allTags.includes(state.tag);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function renderCard(card) {
    const icon = getCardIcon(card.tags);
    const hasImage = card.imageUrl && card.imageUrl !== 'null';
    const detailUrl = `${BASE_URL}/namskeid/${card.id}`;
    const locationStr = card.location ? getLocationName(card.location) : '';
    const dateStr = card.date
      ? card.date.start === card.date.end
        ? formatDate(card.date.start)
        : `${formatDate(card.date.start)} – ${formatDate(card.date.end)}`
      : '';
    const clubStr = card.clubname || '';

    const el = document.createElement('article');
    el.className = 'card';

    // Resolve image URL — try fristund.is as base
    let imgHtml = '';
    if (hasImage) {
      const imgSrc = card.imageUrl.startsWith('http')
        ? card.imageUrl
        : `${BASE_URL}${card.imageUrl}`;
      imgHtml = `<img class="card-img" src="${imgSrc}" alt="" loading="lazy"
                   onerror="this.outerHTML='<div class=\\'card-placeholder\\'>${icon}</div>'">`;
    } else {
      imgHtml = `<div class="card-placeholder">${icon}</div>`;
    }

    const tagBadges = card.tags
      .slice(0, 3)
      .map((t) => `<span class="card-tag">${getTagLabel(t)}</span>`)
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
          Skoða á frístund.is
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    `;

    return el;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderResults(cards, append) {
    if (!append) {
      resultsGrid.innerHTML = '';
    }
    cards.forEach((card) => {
      resultsGrid.appendChild(renderCard(card));
    });
  }

  function updateResultsInfo() {
    if (!state.pageInfo || state.cards.length === 0) {
      resultsInfo.hidden = true;
      return;
    }
    resultsInfo.hidden = false;
    const total = state.pageInfo.itemCount;
    const shown = state.cards.length;
    resultsInfo.innerHTML = `Sýni <strong>${shown}</strong> af <strong>${total}</strong> niðurstöðum`;
  }

  function updateLoadMore() {
    const hasMore = state.pageInfo && state.pageInfo.hasNextPage;
    loadMoreWrap.hidden = !hasMore;
    loadMoreBtn.disabled = state.loading;
    loadMoreBtn.innerHTML = state.loading
      ? '<span class="spinner"></span> Hleð...'
      : 'Hlaða fleiri';
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

  // ── Actions ────────────────────────────────────────────────────────

  function selectTag(tag) {
    state.tag = tag;
    updateTagChips();
  }

  function readFilters() {
    state.age = ageSelect.value;
    state.from = dateFrom.value;
    state.to = dateTo.value;
    state.postCode = locationSelect.value;
    // tag is already set via chip selection
  }

  async function search(append) {
    readFilters();

    if (!append) {
      state.page = 1;
      state.cards = [];
    }

    state.loading = true;
    state.error = null;

    if (!append) {
      showState('loading');
    }
    updateLoadMore();

    try {
      const data = await fetchPage();
      const rawCards = data.cards || [];

      // Apply smart exclusion filter
      const filtered = rawCards.filter(isValidActivity);

      if (append) {
        state.cards = state.cards.concat(filtered);
      } else {
        state.cards = filtered;
      }

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
        // Show error inline but keep existing results
        showState('results');
        updateLoadMore();
      } else {
        errorMessage.textContent = err.message || 'Ekki tókst að sækja gögn. Reyndu aftur.';
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
    ageSelect.value = '';
    dateFrom.value = defaults.from;
    dateTo.value = defaults.to;
    locationSelect.value = '';
    state.tag = '';
    state.page = 1;
    state.cards = [];
    state.pageInfo = null;
    updateTagChips();
    resultsGrid.innerHTML = '';
    resultsInfo.hidden = true;
    loadMoreWrap.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = true;
    loadingState.hidden = true;
    resultsGrid.hidden = false;
  }

  // ── Event Binding ─────────────────────────────────────────────────

  function bindEvents() {
    searchBtn.addEventListener('click', () => search(false));
    clearBtn.addEventListener('click', clearFilters);
    loadMoreBtn.addEventListener('click', loadMore);
    retryBtn.addEventListener('click', () => search(false));

    // Allow Enter key to trigger search from inputs
    [ageSelect, dateFrom, dateTo, locationSelect].forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') search(false);
      });
    });
  }

  // ── Initialization ────────────────────────────────────────────────

  function init() {
    // Populate age options
    populateAgeSelect();

    // Set default dates
    const defaults = getDefaultDates();
    dateFrom.value = defaults.from;
    dateTo.value = defaults.to;

    // Populate location
    populateLocationSelect();

    // Render tag chips
    renderTagChips();

    // Bind events
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
