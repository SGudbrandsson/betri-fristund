(() => {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────

  const BASE_URL = 'https://fristund.is';
  const EVENTS_JSON = 'events.json';
  const EVENTS_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours
  const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];
  const FETCH_TIMEOUT = 10000;
  const REPORT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeshJQHZiYrxGiukL5lUg3zPLiEsN3L7I0Uk80ZerLpckSQCQ/viewform';
  const REPORT_FORM_ENTRY_TITLE = 'entry.1768411491';
  const REPORT_FORM_ENTRY_URL = 'entry.329999277';
  let lastWorkingProxy = -1;
  let cachedEventsJson = null;

  // ── Tag categories ────────────────────────────────────────────────

  const TAG_CATEGORIES = [
    { label: 'Sumarbúðir',     labelEn: 'Summer camps',   icon: '☀️', tags: ['summer_camp'] },
    { label: 'Fótbolti',       labelEn: 'Football',       icon: '⚽', tags: ['football'] },
    { label: 'Sund',           labelEn: 'Swimming',       icon: '🏊', tags: ['swimming'] },
    { label: 'Fimleikar',      labelEn: 'Gymnastics',     icon: '🤸', tags: ['gymnastics'] },
    { label: 'Handbolti',      labelEn: 'Handball',       icon: '🤾', tags: ['handball'] },
    { label: 'Körfubolti',     labelEn: 'Basketball',     icon: '🏀', tags: ['basketball'] },
    { label: 'Dans',           labelEn: 'Dance',          icon: '💃', tags: ['Dans', 'dance'] },
    { label: 'Myndlist',       labelEn: 'Visual arts',    icon: '🎨', tags: ['Myndlist', 'arts'] },
    { label: 'Tónlist',        labelEn: 'Music',          icon: '🎵', tags: ['Tónlist', 'music'] },
    { label: 'Leiklist',       labelEn: 'Drama',          icon: '🎭', tags: ['Sviðslist', 'drama'] },
    { label: 'Hestar',         labelEn: 'Horse riding',   icon: '🐴', tags: ['equestrian'] },
    { label: 'Tennis',         labelEn: 'Tennis',         icon: '🎾', tags: ['tennis'] },
    { label: 'Bardaíþróttir',  labelEn: 'Martial arts',   icon: '🥋', tags: ['judo', 'karate', 'taekwondo', 'aikido', 'jiu_jitsu', 'wrestling', 'boxing', 'mma', 'wushu', 'fencing', 'self_defense'] },
    { label: 'Klifur',         labelEn: 'Climbing',       icon: '🧗', tags: ['climbing'] },
    { label: 'Skátar',         labelEn: 'Scouts',         icon: '🏕️', tags: ['scouts'] },
    { label: 'Frjálsar',       labelEn: 'Athletics',      icon: '🏃', tags: ['athletics', 'running'] },
    { label: 'Skák',           labelEn: 'Chess',          icon: '♟️', tags: ['chess'] },
    { label: 'Hjól',           labelEn: 'Cycling',        icon: '🚴', tags: ['cycling'] },
    { label: 'Jóga',           labelEn: 'Yoga',           icon: '🧘', tags: ['yoga', 'pilates'] },
    { label: 'Skautar',        labelEn: 'Ice skating',    icon: '⛸️', tags: ['ice_skating', 'figure_skating', 'ice_hockey'] },
    { label: 'Boltar',         labelEn: 'Ball sports',    icon: '🏐', tags: ['volleyball', 'badminton', 'table_tennis'] },
    { label: 'Sirkus',         labelEn: 'Circus',         icon: '🎪', tags: ['circus'] },
    { label: 'Námskeið',       labelEn: 'Courses',        icon: '📚', tags: ['education', 'Fræðsla', 'language_courses', 'computer_courses'] },
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

  // ── Translations ──────────────────────────────────────────────────

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
      shareBtn: 'Deila',
      shareCopied: 'Afritað!',
      shareText: 'Skoðaðu sumarstarfsemi fyrir börn á höfuðborgarsvæðinu 🌞',
      shareEmailSubject: 'Sumarstarfsemi fyrir börn – Betri Frístund',
      shareEmail: 'Tölvupóstur',
      shareCopyLink: 'Afrita tengil',
      loadMore: 'Sýna meira',
      loadingMore: 'Hleð...',
      emptyTitle: 'Við fundum því miður engin námskeið',
      emptyText: 'Prófaðu að breyta aldrinum, víkka út dagsetningarnar eða fækka leitarskilyrðum til að sjá fleiri spennandi valkosti fyrir sumarið.',
      errorTitle: 'Úps, eitthvað fór úrskeiðis',
      errorText: 'Okkur tókst því miður ekki að ná sambandi við frístund.is. Endilega reyndu aftur eftir smá stund.',
      retryBtn: 'Reyna aftur',
      loadingText: 'Leita að námskeiðum, íþróttum, listum...',
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
      aboutText: 'Frístund.is inniheldur félagsgjöld, gjafabréf, búnað og annað sem er ekki starfsemi fyrir börn. Þessi síða sýnir eingöngu raunverulega frístund — sumarbúðir, íþróttir, listir og námskeið — svo þú finnir það sem skiptir máli, hraðar.',
      allAges: 'Allir aldrar',
      searchPlaceholder: 'Leita...',
      searchLabel: 'Leit',
      showMore: 'Lesa meira',
      showLess: 'Minna',
      footerCTO: 'Tækniráðgjöf og tæknistjórnun',
      reportEvent: 'Ekki fyrir börn?',
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
      shareBtn: 'Share',
      shareCopied: 'Copied!',
      shareText: 'Check out summer activities for kids in Reykjavík 🌞',
      shareEmailSubject: 'Summer activities for kids – Betri Frístund',
      shareEmail: 'Email',
      shareCopyLink: 'Copy link',
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
      reportEvent: 'Not for kids?',
    },
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
    const desc = card.description || '';
    // "Get Together" spam duplicates from hvirfill-indexer
    if (/^Get Together/i.test(t)) return false;
    // Membership fees
    if (/félagsgjald/i.test(t)) return false;
    // Gift certificates and gift cards
    if (/gjafabréf|gjafakort|gift\s*card/i.test(t)) return false;
    // Merchandise and clothing
    if (/keikogi|æfingagalli|fatnaður/i.test(t)) return false;
    // Appeal fees
    if (/^áfrýjunargjald$/i.test(t)) return false;
    // Subscriptions, annual passes, membership cards, annual fees
    if (/áskrift|árskort|ársgjald|staðgreidd kort|námsmannakort|félagsskírteini/i.test(t)) return false;
    // Payments and receipts
    if (/^greiðsla\b|^kvittun\b/i.test(t)) return false;
    // Practice fees (any tag)
    if (/æfingagj[aö]/i.test(t)) return false;
    // Donations, fundraising, sponsorship
    if (/almannaheill|styrktarlína|styrktaraðilar/i.test(t)) return false;
    // Competition passes (not activities)
    if (/keppnispassi/i.test(t)) return false;
    // Generic standalone fee words with single 'other' tag
    if (card.tags.length === 1 && card.tags[0] === 'other') {
      if (/\bgjald\b|\bgjöld\b/i.test(t) && !/æfing|þjálfun|námskeið|leikskóli/i.test(t)) {
        return false;
      }
    }
    // Supporters clubs
    if (/stuðningsfélagar/i.test(t)) return false;
    // Supporter/patron roles
    if (/stuðningsaðili/i.test(t)) return false;
    // Donations to elite teams (but not frístundastyrkur)
    if (/\bstyrkur\b|\bstyrkir\b/i.test(t) && !/frístundastyrkur/i.test(t)) return false;
    // Foreign-language membership fees
    if (/mokestis/i.test(t)) return false;
    // Bus passes, school escorts
    if (/fylkisrút/i.test(t)) return false;
    if (/\bfylgd\b/i.test(t)) return false;
    // Card/pass purchases, subscription periods
    if (/^Kort\b|opið kort|stakir mánuðir/i.test(t)) return false;
    // Additional fee terms (practice membership fees, annual fees)
    if (/iðkendagjald|árgjald/i.test(t)) return false;
    // Remaining membership/admission terms
    if (/félagsaðild|\baðild\b/i.test(t)) return false;
    // Explicit adult-only marker (but keep events for "children and adults")
    if (/\bfullorðin|\bfullorðn/i.test(t) && !/börn/i.test(t)) return false;
    // Masters divisions
    if (/\bmasters\b/i.test(t)) return false;
    // Senior activities (60+, eldri borgarar)
    if (/\b60\s*\+|60 ára og eldri|\beldri borgar/i.test(t)) return false;
    // Known adult-only providers
    const club = card.clubname || '';
    if (/^World Class\b/i.test(club) && /infrared|pilates|barre|toning|betra form|hot yoga|mömmu/i.test(t)) return false;
    if (/^Vesenisferðir/i.test(club)) return false;
    if (/hilton.*spa/i.test(club)) return false;
    // Age-gated: minimum age 18+ means adult-only
    if (Array.isArray(card.age) && card.age.length >= 1) {
      if (Math.min(...card.age) >= 18) return false;
    }
    // International competition trips (country code + championship)
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

  // ── Configuration: Smart pagination ───────────────────────────────

  const MIN_RESULTS = 6;  // Minimum valid cards to accumulate before showing

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
    hiddenCards: [],
    hiddenCount: 0,
    showHidden: false,
    query: '',
    tagCounts: null,
    lang: (() => { try { return localStorage.getItem('lang'); } catch (_) { return null; } })() || 'is',
  };

  // ── URL State ────────────────────────────────────────────────────

  function stateToUrl() {
    const params = new URLSearchParams();
    if (state.age) params.set('age', state.age);
    if (state.from) params.set('from', state.from);
    if (state.to) params.set('to', state.to);
    if (state.tags) params.set('tags', state.tags);
    if (state.postCode) params.set('postCode', state.postCode);
    if (state.sortBy) params.set('sortBy', state.sortBy);
    if (state.query) params.set('q', state.query);
    if (state.page > 1) params.set('page', String(state.page));
    return params.toString();
  }

  function urlToState() {
    const params = new URLSearchParams(window.location.search);
    const defaults = getDefaultDates();
    state.age = params.get('age') || '';
    state.from = params.get('from') || defaults.from;
    state.to = params.get('to') || defaults.to;
    state.tags = params.get('tags') || '';
    state.postCode = params.get('postCode') || '';
    state.sortBy = params.get('sortBy') || '';
    state.query = params.get('q') || '';
    state.page = parseInt(params.get('page'), 10) || 1;
  }

  function syncFormFromState() {
    ageSelect.value = state.age;
    ageWelcome.value = state.age;
    dateFrom.value = state.from;
    dateTo.value = state.to;
    locationSelect.value = state.postCode;
    sortSelect.value = state.sortBy;
    if (queryInput) queryInput.value = state.query;
    updateTagChips();
  }

  function pushUrl() {
    const qs = stateToUrl();
    const url = qs ? `?${qs}` : window.location.pathname;
    history.pushState(null, '', url);
  }

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
  const shareBtn = $('#share-btn');
  const resultsGrid = $('#results-grid');
  const resultsInfo = $('#results-info');
  const loadMoreWrap = $('#load-more-wrap');
  const loadMoreBtn = $('#load-more-btn');
  const loadingState = $('#loading-state');
  const emptyState = $('#empty-state');
  const errorState = $('#error-state');
  const errorMessage = $('#error-message');
  const retryBtn = $('#retry-btn');
  const queryInput = $('#query-input');
  const aboutToggle = $('#about-toggle');
  const aboutBody = $('#about-body');
  const langToggle = $('#lang-toggle');

  // Bind about toggle — early binding
  if (aboutToggle && aboutBody) {
    aboutToggle.addEventListener('click', () => {
      const open = aboutBody.hidden;
      aboutBody.hidden = !open;
      aboutToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Bind lang toggle immediately — not inside init()/bindEvents()
  // so it works even if other init steps fail
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      setLang(state.lang === 'is' ? 'en' : 'is');
    });
  }

  // ── i18n helpers ──────────────────────────────────────────────────

  function t(key) {
    return TRANSLATIONS[state.lang]?.[key] || TRANSLATIONS.is[key] || key;
  }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text) el.textContent = text;
    });
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'is';
    // Update segmented control highlight
    const isOpt = langToggle.querySelector('.lang-option--is');
    const enOpt = langToggle.querySelector('.lang-option--en');
    if (isOpt && enOpt) {
      isOpt.classList.toggle('lang-option--active', state.lang === 'is');
      enOpt.classList.toggle('lang-option--active', state.lang === 'en');
    }
    // Update search placeholder
    if (queryInput) queryInput.placeholder = t('searchPlaceholder');
    // Re-render age options with translated text
    repopulateAgeOptions();
    // Re-render sort option text
    repopulateSortOptions();
    // Re-render tag chips with translated labels
    renderTagChips();
    // Update dynamic text and re-render cards if results are showing
    if (state.hasSearched) {
      updateResultsInfo();
      updateLoadMore();
      reRenderCards();
    }
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem('lang', lang); } catch (_) { /* private browsing */ }
    applyLang();
  }

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

  function cleanText(str) {
    if (!str) return str;
    return str.replace(/\uFFFD+/g, '');
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function getDefaultDates() {
    const now = new Date();
    let year = now.getFullYear();
    if (now.getMonth() > 7) year++;
    return { from: `${year}-06-01`, to: `${year}-08-31` };
  }

  // ── API ────────────────────────────────────────────────────────────

  function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal })
      .then((res) => { clearTimeout(timer); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res; })
      .catch((err) => { clearTimeout(timer); throw err; });
  }

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
    let data;
    if (start !== -1) {
      const jsonStart = start + marker.length;
      const jsonEnd = html.indexOf('</script>', jsonStart);
      data = JSON.parse(html.substring(jsonStart, jsonEnd));
    } else {
      // Fallback: look for any script with __NEXT_DATA__
      const alt = '__NEXT_DATA__';
      const altIdx = html.indexOf(alt);
      if (altIdx === -1) throw new Error('Gat ekki lesið gögn');
      const scriptStart = html.lastIndexOf('<script', altIdx);
      const scriptEnd = html.indexOf('</script>', altIdx);
      if (scriptStart === -1 || scriptEnd === -1) throw new Error('Gat ekki lesið gögn');
      const tagEnd = html.indexOf('>', scriptStart) + 1;
      data = JSON.parse(html.substring(tagEnd, scriptEnd));
    }
    // Support both { pageProps: ... } and { props: { pageProps: ... } }
    return data.props || data;
  }

  async function fetchPage() {
    const url = buildUrl();

    const makeAttempt = (proxyFn, index) =>
      fetchWithTimeout(proxyFn(url), FETCH_TIMEOUT)
        .then(async (res) => {
          const data = parseNextData(await res.text()).pageProps;
          lastWorkingProxy = index;
          return data;
        });

    // If a proxy worked before, try it first to avoid unnecessary parallel requests
    if (lastWorkingProxy >= 0 && lastWorkingProxy < CORS_PROXIES.length) {
      try {
        return await makeAttempt(CORS_PROXIES[lastWorkingProxy], lastWorkingProxy);
      } catch (_) {
        lastWorkingProxy = -1;
      }
    }

    // Race all proxies in parallel — fastest successful response wins
    try {
      return await Promise.any(CORS_PROXIES.map((fn, i) => makeAttempt(fn, i)));
    } catch (_) {
      throw new Error('Ekki tókst að ná sambandi við frístund.is');
    }
  }

  // ── JSON-first data loading ─────────────────────────────────────

  async function loadEventsJson() {
    if (cachedEventsJson) return cachedEventsJson;
    try {
      const res = await fetchWithTimeout(EVENTS_JSON, 5000);
      const data = JSON.parse(await res.text());
      const age = Date.now() - new Date(data.fetchedAt).getTime();
      if (age > EVENTS_MAX_AGE_MS) return null;
      cachedEventsJson = data;
      return data;
    } catch (_) {
      return null;
    }
  }

  function parseApiDate(d) {
    const parts = d.split('-').map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  function filterCachedCards(cards, options) {
    const skipTags = options && options.skipTags;
    let filtered = cards;

    // Re-apply isValidActivity to catch stale data
    filtered = filtered.filter(isValidActivity);

    if (state.age) {
      const age = parseInt(state.age, 10);
      filtered = filtered.filter((card) => {
        if (!Array.isArray(card.age) || card.age.length === 0) return true;
        const minAge = Math.min(...card.age);
        const maxAge = Math.max(...card.age);
        return age >= minAge && age <= maxAge;
      });
    }

    if (state.from || state.to) {
      filtered = filtered.filter((card) => {
        if (!card.date) return true;
        const cardStart = card.date.start ? parseApiDate(card.date.start) : null;
        const cardEnd = card.date.end ? parseApiDate(card.date.end) : null;
        if (state.from && cardEnd) {
          if (cardEnd < new Date(state.from)) return false;
        }
        if (state.to && cardStart) {
          if (cardStart > new Date(state.to)) return false;
        }
        return true;
      });
    }

    if (state.query) {
      const q = state.query.toLowerCase();
      filtered = filtered.filter((card) =>
        card.title.toLowerCase().includes(q) ||
        (card.clubname || '').toLowerCase().includes(q) ||
        (card.description || '').toLowerCase().includes(q)
      );
    }

    if (state.postCode) {
      filtered = filtered.filter((card) => (card.location || '').trim() === state.postCode);
    }

    if (!skipTags && state.tags) {
      const selectedTags = state.tags.split(',');
      filtered = filtered.filter((card) =>
        card.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (state.sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'is'));
    } else if (state.sortBy === 'dateFrom') {
      filtered.sort((a, b) => {
        const da = a.date?.start ? parseApiDate(a.date.start) : new Date(0);
        const db = b.date?.start ? parseApiDate(b.date.start) : new Date(0);
        return da - db;
      });
    } else if (state.sortBy === 'dateTo') {
      filtered.sort((a, b) => {
        const da = a.date?.end ? parseApiDate(a.date.end) : new Date(0);
        const db = b.date?.end ? parseApiDate(b.date.end) : new Date(0);
        return db - da;
      });
    }

    return filtered;
  }

  async function fetchFromJson() {
    const data = await loadEventsJson();
    if (!data) return null;

    // Compute tag counts (all filters except tags)
    const baseFiltered = filterCachedCards(data.cards, { skipTags: true });
    const tagCounts = { '': baseFiltered.length };
    TAG_CATEGORIES.forEach((cat) => {
      const catTags = cat.tags;
      tagCounts[catTags.join(',')] = baseFiltered.filter((card) =>
        card.tags.some((tag) => catTags.includes(tag))
      ).length;
    });

    const allFiltered = filterCachedCards(data.cards);

    return {
      cards: allFiltered,
      hiddenCards: [],
      tagCounts,
      pageInfo: {
        page: 1,
        hasNextPage: false,
        itemCount: allFiltered.length,
      },
    };
  }

  // ── Smart pagination: auto-fetch until enough valid results ──────

  async function fetchFilteredLive() {
    let allFiltered = [];
    let allHidden = [];
    let pageInfo = null;
    let apiPage = state.page;

    while (true) {
      state.page = apiPage;
      const data = await fetchPage();
      const allCards = data.cards || [];
      allCards.forEach((card) => {
        if (isValidActivity(card)) {
          allFiltered.push(card);
        } else {
          allHidden.push(card);
        }
      });
      pageInfo = data.pageInfo || null;

      if (allFiltered.length >= MIN_RESULTS || !pageInfo?.hasNextPage) break;
      apiPage++;
    }

    state.page = apiPage;
    return { cards: allFiltered, hiddenCards: allHidden, pageInfo };
  }

  async function fetchFiltered() {
    const jsonResult = await fetchFromJson();
    if (jsonResult) return jsonResult;
    return fetchFilteredLive();
  }

  // ── UI: Populate dropdowns ────────────────────────────────────────

  function populateAgeOptions(selectEl) {
    for (let i = 1; i <= 17; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i} ${t('ageYear')}`;
      selectEl.appendChild(opt);
    }
  }

  function repopulateAgeOptions() {
    // Update text of existing age options (skip the first placeholder option)
    [ageWelcome, ageSelect].forEach((sel) => {
      Array.from(sel.options).forEach((opt) => {
        if (opt.value) opt.textContent = `${opt.value} ${t('ageYear')}`;
      });
    });
  }

  function repopulateSortOptions() {
    const keys = ['sortDefault', 'sortName', 'sortDateFrom', 'sortDateTo'];
    Array.from(sortSelect.options).forEach((opt, i) => {
      if (keys[i]) opt.textContent = t(keys[i]);
    });
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
    const counts = state.tagCounts;

    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'tag-chip';
    allChip.setAttribute('aria-pressed', state.tags === '' ? 'true' : 'false');
    const allLabel = t('allTypes');
    allChip.textContent = counts ? `${allLabel} (${counts['']})` : allLabel;
    allChip.addEventListener('click', () => { state.tags = ''; updateTagChips(); if (state.hasSearched) search(false); });
    tagChipsEl.appendChild(allChip);

    TAG_CATEGORIES.forEach((cat) => {
      const apiTags = cat.tags.join(',');
      const count = counts ? (counts[apiTags] || 0) : null;

      // Hide empty categories when counts are available
      if (counts && count === 0) return;

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip';
      chip.dataset.tags = apiTags;
      chip.setAttribute('aria-pressed', state.tags === apiTags ? 'true' : 'false');
      const label = state.lang === 'en' ? cat.labelEn : cat.label;
      chip.innerHTML = `<span class="chip-icon">${cat.icon}</span>${label}${count !== null ? ` (${count})` : ''}`;
      chip.addEventListener('click', () => { state.tags = apiTags; updateTagChips(); if (state.hasSearched) search(false); });
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
    const signupUrl = card.signupUrl || '';
    const detailUrl = `${BASE_URL}/namskeid/${card.id}`;
    const locationStr = card.locationName
      ? escapeHtml(card.locationName)
      : card.location ? getLocationShort(card.location) : '';
    const dateStr = card.date
      ? card.date.start === card.date.end
        ? formatDate(card.date.start)
        : `${formatDate(card.date.start)} – ${formatDate(card.date.end)}`
      : '';
    const titleStr = cleanText(card.title) || card.title;
    const clubStr = cleanText(card.clubname) || card.clubname || '';
    const ageStr = Array.isArray(card.age) && card.age.length > 0
      ? (() => {
          const min = Math.min(...card.age);
          const max = Math.max(...card.age);
          return min === max ? `${min} ${t('ageYear')}` : `${min}–${max} ${t('ageYear')}`;
        })()
      : t('allAges');
    const descStr = card.description ? escapeHtml(cleanText(card.description) || card.description) : '';
    const hasLongDesc = card.description && card.description.length > 120;

    // Google Maps link
    const mapsQuery = card.locationName
      ? `${card.locationName}, Iceland`
      : card.location ? `${getLocationShort(card.location)}, Reykjavik, Iceland` : '';
    const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : '';

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
    const ageBadge = `<span class="card-tag card-tag--age">${ageStr}</span>`;

    const arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

    el.innerHTML = `
      ${imgHtml}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(titleStr)}</h3>
        ${clubStr ? `<div class="card-club">
          <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${escapeHtml(clubStr)}
        </div>` : ''}
        ${descStr ? `<p class="card-desc">${descStr}</p>` : ''}
        ${hasLongDesc ? `<button type="button" class="card-desc-toggle">${t('showMore')}</button>` : ''}
        <div class="card-tags">${tagBadges}${ageBadge}</div>
        <div class="card-meta">
          ${dateStr ? `<span class="card-meta-item">
            <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${dateStr}
          </span>` : ''}
          ${locationStr ? `<a class="card-meta-item card-meta-link" ${mapsUrl ? `href="${mapsUrl}" target="_blank" rel="noopener"` : ''}>
            <svg class="card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${locationStr}
          </a>` : ''}
        </div>
        <div class="card-links">
          <a class="card-link" href="${detailUrl}" target="_blank" rel="noopener">
            ${t('viewDetails')} ${arrowSvg}
          </a>
          ${signupUrl ? `<a class="card-link card-link--signup" href="${signupUrl}" target="_blank" rel="noopener">
            ${t('signUp')} ${arrowSvg}
          </a>` : ''}
          <a class="card-link card-link--report" href="${REPORT_FORM_URL}?${REPORT_FORM_ENTRY_TITLE}=${encodeURIComponent(titleStr)}&${REPORT_FORM_ENTRY_URL}=${encodeURIComponent(detailUrl)}" target="_blank" rel="noopener">
            ${t('reportEvent')}
          </a>
        </div>
      </div>
    `;

    // Bind description toggle
    if (hasLongDesc) {
      const toggleBtn = el.querySelector('.card-desc-toggle');
      const descEl = el.querySelector('.card-desc');
      if (toggleBtn && descEl) {
        toggleBtn.addEventListener('click', () => {
          descEl.classList.toggle('card-desc--expanded');
          toggleBtn.textContent = descEl.classList.contains('card-desc--expanded')
            ? t('showLess') : t('showMore');
        });
      }
    }

    return el;
  }

  function renderResults(cards, append) {
    if (!append) resultsGrid.innerHTML = '';
    cards.forEach((card) => resultsGrid.appendChild(renderCard(card)));
  }

  function reRenderCards() {
    if (state.cards.length === 0 && state.hiddenCards.length === 0) return;
    resultsGrid.innerHTML = '';
    state.cards.forEach((card) => resultsGrid.appendChild(renderCard(card)));
    if (state.showHidden) {
      state.hiddenCards.forEach((card) => {
        const el = renderCard(card);
        el.classList.add('card--hidden');
        resultsGrid.appendChild(el);
      });
    }
  }

  function updateResultsInfo() {
    if (!state.pageInfo || state.cards.length === 0) {
      resultsInfo.hidden = true;
      return;
    }
    resultsInfo.hidden = false;
    const shown = state.showHidden ? state.cards.length + state.hiddenCount : state.cards.length;
    let html = `<strong>${shown}</strong> ${t('resultsCount')}`;
    if (state.hiddenCount > 0) {
      html += ` · <strong>${state.hiddenCount}</strong> ${t('hiddenCount')}`;
      const toggleLabel = state.showHidden ? t('hideHidden') : t('showHidden');
      html += ` <button type="button" class="hidden-toggle" id="hidden-toggle">${toggleLabel}</button>`;
    }
    resultsInfo.innerHTML = html;
    // Bind toggle
    const toggleBtn = document.getElementById('hidden-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.showHidden = !state.showHidden;
        reRenderCards();
        updateResultsInfo();
      });
    }
  }

  function updateLoadMore() {
    const hasMore = state.pageInfo && state.pageInfo.hasNextPage;
    loadMoreWrap.hidden = !hasMore;
    loadMoreBtn.disabled = state.loading;
    loadMoreBtn.innerHTML = state.loading
      ? `<span class="spinner"></span> ${t('loadingMore')}`
      : t('loadMore');
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
    state.query = queryInput ? queryInput.value.trim() : '';
  }

  async function performSearch(append) {
    if (!append) {
      state.page = 1;
      state.cards = [];
      state.hiddenCards = [];
      state.hiddenCount = 0;
      state.showHidden = false;
    }

    state.loading = true;
    state.error = null;

    if (!append) showState('loading');
    updateLoadMore();

    try {
      const { cards: filtered, hiddenCards, pageInfo, tagCounts } = await fetchFiltered();

      state.cards = append ? state.cards.concat(filtered) : filtered;
      state.hiddenCards = append ? state.hiddenCards.concat(hiddenCards) : hiddenCards;
      state.hiddenCount = state.hiddenCards.length;
      state.pageInfo = pageInfo;
      state.loading = false;

      if (tagCounts) {
        state.tagCounts = tagCounts;
        renderTagChips();
        updateTagChips();
      }

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
        errorMessage.textContent = err.message || t('errorText');
        showState('error');
      }
    }
  }

  async function search(append) {
    readFilters();
    if (!append) {
      state.page = 1;
      state.cards = [];
    }
    pushUrl();
    await performSearch(append);
  }

  async function loadMore() {
    if (state.loading || !state.pageInfo?.hasNextPage) return;
    state.page++;
    await search(true);
  }

  function resetToWelcome() {
    const defaults = getDefaultDates();
    dateFrom.value = defaults.from;
    dateTo.value = defaults.to;
    locationSelect.value = '';
    sortSelect.value = '';
    ageSelect.value = '';
    state.age = '';
    state.from = defaults.from;
    state.to = defaults.to;
    state.tags = '';
    state.postCode = '';
    state.sortBy = '';
    state.page = 1;
    state.cards = [];
    state.hiddenCards = [];
    state.hiddenCount = 0;
    state.showHidden = false;
    state.query = '';
    state.tagCounts = null;
    state.pageInfo = null;
    state.hasSearched = false;
    if (queryInput) queryInput.value = '';
    updateTagChips();
    resultsGrid.innerHTML = '';
    resultsInfo.hidden = true;
    loadMoreWrap.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = true;
    loadingState.hidden = true;
    resultsGrid.hidden = false;
    filtersEl.hidden = true;
    welcomeEl.hidden = false;
    ageWelcome.value = '';
  }

  function clearFilters() {
    resetToWelcome();
    history.pushState(null, '', window.location.pathname);
  }

  // ── Share popover ─────────────────────────────────────────────────

  let sharePopover = null;
  let popoverCloseHandler = null;
  let popoverEscHandler = null;

  function makeShareSvg(pathD, filled) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (filled) {
      svg.setAttribute('fill', 'currentColor');
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
    }
    const paths = Array.isArray(pathD) ? pathD : [pathD];
    paths.forEach((d) => {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  function makeShareOption(tag, id, svgPaths, filled, labelKey, labelText, isExternal) {
    const el = document.createElement(tag);
    el.className = 'share-option';
    el.id = id;
    if (tag === 'a') {
      el.href = '#';
      if (isExternal) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    } else {
      el.type = 'button';
    }
    el.appendChild(makeShareSvg(svgPaths, filled));
    const span = document.createElement('span');
    if (labelKey) span.setAttribute('data-i18n', labelKey);
    span.textContent = labelText;
    el.appendChild(span);
    return el;
  }

  function buildSharePopover() {
    const el = document.createElement('div');
    el.id = 'share-popover';
    el.className = 'share-popover';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Share options');

    const fbPath = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
    const waPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';
    const twPaths = ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z'];
    const emailPaths = ['M2 4h20v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z', 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'];
    const linkPaths = ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'];

    el.appendChild(makeShareOption('a', 'share-facebook', fbPath, true, null, 'Facebook', true));
    el.appendChild(makeShareOption('a', 'share-whatsapp', waPath, true, null, 'WhatsApp', true));
    el.appendChild(makeShareOption('a', 'share-twitter', twPaths, true, null, 'Twitter / X', true));
    el.appendChild(makeShareOption('a', 'share-email', emailPaths, false, 'shareEmail', 'Tölvupóstur', false));
    el.appendChild(makeShareOption('button', 'share-copy', linkPaths, false, 'shareCopyLink', 'Afrita tengil', false));

    document.body.appendChild(el);
    return el;
  }

  function closeSharePopover() {
    if (!sharePopover) return;
    sharePopover.hidden = true;
    if (popoverCloseHandler) {
      document.removeEventListener('click', popoverCloseHandler);
      popoverCloseHandler = null;
    }
    if (popoverEscHandler) {
      document.removeEventListener('keydown', popoverEscHandler);
      popoverEscHandler = null;
    }
  }

  function toggleSharePopover(url) {
    if (!sharePopover) sharePopover = buildSharePopover();
    if (!sharePopover.hidden) { closeSharePopover(); return; }

    const text = t('shareText');
    const subject = t('shareEmailSubject');
    sharePopover.querySelector('#share-facebook').href =
      'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    sharePopover.querySelector('#share-whatsapp').href =
      'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
    sharePopover.querySelector('#share-twitter').href =
      'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
    sharePopover.querySelector('#share-email').href =
      'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text + '\n\n' + url);

    sharePopover.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    const rect = shareBtn.getBoundingClientRect();
    sharePopover.style.position = 'fixed';
    sharePopover.style.top = (rect.bottom + 6) + 'px';
    sharePopover.style.right = (window.innerWidth - rect.right) + 'px';
    sharePopover.style.left = 'auto';
    sharePopover.hidden = false;

    const copyBtn = sharePopover.querySelector('#share-copy');
    const copySpan = copyBtn.querySelector('span');
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        copySpan.textContent = t('shareCopied');
        setTimeout(() => {
          copySpan.textContent = t('shareCopyLink');
          closeSharePopover();
        }, 2000);
      } catch (_) {
        closeSharePopover();
      }
    };

    setTimeout(() => {
      popoverCloseHandler = (e) => {
        if (!sharePopover.contains(e.target) && e.target !== shareBtn) closeSharePopover();
      };
      document.addEventListener('click', popoverCloseHandler);
      popoverEscHandler = (e) => { if (e.key === 'Escape') closeSharePopover(); };
      document.addEventListener('keydown', popoverEscHandler);
    }, 0);
  }

  // ── Event binding ─────────────────────────────────────────────────

  const debouncedSearch = debounce(() => { if (state.hasSearched) search(false); }, 300);

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

    // Filters: manual search button (kept as fallback)
    searchBtn.addEventListener('click', () => search(false));
    clearBtn.addEventListener('click', clearFilters);
    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      if (navigator.share) {
        try { await navigator.share({ title: 'Betri Frístund', url }); } catch (_) {}
      } else {
        toggleSharePopover(url);
      }
    });
    loadMoreBtn.addEventListener('click', loadMore);
    retryBtn.addEventListener('click', () => search(false));

    // Auto-apply: age, location, sort trigger search immediately
    ageSelect.addEventListener('change', () => search(false));
    locationSelect.addEventListener('change', () => { if (state.hasSearched) search(false); });
    sortSelect.addEventListener('change', () => { if (state.hasSearched) search(false); });

    // Auto-apply: date inputs debounced (date pickers may fire multiple events)
    dateFrom.addEventListener('change', debouncedSearch);
    dateTo.addEventListener('change', debouncedSearch);

    // Text search: debounced
    if (queryInput) queryInput.addEventListener('input', debouncedSearch);

    // Browser back/forward navigation
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('age') || params.has('tags') || params.has('postCode') || params.has('q')) {
        urlToState();
        syncFormFromState();
        showFiltersView();
        performSearch(false);
      } else {
        resetToWelcome();
      }
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
    applyLang();

    // Restore state from URL if query params exist
    const params = new URLSearchParams(window.location.search);
    if (params.has('age') || params.has('tags') || params.has('postCode') || params.has('q')) {
      urlToState();
      syncFormFromState();
      showFiltersView();
      performSearch(false);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
