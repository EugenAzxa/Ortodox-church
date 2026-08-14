/* ==========================================================================
   Вечан спомен · Eternal Memory
   Memorial wall, Saylavy Memory Pages, candle stand, remembrance reckoner.
   No build step, no dependencies.
   ========================================================================== */

(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Storage
     Everything a visitor does in this demo lives in their own browser. */
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem('vs:' + key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('vs:' + key, JSON.stringify(value)); } catch { /* private mode */ }
    }
  };

  /* =========================================================== The opening
     Name, then icons, then the arch opens and you pass through it.

     ?intro=0 skips it, which is what you want while working on a section
     halfway down the page. ?intro=1 forces it back on. */
  (function opening() {
    const intro = $('#intro');
    if (!intro) return;

    const forced = new URLSearchParams(location.search).get('intro');
    if (forced === '0' || (reduced && forced !== '1')) { intro.remove(); return; }

    // Wrap each letter so it can lift on its own beat. Built as nodes rather
    // than markup: esc() is declared further down and would still be in its
    // temporal dead zone here.
    const name = $('#introName');
    if (name) {
      const chars = [...name.textContent];
      name.textContent = '';
      chars.forEach((ch, i) => {
        const span = document.createElement('span');
        if (ch === ' ') {
          span.className = 'sp';
        } else {
          span.className = 'ch';
          span.style.setProperty('--i', i);
          span.textContent = ch;
        }
        name.appendChild(span);
      });
    }

    document.body.classList.add('intro-on');

    let done = false;
    const enter = () => {
      if (done) return;
      done = true;
      document.body.classList.add('intro-leaving');
      // Unlock the page as the arch opens, not after it finishes.
      setTimeout(() => document.body.classList.remove('intro-on'), 260);
      setTimeout(() => {
        document.body.classList.remove('intro-leaving');
        intro.remove();
      }, 1600);
    };

    // ?intro=hold leaves the opening on screen so it can be looked at properly.
    const timer = forced === 'hold' ? null : setTimeout(enter, 3100);
    const skip = () => { clearTimeout(timer); enter(); };

    $('#introSkip')?.addEventListener('click', skip);
    intro.addEventListener('click', skip);
    addEventListener('keydown', function once(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        removeEventListener('keydown', once);
        skip();
      }
    });
  })();

  /* ------------------------------------------------------------------- Nav */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ Super menu
     The whole site on one screen, and the only menu control at any width. */
  const sm       = $('#superMenu');
  const smPanel  = $('#menuPanel');
  const menuBtn  = $('#menuOpen');
  let smLast = null;

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      smLast = document.activeElement;
      sm.hidden = false;
      requestAnimationFrame(() => sm.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      $('#menuClose').focus();
    } else {
      sm.classList.remove('is-open');
      document.body.style.overflow = '';
      const done = () => { sm.hidden = true; };
      reduced ? done() : setTimeout(done, 420);
      smLast?.focus();
    }
  }

  menuBtn.addEventListener('click', () => setMenu(sm.hidden));
  $('#menuClose').addEventListener('click', () => setMenu(false));
  $('#menuScrim').addEventListener('click', () => setMenu(false));
  // Any destination closes the menu behind you.
  smPanel.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  sm.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || sm.hidden) return;
    const f = $$('button, a[href]', smPanel).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* -------------------------------------------------------- Hero parallax */
  const heroBg = $('#heroBg');
  if (heroBg && !reduced) {
    let raf = null;
    addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = Math.min(scrollY, innerHeight);
        heroBg.style.transform = `scale(1.06) translateY(${y * 0.16}px)`;
        raf = null;
      });
    }, { passive: true });
  }

  /* --------------------------------------------------------- Scroll reveal */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ------------------------------------------------------ Language toggle
     Every translatable node carries data-sr. The English original is
     captured on first switch so we can always go back to it. */
  const langButtons = $$('.lang button');
  let lang = store.get('lang', 'en');

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = next === 'sr' ? 'sr' : 'en';

    $$('[data-sr]').forEach(el => {
      if (!el.dataset.en) el.dataset.en = el.innerHTML;
      const value = next === 'sr' ? el.dataset.sr : el.dataset.en;
      if (value != null) el.innerHTML = value;
    });

    $$('[data-sr-ph]').forEach(el => {
      if (!el.dataset.enPh) el.dataset.enPh = el.placeholder;
      el.placeholder = next === 'sr' ? el.dataset.srPh : el.dataset.enPh;
    });

    langButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    store.set('lang', next);
    renderWall();
    renderCandles();
    renderQuestion(false);
    renderProof();
    reckon();
    stopSpeaking();          // a half-read prayer in the old language makes no sense
    renderPrayers();
    renderIcons();
    speechReady();
    if (openId) openMemoryPage(openId, true);
  }

  langButtons.forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  const t = (en, sr) => (lang === 'sr' ? sr : en);

  /* ------------------------------------------------------------- Utilities */
  const MONTHS_EN = ['January','February','March','April','May','June','July',
                     'August','September','October','November','December'];
  const MONTHS_SR = ['јануар','фебруар','март','април','мај','јун','јул',
                     'август','септембар','октобар','новембар','децембар'];

  const parseDate = iso => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const longDate = date => {
    const months = lang === 'sr' ? MONTHS_SR : MONTHS_EN;
    return lang === 'sr'
      ? `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}.`
      : `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const years = entry => `${parseDate(entry.born).getFullYear()} – ${parseDate(entry.died).getFullYear()}`;

  const esc = str => String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* Where every "open your own page" route leads. One constant here and one
     literal in index.html for the links that must survive without JavaScript;
     both are listed in the README. */
  const SAYLAVY_SIGNIN = 'https://saylavy.com/auth/sign-in?redirect=/app';

  /* ------------------------------------------------------------ Memorial data */
  let entries = [];
  let filter = 'all';
  let query = '';
  let openId = null;

  const localCandles = () => store.get('candlesPerSoul', {});
  const candleCount = entry => entry.candles + (localCandles()[entry.id] || 0);

  fetch('data/memorials.json')
    .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
    .then(data => {
      entries = data.entries || [];
      applyLang(lang);          // first paint, in the stored language
      renderStats();
      syncFromHash();           // arrived on a link straight to one person
    })
    .catch(() => {
      $('#wallGrid').innerHTML =
        `<p style="color:var(--bone-faint);grid-column:1/-1">
           The memorial could not be loaded. If you opened this file directly, serve the folder
           over HTTP instead – <code>npx serve</code> – so that data/memorials.json can be read.
         </p>`;
    });

  /* ------------------------------------------------------------ Hero counters */
  function renderStats() {
    const souls  = entries.length;
    const lit    = entries.reduce((n, e) => n + candleCount(e), 0);
    const voices = entries.filter(e => e.voice).length;

    countTo($('#statSouls'), souls);
    countTo($('#statCandles'), lit);
    countTo($('#statVoices'), voices);

    // The same three figures appear in the super menu.
    $('#smSouls').textContent   = souls.toLocaleString();
    $('#smCandles').textContent = lit.toLocaleString();
    $('#smVoices').textContent  = voices.toLocaleString();
  }

  function countTo(el, target) {
    if (!el) return;
    if (reduced) { el.textContent = target.toLocaleString(); return; }
    const start = performance.now();
    const dur = 1100;
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ Memorial wall */
  const grid  = $('#wallGrid');
  const empty = $('#wallEmpty');

  function matches(entry) {
    if (filter !== 'all' && !(entry.tags || []).includes(filter)) return false;
    if (!query) return true;
    const haystack = [
      entry.name, entry.nameSr, entry.role, entry.roleSr,
      entry.bornPlace, entry.diedPlace, years(entry)
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderWall() {
    if (!entries.length) return;
    const visible = entries.filter(matches);

    grid.innerHTML = visible.map(e => `
      <button class="card" type="button" data-id="${e.id}"
              aria-label="${esc(t(e.name, e.nameSr))}, ${esc(years(e))} – open the Memory Page">
        <span class="card__frame${e.portrait ? ' has-portrait' : ''}">
          ${e.portrait ? `
            <img class="card__portrait" src="${esc(e.portrait)}" alt="${esc(t(e.name, e.nameSr))}"
                 loading="lazy" decoding="async"
                 onerror="this.closest('.card__frame').classList.remove('has-portrait');this.remove()">
            <span class="card__vignette" aria-hidden="true"></span>` : ''}
          <span class="card__halo" aria-hidden="true"></span>
          <span class="card__monogram" aria-hidden="true">${esc(e.monogram)}</span>
          <span class="card__ph">${t('Portrait pending', 'Портрет у припреми')}</span>
          <span class="card__candles">
            <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true">
              <ellipse cx="4.5" cy="2.4" rx="2" ry="2.4" fill="currentColor"/>
              <rect x="3.2" y="4.6" width="2.6" height="7" rx="1" fill="currentColor" opacity=".55"/>
            </svg>
            ${candleCount(e).toLocaleString()}
          </span>
        </span>
        <span class="card__body">
          <span class="card__name">${esc(t(e.name, e.nameSr))}</span>
          <span class="card__years">${esc(years(e))}</span>
          <span class="card__role">${esc(t(e.role, e.roleSr))}</span>
        </span>
      </button>
    `).join('') + `
      <a class="card card--add" href="${SAYLAVY_SIGNIN}">
        <span class="card__frame card__frame--add">
          <svg class="i i--xl" aria-hidden="true"><use href="#i-plus"/></svg>
          <span class="card__ph">${t('Opens on Saylavy', 'Отвара се на Saylavy')}</span>
        </span>
        <span class="card__body">
          <span class="card__name">${t('Add someone', 'Додајте некога')}</span>
          <span class="card__years">${t('to this wall', 'на овај зид')}</span>
          <span class="card__role">${t('Sign in to Saylavy and open a Memory Page for them',
                                       'Пријавите се на Saylavy и отворите спомен-страницу')}</span>
        </span>
      </a>`;

    empty.classList.toggle('is-shown', visible.length === 0);
  }

  $$('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      $$('.filters button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      renderWall();
    });
  });

  let searchTimer;
  $('#wallSearch').addEventListener('input', e => {
    clearTimeout(searchTimer);
    const value = e.target.value.trim().toLowerCase();
    searchTimer = setTimeout(() => { query = value; renderWall(); }, 120);
  });

  grid.addEventListener('click', e => {
    // The last tile in the grid is a link out to Saylavy, not a Memory Page.
    const card = e.target.closest('.card');
    if (card && card.dataset.id) openMemoryPage(card.dataset.id);
  });

  /* -------------------------------------------------- Saylavy Memory Page */
  const mp        = $('#mp');
  const mpPanel   = $('#mpPanel');
  const mpContent = $('#mpContent');
  let lastFocused = null;

  const WAVE = [4,9,14,22,17,26,12,30,19,24,10,28,16,21,13,27,20,25,9,18,
                23,11,29,15,22,8,26,14,20,12,24,17,28,10,21,16,25,13,19,7];

  function memoryPageHTML(e) {
    const name    = t(e.name, e.nameSr);
    const nameAlt = t(e.nameSr, e.name);
    const first   = name.split(' ')[0];
    const born    = parseDate(e.born);
    const died    = parseDate(e.died);

    const voice = e.voice ? `
      <h3>${t('In their own voice', 'Његовим гласом')}</h3>
      <div class="voice" id="voiceBlock">
        <div class="voice__top">
          <button class="voice__play" type="button" id="voicePlay"
                  aria-label="${t('Play the recording', 'Пусти снимак')}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div class="voice__meta">
            <div class="voice__title">${esc(t(e.voice.title, e.voice.titleSr))}</div>
            <div class="voice__dur">${esc(e.voice.duration)} · ${t('archive recording', 'архивски снимак')}</div>
          </div>
        </div>
        <div class="wave" aria-hidden="true">${WAVE.map(h => `<i style="height:${h}px"></i>`).join('')}</div>
        <p class="voice__transcript">“${esc(e.voice.transcript)}”</p>
      </div>` : '';

    const capsule = e.capsule ? `
      <h3>${t('Time capsule', 'Временска капсула')}</h3>
      <div class="capsule">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a4 4 0 0 1 8 0v2M12 13v3"/>
        </svg>
        <div>
          <div class="capsule__label">${esc(t(e.capsule.label, e.capsule.labelSr))}</div>
          <div class="capsule__date">${t('Sealed until', 'Запечаћено до')} ${longDate(parseDate(e.capsule.unlocks))}</div>
        </div>
      </div>` : '';

    const timeline = (e.timeline || []).length ? `
      <h3>${t('Timeline', 'Временски след')}</h3>
      <ol class="tl">
        ${e.timeline.map(ev => {
          const d = parseDate(ev.date);
          return `<li class="tl__i${ev.published ? ' tl__i--pub' : ''}">
            <span class="tl__dot" aria-hidden="true"></span>
            <span class="tl__when">${longDate(d)}</span>
            <span class="tl__what">${esc(t(ev.title, ev.titleSr))}</span>
          </li>`;
        }).join('')}
      </ol>` : '';

    return `
      <div class="mp__hero">
        <div class="mp__frame${e.portrait ? ' has-portrait' : ''}">
          ${e.portrait ? `
            <img class="card__portrait" src="${esc(e.portrait)}" alt="${esc(name)}"
                 onerror="this.closest('.mp__frame').classList.remove('has-portrait');this.remove()">
            <span class="card__vignette" aria-hidden="true"></span>` : ''}
          <span class="card__halo" aria-hidden="true"></span>
          <span class="card__monogram" aria-hidden="true">${esc(e.monogram)}</span>
        </div>
        <p class="mp__demo">
          <svg class="i" aria-hidden="true"><use href="#i-shield"/></svg>
          <span>${t('Demonstration · this person is fictional',
                    'Приказ · ова особа је измишљена')}</span>
        </p>
        <h2 class="mp__name" id="mpName">${esc(name)}</h2>
        <div class="mp__name-alt">${esc(nameAlt)}</div>
        <div class="mp__years">${longDate(born)} &nbsp;·&nbsp; ${longDate(died)}</div>
        <div class="mp__places">${esc(e.bornPlace)} → ${esc(e.diedPlace)} · ${esc(t(e.role, e.roleSr))}</div>
        <p class="mp__epitaph">“${esc(t(e.epitaph, e.epitaphSr))}”</p>
      </div>

      <div class="mp__body">
        <div class="mp__stats">
          <div class="mp__stat">
            <b id="mpCandleCount">${candleCount(e).toLocaleString()}</b>
            <span>${t('candles', 'свећа')}</span>
          </div>
          <div class="mp__stat">
            <b>${e.photos.toLocaleString()}</b>
            <span>${t('photographs', 'фотографија')}</span>
          </div>
          <div class="mp__stat">
            <b>${new Date().getFullYear() - died.getFullYear()}</b>
            <span>${t('years remembered', 'година помена')}</span>
          </div>
        </div>

        <h3>${t('The life', 'Животопис')}</h3>
        <p class="mp__story">${esc(t(e.story, e.storySr))}</p>

        ${voice}
        ${capsule}
        ${timeline}

        <h3>${t('Speak with', 'Разговарајте са')} ${esc(first)}</h3>
        <div class="talk" data-id="${e.id}">
          <p class="talk__note">
            <svg class="i" aria-hidden="true"><use href="#i-shield"/></svg>
            <span>${t(
              `${first} answers only from what the family and this parish wrote down. Where the record says nothing, ${first} says so. Nothing is invented on ${first}'s behalf.`,
              `${first} одговара само из онога што су породица и ова парохија записале. Где запис ћути, то и каже. Ништа овде није измишљено уместо ње.`
            )}</span>
          </p>

          <div class="talk__thread" id="talkThread" aria-live="polite"></div>
          <div class="talk__chips" id="talkChips"></div>

          <form class="talk__form" id="talkForm">
            <label class="sr-only" for="talkInput">${t('Ask a question', 'Поставите питање')}</label>
            <input type="text" id="talkInput" autocomplete="off"
                   placeholder="${t('Ask ' + first + ' something…', 'Питајте нешто…')}">
            <button class="btn btn--gold btn--sm" type="submit" aria-label="${t('Ask', 'Питај')}">
              <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>
            </button>
          </form>
        </div>

        <h3>${t('This page on Saylavy', 'Ова страница на Saylavy')}</h3>
        <div class="sy">
          <div class="sy__top">
            <a class="sy__mark" href="https://saylavy.com/" target="_blank" rel="noopener">Saylavy</a>
            <span class="sy__state">
              <svg class="i" aria-hidden="true"><use href="#i-shield"/></svg>
              ${t('Anchored', 'Усидрено')}
            </span>
          </div>

          <dl class="sy__rows">
            <div><dt>${t('Page', 'Страница')}</dt><dd><code>${esc(e.saylavyId)}</code></dd></div>
            <div><dt>${t('Anchor', 'Сидро')}</dt><dd><code>${esc(e.anchor)}</code></dd></div>
            <div><dt>${t('Held by', 'Држи је')}</dt><dd>${esc(t(e.heldBy, e.heldBySr))}</dd></div>
            <div><dt>${t('Terms', 'Услови')}</dt>
              <dd>${t('Bought once · no subscription', 'Плаћено једном · без претплате')}</dd></div>
          </dl>

          <p class="sy__note">${t(
            'The family owns this page. Saylavy hosts and anchors it, so it cannot be altered. The parish keeps it on the wall and reads the name aloud.',
            'Породица је власник ове странице. Saylavy је чува и усидрава, тако да се не може изменити. Парохија је држи на зиду и чита име наглас.')}</p>

          <a class="btn btn--gold btn--block sy__cta" href="${SAYLAVY_SIGNIN}">
            <svg class="i" aria-hidden="true"><use href="#i-page"/></svg>
            <span>${t('Open a page like this on Saylavy',
                      'Отворите овакву страницу на Saylavy')}</span>
            <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>
          </a>
          <p class="sy__signin">${t('Takes you to the Saylavy sign-in.',
                                    'Води вас на пријаву на Saylavy.')}</p>
        </div>

        <div class="mp__actions">
          <button class="btn btn--gold" type="button" id="mpLight" data-id="${e.id}">
            ${t('Light a candle', 'Упали свећу')}
          </button>
          <a class="btn btn--ghost" href="#parastos" id="mpParastos">
            ${t('Request a Parastos', 'Затражи парастос')}
          </a>
        </div>

        <div class="mp__share">
          <button class="btn btn--ghost btn--sm" type="button" id="mpShare" data-id="${e.id}">
            <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>
            <span>${t('Copy link', 'Копирај везу')}</span>
          </button>
          <button class="btn btn--ghost btn--sm" type="button" id="mpQr" aria-expanded="false">
            <svg class="i" aria-hidden="true"><use href="#i-map"/></svg>
            <span>${t('QR code', 'QR код')}</span>
          </button>
          <span class="mp__share-note" id="mpShareNote"></span>
        </div>

        <figure class="mp__qr" id="mpQrPanel">
          <img src="assets/qr/${esc(e.id)}.svg" alt="${t('QR code opening this Memory Page', 'QR код који отвара ову спомен-страницу')}" width="132" height="132">
          <figcaption><span>${t('For a forty-day notice, or a grave', 'За помен на четрдесет дана, или за гроб')}</span></figcaption>
        </figure>
      </div>`;
  }

  /* ====================================================== Speak with them
     A memorial that holds a voice ought to answer when spoken to. This one
     answers only out of that person's own record: the life their family wrote,
     the recording they left, the lines they were known for. When a question
     falls outside it, it says so rather than inventing a person.

     Deliberately no language model. Not because one would not write prettier
     sentences, but because a model asked about a dead man will always produce
     something, and a memorial that quietly makes things up is worse than one
     that admits the record is short.
     ====================================================================== */

  /* Each intent has two kinds of keyword. `strong` are the topic itself, and
     `weak` are the ways people wrap a question around a topic. A strong match
     always beats a weak one, whatever the lengths: "tell me about the church"
     is about the church, not about telling. */
  const INTENTS = [
    { key: 'greeting',
      strong: [],
      weak: ['hello', 'hi ', 'hey', 'good morning', 'good evening',
             'здраво', 'добар дан', 'помаже бог', 'добро вече'] },

    { key: 'home',
      strong: ['born', 'home', 'village', 'town', 'city', 'serbia', 'country', 'grow up',
               'одакле', 'рођен', 'рођена', 'кућа', 'село', 'град', 'србиј'],
      weak: ['where', 'from', 'come', 'came', 'arrive', 'leave', 'left',
             'где', 'дош', 'стиг', 'отиш'] },

    { key: 'work',
      strong: ['work', 'job', 'trade', 'occupation', 'profession', 'kitchen', 'cook',
               'brick', 'build', 'choir', 'sing', 'teach', 'taught', 'books', 'treasurer',
               'bell', 'epistle', 'stairs',
               // Stems, so радио / радила / радили / радите all land here.
               'посао', 'ради', 'занат', 'кухињ', 'кувал', 'зида', 'хор',
               'пева', 'предава', 'књиг', 'звон'],
      weak: ['do for', 'did you do', 'do here', 'do you do', 'living'] },

    { key: 'church',
      strong: ['church', 'god', 'faith', 'pray', 'believe', 'liturgy', 'parish', 'religion',
               'icon', 'saint', 'priest', 'slava',
               'цркв', 'бог', 'вер', 'молитв', 'литургиј', 'парохиј', 'икон', 'свештеник'],
      weak: [] },

    { key: 'hardest',
      strong: ['hard', 'hardest', 'difficult', 'worst', 'struggle', 'suffer', 'winter',
               'war', 'lonely', 'afraid', 'regret',
               'тешк', 'најтеж', 'зим', 'рат', 'страх', 'жао'],
      weak: ['miss', 'alone', 'sad', 'недостај', 'туг'] },

    { key: 'advice',
      strong: ['advice', 'advise', 'wisdom', 'lesson',
               'савет', 'порук', 'мудрост'],
      weak: ['tell me', 'tell us', 'would you tell', 'tell you', 'teach me', 'learn',
             'message', 'remember', 'should i', 'leave us', 'say to',
             'научи', 'запамт', 'да кажеш'] }
  ];

  function findIntent(question) {
    const q = ' ' + question.toLowerCase().trim() + ' ';
    const best = { strong: [null, 0], weak: [null, 0] };

    for (const intent of INTENTS) {
      for (const tier of ['strong', 'weak']) {
        for (const word of intent[tier]) {
          if (q.includes(word) && word.length > best[tier][1]) {
            best[tier] = [intent.key, word.length];
          }
        }
      }
    }
    return best.strong[0] || best.weak[0];
  }

  function speakLine(entry, key) {
    const s = entry.speaks || {};
    return t(s[key], s[key + 'Sr']) || null;
  }

  /* Answers assembled from fields rather than written twice. */
  function answerFor(entry, question) {
    const q = question.toLowerCase();
    const born = parseDate(entry.born), died = parseDate(entry.died);
    const has = w => q.includes(w);

    // Their own recording, quoted rather than paraphrased.
    if (entry.voice && (has('voice') || has('recording') || has('hear') || has('sound') ||
                        has('глас') || has('снимак') || has('чути'))) {
      return t(
        `There is a recording of me, ${entry.voice.title.toLowerCase()}. On it I say: “${entry.voice.transcript}”`,
        `Постоји снимак, ${entry.voice.titleSr.toLowerCase()}. На њему кажем: „${entry.voice.transcript}”`);
    }

    if (entry.capsule && (has('letter') || has('capsule') || has('sealed') || has('grandchild') ||
                          has('писм') || has('капсул') || has('запечаћ') || has('унуц'))) {
      return t(
        `I left something sealed: ${entry.capsule.label.toLowerCase()}. It opens on ${longDate(parseDate(entry.capsule.unlocks))}, and not before. Not even for you.`,
        `Оставила сам нешто запечаћено: ${entry.capsule.labelSr.toLowerCase()}. Отвара се ${longDate(parseDate(entry.capsule.unlocks))}, и не пре тога.`);
    }

    if (has('candle') || has('свећ')) {
      return t(
        `${candleCount(entry)} candles have been lit for me. I never counted anything except plates, but thank you.`,
        `За мене је упаљено ${candleCount(entry)} свећа. Никада ништа нисам бројала осим тањира, али хвала.`);
    }

    if (has('who are you') || has('your name') || has('ко си') || has('како се зовеш')) {
      return t(
        `${entry.name}. ${entry.role}. Born in ${entry.bornPlace}, and I died in ${entry.diedPlace}.`,
        `${entry.nameSr}. ${entry.roleSr}. Рођена у ${entry.bornPlace}, а умрла у ${entry.diedPlace}.`);
    }

    if (has('when') || has('age') || has('old were') || has('die') || has('died') ||
        has('када') || has('колико') || has('годин') || has('умро') || has('умрла')) {
      return t(
        `I was born on ${longDate(born)} and I reposed on ${longDate(died)}. That is ${died.getFullYear() - born.getFullYear()} years, which sounds longer than it felt.`,
        `Рођена сам ${longDate(born)}, а упокојила се ${longDate(died)}. То је ${died.getFullYear() - born.getFullYear()} година, што звучи дуже него што је било.`);
    }

    const intent = findIntent(question);
    if (intent) {
      const line = speakLine(entry, intent);
      if (line) return line;
    }

    // The honest end of the road.
    return t(
      `That is not in what was written down for me, and I will not invent it. Ask me about where I came from, what I did, this church, or what I would tell you.`,
      `То није у ономе што је за мене записано, и нећу то измишљати. Питајте ме одакле сам, шта сам радила, о овој цркви, или шта бих вам рекла.`);
  }

  const CHIPS = [
    ['Where did you come from?', 'Одакле сте?', 'home'],
    ['What did you do here?', 'Шта сте радили овде?', 'work'],
    ['What was hardest?', 'Шта је било најтеже?', 'hardest'],
    ['What would you tell us?', 'Шта бисте нам рекли?', 'advice']
  ];

  function talkSay(who, text, opts = {}) {
    const thread = $('#talkThread');
    if (!thread) return;
    const row = document.createElement('div');
    row.className = 'msg msg--' + who;
    if (who === 'them') {
      row.innerHTML = `<span class="msg__body"></span>
        <button class="listen listen--tiny" type="button" data-kind="say"
                data-text="${esc(text)}" aria-label="${t('Read this aloud', 'Прочитај наглас')}"></button>`;
    } else {
      row.innerHTML = `<span class="msg__body"></span>`;
    }
    thread.appendChild(row);
    const body = $('.msg__body', row);
    const btn = $('.listen', row);
    if (btn) labelListen(btn);

    if (who === 'you' || reduced || opts.instant) {
      body.textContent = text;
      thread.scrollTop = thread.scrollHeight;
      return;
    }

    // Typed out, because a wall of text appearing at once reads as a lookup
    // and this should read as somebody answering.
    let i = 0;
    row.classList.add('is-typing');
    const tick = () => {
      body.textContent = text.slice(0, i);
      thread.scrollTop = thread.scrollHeight;
      if (i++ < text.length) {
        setTimeout(tick, text[i] === ' ' ? 8 : 14);
      } else {
        row.classList.remove('is-typing');
      }
    };
    tick();
  }

  function initTalk(entry) {
    const chips = $('#talkChips');
    if (!chips) return;

    chips.innerHTML = CHIPS.map(([en, sr]) =>
      `<button class="chip" type="button">${esc(t(en, sr))}</button>`).join('');

    const greeting = speakLine(entry, 'greeting');
    if (greeting) talkSay('them', greeting, { instant: true });

    const ask = question => {
      const text = question.trim();
      if (!text) return;
      talkSay('you', text);
      setTimeout(() => talkSay('them', answerFor(entry, text)), 380);
    };

    chips.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (chip) ask(chip.textContent);
    });

    $('#talkForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = $('#talkInput');
      ask(input.value);
      input.value = '';
    });
  }

  /* The hash is the address of a person. #milica-p opens her page, so a family
     can send a link to their own grandmother, and Back closes the panel
     instead of leaving the site. Section anchors like #wall are left alone. */
  let hashLock = false;

  function setHash(value) {
    hashLock = true;
    if (value) history.pushState(null, '', '#' + value);
    else history.pushState(null, '', location.pathname + location.search);
    setTimeout(() => { hashLock = false; }, 0);
  }

  function syncFromHash() {
    if (hashLock) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const entry = entries.find(e => e.id === id);
    if (entry) {
      if (openId !== id) openMemoryPage(id, false, true);
    } else if (openId) {
      closeMemoryPage(true);
    }
  }

  addEventListener('hashchange', syncFromHash);
  addEventListener('popstate', syncFromHash);

  function openMemoryPage(id, keepScroll = false, fromHash = false) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    if (!keepScroll && !fromHash) setHash(id);
    if (!keepScroll) lastFocused = document.activeElement;
    const y = keepScroll ? mpPanel.scrollTop : 0;

    openId = id;
    mp.dataset.person = id;          // inspectable from the DOM
    mpContent.innerHTML = memoryPageHTML(entry);
    mp.hidden = false;
    requestAnimationFrame(() => mp.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    mpPanel.scrollTop = y;
    if (!keepScroll) $('#mpClose').focus();

    // Play button drives the waveform; no audio ships with the demo.
    const play  = $('#voicePlay');
    const block = $('#voiceBlock');
    if (play && block) {
      play.addEventListener('click', () => {
        const playing = block.classList.toggle('is-playing');
        play.setAttribute('aria-label', playing
          ? t('Pause the recording', 'Заустави снимак')
          : t('Play the recording', 'Пусти снимак'));
        play.innerHTML = playing
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      });
    }

    $('#mpLight')?.addEventListener('click', () => {
      const perSoul = localCandles();
      perSoul[entry.id] = (perSoul[entry.id] || 0) + 1;
      store.set('candlesPerSoul', perSoul);
      addCandle(t(entry.name, entry.nameSr), '');
      $('#mpCandleCount').textContent = candleCount(entry).toLocaleString();
      renderWall();
      renderStats();
    });

    initTalk(entry);

    $('#mpQr')?.addEventListener('click', ev => {
      const panel = $('#mpQrPanel');
      const shown = panel.classList.toggle('is-shown');
      ev.currentTarget.setAttribute('aria-expanded', String(shown));
    });

    $('#mpShare')?.addEventListener('click', async () => {
      const url = location.origin + location.pathname + location.search + '#' + entry.id;
      const note = $('#mpShareNote');
      try {
        await navigator.clipboard.writeText(url);
        note.textContent = t('Copied', 'Копирано');
      } catch {
        // Clipboard is blocked on insecure origins and in some browsers.
        note.textContent = url;
      }
      setTimeout(() => { if (note) note.textContent = ''; }, 4000);
    });

    $('#mpParastos')?.addEventListener('click', () => {
      const field = $('#pName');
      if (field) field.value = t(entry.name, entry.nameSr);
      if (entry.died) $('#pRepose').value = entry.died;
      // The anchor sets its own hash, so this must not push one of its own.
      closeMemoryPage(true);
    });
  }

  function closeMemoryPage(fromHash = false) {
    // Only clear the hash if it is still pointing at this person, so a click
    // on a section link that closes the panel keeps its own destination.
    if (!fromHash && location.hash.slice(1) === openId) setHash('');
    openId = null;
    mp.classList.remove('is-open');
    document.body.style.overflow = '';
    const done = () => { mp.hidden = true; mpContent.innerHTML = ''; };
    reduced ? done() : setTimeout(done, 480);
    lastFocused?.focus();
  }

  // Wrapped, because passing the function directly hands the click event in as
  // `fromHash`, which is truthy, and the address would never be cleared.
  $('#mpClose').addEventListener('click', () => closeMemoryPage());
  $('#mpScrim').addEventListener('click', () => closeMemoryPage());

  // Keep tabbing inside the open panel.
  mp.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || mp.hidden) return;
    const focusables = $$('button, a[href], input, select, textarea', mpPanel)
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------------------------------------------------------- Candle stand */
  const candleRow  = $('#candleRow');
  const candleForm = $('#candleForm');

  function addCandle(forName, fromName) {
    const list = store.get('candles', []);
    list.unshift({ for: forName.slice(0, 40), from: (fromName || '').slice(0, 40), at: Date.now() });
    store.set('candles', list.slice(0, 40));
    renderCandles();
  }

  function renderCandles() {
    const list = store.get('candles', []);
    if (!list.length) {
      candleRow.innerHTML = `<p class="candles__empty">${
        t('No candles are lit yet. Let yours be the first.',
          'Још нема упаљених свећа. Нека ваша буде прва.')}</p>`;
      return;
    }
    candleRow.innerHTML = list.slice(0, 24).map((c, i) => `
      <div class="candle" style="animation-delay:${Math.min(i * 40, 600)}ms">
        <span class="candle__flame" style="animation-delay:${(i % 7) * 0.3}s"></span>
        <span class="candle__body"></span>
        <span class="candle__for">${t('for', 'за')}</span>
        <span class="candle__name">${esc(c.for)}</span>
      </div>`).join('');
  }

  candleForm.addEventListener('submit', e => {
    e.preventDefault();
    const forName = $('#candleFor').value.trim();
    if (!forName) return;
    addCandle(forName, $('#candleFrom').value.trim());
    $('#candleFor').value = '';
    candleRow.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  renderCandles();

  /* -------------------------------------------------- Remembrance reckoner
     Orthodox reckoning counts the day of repose itself as the first day, so
     the third day falls two days after, and the fortieth thirty-nine after. */
  const reposeInput = $('#reposeDate');
  const reckonOut   = $('#reckonOut');

  const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  };
  const addMonths = (date, n) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  };

  function reckon() {
    const value = reposeInput.value;
    if (!value) { reckonOut.innerHTML = ''; return; }
    const repose = parseDate(value);

    const rows = [
      { en: 'Third day',   sr: 'Трећи дан',       date: addDays(repose, 2) },
      { en: 'Ninth day',   sr: 'Девети дан',      date: addDays(repose, 8) },
      { en: 'Fortieth day', sr: 'Четрдесети дан', date: addDays(repose, 39) },
      { en: 'Six months',  sr: 'Шест месеци',     date: addMonths(repose, 6) },
      { en: 'One year',    sr: 'Годишњица',       date: addMonths(repose, 12) }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextIndex = rows.findIndex(r => r.date >= today);

    reckonOut.innerHTML = rows.map((r, i) => {
      const past = r.date < today;
      const cls = past ? 'rk rk--past' : (i === nextIndex ? 'rk rk--next' : 'rk');
      const tag = i === nextIndex && !past
        ? `<span class="rk__tag">${t('next', 'следећи')}</span>` : '';
      return `<div class="${cls}">
                <b>${t(r.en, r.sr)}${tag}</b>
                <span>${longDate(r.date)}</span>
              </div>`;
    }).join('');
  }

  reposeInput.addEventListener('change', reckon);
  reposeInput.addEventListener('input', reckon);

  /* ------------------------------------------------------- Parastos request */
  const parastosForm = $('#parastosForm');
  const parastosStatus = $('#parastosStatus');

  parastosForm.addEventListener('submit', e => {
    e.preventDefault();
    const required = [
      [$('#pName'),    t('the name of the departed', 'име упокојеног')],
      [$('#pYou'),     t('your name', 'ваше име')],
      [$('#pContact'), t('a phone number or email', 'телефон или е-пошту')]
    ];
    const missing = required.filter(([field]) => !field.value.trim());

    if (missing.length) {
      parastosStatus.textContent = t(
        'Please add ' + missing.map(([, label]) => label).join(', ') + '.',
        'Молимо унесите ' + missing.map(([, label]) => label).join(', ') + '.'
      );
      missing[0][0].focus();
      return;
    }

    const name = $('#pName').value.trim();
    parastosStatus.textContent = t(
      `Thank you. In a live installation this request for ${name} would now be with the parish office, and Father Đurađ would confirm the date with you.`,
      `Хвала вам. У правој постави, ова молба за ${name} била би сада у канцеларији парохије, а отац Ђурађ би вам потврдио датум.`
    );
    parastosForm.reset();
  });

  /* ============================================================ Voices
     Prayers the parish knows by heart, and the three icons on the iconostasis.

     There are no audio files. The reading is done by the browser's own speech
     synthesis, which means it works offline and costs nothing, and it means the
     voice is synthetic. The page says so rather than implying a choir. When a
     Serbian voice is not installed we read the English instead, because a
     Serbian text read by an English voice is worse than useless.
     ============================================================ */

  const PRAYERS = [
    {
      title: 'Оче наш', en: 'The Lord’s Prayer',
      use: 'At every service, and at every table',
      useSr: 'На свакој служби, и пред сваким оброком',
      cyr: 'Оче наш, који си на небесима, да се свети име Твоје; да дође царство Твоје; да буде воља Твоја и на земљи као на небу. Хлеб наш потребни дај нам данас; и опрости нам дугове наше као што и ми опраштамо дужницима својим; и не уведи нас у искушење, но избави нас од злога.',
      lat: 'Oče naš, koji si na nebesima, da se sveti ime Tvoje; da dođe carstvo Tvoje; da bude volja Tvoja i na zemlji kao na nebu. Hleb naš potrebni daj nam danas; i oprosti nam dugove naše kao što i mi opraštamo dužnicima svojim; i ne uvedi nas u iskušenje, no izbavi nas od zloga.',
      eng: 'Our Father, who art in heaven, hallowed be Thy name. Thy kingdom come, Thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our debts as we forgive our debtors, and lead us not into temptation, but deliver us from the evil one.'
    },
    {
      title: 'Трисвето', en: 'The Trisagion',
      use: 'Sung three times. Usually the first thing a child learns',
      useSr: 'Пева се три пута. Обично прво што дете научи',
      cyr: 'Свети Боже, Свети Крепки, Свети Бесмртни, помилуј нас.',
      lat: 'Sveti Bože, Sveti Krepki, Sveti Besmrtni, pomiluj nas.',
      eng: 'Holy God, Holy Mighty, Holy Immortal, have mercy on us.'
    },
    {
      title: 'Царе небески', en: 'O Heavenly King',
      use: 'The prayer that opens almost everything',
      useSr: 'Молитва којом почиње готово све',
      cyr: 'Царе небески, Утешитељу, Духе истине, који си свуда и све испуњаваш, Источниче добара и Даваоче живота, дођи и усели се у нас, и очисти нас од сваке нечистоте, и спаси, Благи, душе наше.',
      lat: 'Care nebeski, Utešitelju, Duše istine, koji si svuda i sve ispunjavaš, Istočniče dobara i Davaoče života, dođi i useli se u nas, i očisti nas od svake nečistote, i spasi, Blagi, duše naše.',
      eng: 'O Heavenly King, Comforter, Spirit of Truth, who art everywhere present and fillest all things, Treasury of good things and Giver of life: come and dwell in us, cleanse us from every impurity, and save our souls, O Good One.'
    },
    {
      title: 'Богородице Дјево', en: 'Rejoice, O Virgin Theotokos',
      use: 'Said before the icon of the Mother of God',
      useSr: 'Чита се пред иконом Пресвете Богородице',
      cyr: 'Богородице Дјево, радуј се, благодатна Маријо, Господ је с тобом. Благословена си ти међу женама и благословен је плод утробе твоје, јер си родила Христа, Спаса и Избавитеља душа наших.',
      lat: 'Bogorodice Djevo, raduj se, blagodatna Marijo, Gospod je s tobom. Blagoslovena si ti među ženama i blagosloven je plod utrobe tvoje, jer si rodila Hrista, Spasa i Izbavitelja duša naših.',
      eng: 'Rejoice, O Virgin Theotokos, Mary full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, for thou hast borne Christ, the Saviour and Deliverer of our souls.'
    },
    {
      title: 'Са светима покој', en: 'With the saints give rest',
      use: 'The heart of the memorial service. This is the one that is sung for the departed',
      useSr: 'Срце заупокојене службе. Ово је оно што се пева за упокојене',
      cyr: 'Са светима покој, Христе, душама слуга Твојих, где нема болести, ни туге, ни уздисања, него живот бесконачни.',
      lat: 'Sa svetima pokoj, Hriste, dušama sluga Tvojih, gde nema bolesti, ni tuge, ni uzdisanja, nego život beskonačni.',
      eng: 'With the saints give rest, O Christ, to the souls of Thy servants, where there is neither sickness, nor sorrow, nor sighing, but life everlasting.'
    },
    {
      title: 'Вечан спомен', en: 'Memory eternal',
      use: 'Sung three times, standing, at the very end of a Parastos. The parish is named for this',
      useSr: 'Пева се три пута, стојећи, на самом крају парастоса. По овоме је и овај спомен назван',
      cyr: 'Вечан спомен. Вечан спомен. Вечан спомен.',
      lat: 'Večan spomen. Večan spomen. Večan spomen.',
      eng: 'Memory eternal. Memory eternal. Memory eternal.'
    }
  ];

  const ICONS = [
    {
      img: 'assets/icon-theotokos.webp',
      alt: 'The icon of the Mother of God enthroned with the Christ Child, painted on a gold ground',
      name: 'Богородица',
      en: 'The Mother of God',
      feast: 'Dormition, 28 August',
      feastSr: 'Успење Пресвете Богородице, 28. август',
      read: 'Look beside her head for the letters <b>МР ΘΥ</b>. It is Greek, shortened, for Mother of God, and it is painted on every icon of her anywhere in the world. There are three stars on her veil, at the forehead and on both shoulders. Her right hand is not raised to draw attention to herself. It points at the Child.',
      readSr: 'Погледајте поред њене главе слова <b>МР ΘΥ</b>. То је грчки, скраћено, за Мајку Божју, и то се пише на свакој њеној икони на свету. На њеном покривалу су три звезде – на челу и на оба рамена. Њена десна рука не показује на себе. Показује на Дете.'
    },
    {
      img: 'assets/icon-christ.webp',
      alt: 'The icon of Christ, blessing with his right hand and holding the Gospel book in his left',
      name: 'Господ Исус Христос',
      en: 'Christ, holding the Gospel',
      feast: 'Every Liturgy',
      feastSr: 'Свака Литургија',
      read: 'His halo has a cross inside it, and in the three arms you can see the letters <b>Ο Ω Ν</b> – <b>He Who Is</b>, the name God gave Moses out of the burning bush. It is written on no one else. The right hand blesses; the left holds the Gospel, bound in red. <b>ІС ХС</b> is simply Jesus Christ, the first and last letter of each word.',
      readSr: 'У његовом нимбу је крст, а у три његова крака виде се слова <b>Ο Ω Ν</b> – <b>Онај који јесте</b>, име које је Бог дао Мојсију из горућег грма. Ни на коме другом се то не пише. Десница благосиља, а левица држи Еванђеље, укоричено у црвено. <b>ІС ХС</b> је само Исус Христос, прво и последње слово сваке речи.'
    },
    {
      img: 'assets/angel.webp',
      emblem: true,
      alt: 'The parish emblem of St. Archangel Gabriel, a winged figure drawn in gold line',
      name: 'Свети арханђел Гаврило',
      en: 'St. Archangel Gabriel, the patron of this parish',
      feast: 'Synaxis of the Archangel Gabriel, 26 July – confirm the parish feast with the office',
      feastSr: 'Сабор светог арханђела Гаврила, 26. јул – потврдите датум славе у канцеларији',
      read: 'The parish carries his name. Of all the angels he is the one who is sent to <b>speak</b>: to Zechariah standing in the temple, and to a girl in Nazareth. That is why he is given a staff, and wings – not because angels need them, but because a messenger has somewhere to be.',
      readSr: 'Парохија носи његово име. Од свих анђела он је онај који је послат да <b>говори</b>: Захарији у храму, и девојци у Назарету. Зато му дају жезло и крила – не зато што су анђелима потребна, него зато што весник има куда да иде.'
    }
  ];

  /* ---------------------------------------------------------- Speech engine */
  const synth = window.speechSynthesis;
  let speechVoice = null;   // a Serbian or near-Serbian voice, if one exists
  let speakingBtn = null;

  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    // Serbian first, then the languages whose phonetics are close enough to be
    // worth hearing, and never an English voice reading Cyrillic.
    for (const code of ['sr', 'hr', 'bs', 'mk', 'sl', 'ru', 'bg', 'uk']) {
      const v = voices.find(x => (x.lang || '').toLowerCase().replace('_', '-').startsWith(code));
      if (v) return v;
    }
    return null;
  }

  function speechReady() {
    speechVoice = pickVoice();
    const notice = $('#speechNotice');
    if (!notice) return;

    const icon = '<svg class="i" aria-hidden="true"><use href="#i-mic"/></svg>';
    if (!synth) {
      notice.innerHTML = icon + '<span>' + t(
        'This browser cannot read the prayers aloud. The texts are all below.',
        'Овај прегледач не може да чита молитве наглас. Сви текстови су испод.') + '</span>';
    } else if (speechVoice) {
      notice.innerHTML = icon + '<span>' + t(
        `Read aloud by a synthesised voice (${speechVoice.name}), not by the parish choir. Recordings from the choir replace it when they are made.`,
        `Чита синтетички глас (${speechVoice.name}), не парохијски хор. Снимци хора ће га заменити када буду направљени.`) + '</span>';
    } else {
      notice.innerHTML = icon + '<span>' + t(
        'No Serbian voice is installed on this device, so the listen buttons read the English translation. The Serbian text is still below, in both alphabets.',
        'На овом уређају нема српског гласа, па дугмад читају енглески превод. Српски текст је и даље испод, у оба писма.') + '</span>';
    }
    // Reflect the language the buttons will actually speak.
    $$('.listen').forEach(b => { if (b.dataset.kind === 'prayer') labelListen(b); });
  }

  if (synth) {
    synth.addEventListener?.('voiceschanged', speechReady);
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = speechReady;
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
    if (speakingBtn) {
      speakingBtn.classList.remove('is-speaking');
      labelListen(speakingBtn);
      speakingBtn = null;
    }
  }

  function labelListen(btn) {
    const stop = btn.classList.contains('is-speaking');
    const eq = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';
    const mic = '<svg class="i" aria-hidden="true"><use href="#i-mic"/></svg>';
    let word;
    if (stop) word = t('Stop', 'Стани');
    else if (btn.dataset.kind === 'prayer' && !speechVoice) word = t('In English', 'На енглеском');
    else word = t('Listen', 'Слушај');
    btn.innerHTML = (stop ? eq : mic) + '<span>' + word + '</span>';
  }

  function speak(text, btn, forceLang) {
    if (!synth) return;
    const wasSame = speakingBtn === btn;
    stopSpeaking();
    if (wasSame) return;                 // pressing it again just stops

    const u = new SpeechSynthesisUtterance(text);
    if (forceLang === 'en' || !speechVoice) {
      u.lang = 'en-GB';
    } else {
      u.voice = speechVoice;
      u.lang = speechVoice.lang;
    }
    u.rate = 0.82;                       // prayers are not read at speaking pace
    u.pitch = 0.95;

    speakingBtn = btn;
    btn.classList.add('is-speaking');
    labelListen(btn);

    u.onend = u.onerror = () => {
      if (speakingBtn === btn) {
        btn.classList.remove('is-speaking');
        labelListen(btn);
        speakingBtn = null;
      }
    };
    synth.speak(u);
  }

  // Stop the voice if the reader leaves or navigates away mid-prayer.
  addEventListener('pagehide', stopSpeaking);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeaking(); });

  /* ------------------------------------------------------------ Rendering */
  function renderPrayers() {
    const list = $('#prayerList');
    if (!list) return;
    const open = new Set($$('.pr.is-open', list).map(el => el.dataset.i));

    list.innerHTML = PRAYERS.map((p, i) => `
      <div class="pr${open.has(String(i)) ? ' is-open' : ''}" data-i="${i}">
        <div class="pr__row">
          <button class="pr__toggle" type="button" aria-expanded="${open.has(String(i))}"
                  aria-controls="pr-body-${i}">
            <span class="pr__n">${String(i + 1).padStart(2, '0')}</span>
            <span class="pr__title">${esc(p.title)}<em>${esc(p.en)}</em></span>
            <span class="pr__chev"><svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></span>
          </button>
          <button class="listen" type="button" data-kind="prayer" data-i="${i}"
                  aria-label="${t('Read aloud', 'Прочитај наглас')}: ${esc(p.title)}"></button>
        </div>
        <div class="pr__body" id="pr-body-${i}" ${open.has(String(i)) ? '' : 'hidden'}>
          <div class="pr__use">${esc(t(p.use, p.useSr))}</div>
          <div class="pr__cyr">${esc(p.cyr)}</div>
          <div>
            <span class="pr__label">${t('In Latin letters', 'Латиницом')}</span>
            <div class="pr__lat">${esc(p.lat)}</div>
          </div>
          <div>
            <span class="pr__label">${t('In English', 'На енглеском')}</span>
            <div class="pr__en">${esc(p.eng)}</div>
          </div>
        </div>
      </div>`).join('');

    $$('.listen', list).forEach(labelListen);
  }

  function renderIcons() {
    const list = $('#iconList');
    if (!list) return;
    list.innerHTML = ICONS.map((ic, i) => `
      <article class="ic reveal is-in">
        <figure class="ic__frame${ic.emblem ? ' ic__frame--emblem' : ''}" style="margin:0">
          <img src="${ic.img}" alt="${esc(ic.alt)}" loading="lazy" decoding="async">
        </figure>
        <div>
          <h3 class="ic__name">${esc(ic.name)}<span>${esc(ic.en)}</span></h3>
          <p class="ic__feast">${esc(t(ic.feast, ic.feastSr))}</p>
          <p class="ic__read">${t(ic.read, ic.readSr)}</p>
          <div class="ic__tools">
            <button class="listen" type="button" data-kind="icon" data-i="${i}"
                    aria-label="${t('Read aloud', 'Прочитај наглас')}: ${esc(ic.name)}"></button>
          </div>
        </div>
      </article>`).join('');

    $$('.listen', list).forEach(labelListen);
  }

  // One delegated listener covers both lists, including re-rendered markup.
  document.addEventListener('click', e => {
    const toggle = e.target.closest('.pr__toggle');
    if (toggle) {
      const pr = toggle.closest('.pr');
      const body = $('#' + toggle.getAttribute('aria-controls'));
      const nowOpen = !pr.classList.contains('is-open');
      pr.classList.toggle('is-open', nowOpen);
      toggle.setAttribute('aria-expanded', String(nowOpen));
      body.hidden = !nowOpen;
      return;
    }

    const btn = e.target.closest('.listen');
    if (!btn) return;

    // A line the memorial just spoke. It follows the page language.
    if (btn.dataset.kind === 'say') {
      const useSerbian = lang === 'sr' && speechVoice;
      speak(btn.dataset.text, btn, useSerbian ? null : 'en');
      return;
    }

    const i = +btn.dataset.i;
    if (btn.dataset.kind === 'prayer') {
      const p = PRAYERS[i];
      // With a Serbian voice, read the Serbian. Without one, read the English.
      speechVoice ? speak(p.cyr, btn) : speak(p.eng, btn, 'en');
    } else {
      const ic = ICONS[i];
      // The icon notes are prose about the icon, so they follow the page language.
      const text = t(ic.read, ic.readSr).replace(/<[^>]+>/g, '');
      const useSerbian = lang === 'sr' && speechVoice;
      speak(text, btn, useSerbian ? null : 'en');
    }
  });

  /* ------------------------------------------- A candle with photographic proof
     Choose what gets lit, and the track shows what comes back. The Liturgy date
     is the coming Sunday, computed rather than written down. */
  const proofForm = $('#proofForm');
  const cfTotal   = $('#cfTotal');

  function nextSunday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Sunday is 0; if today is Sunday the candle goes on next week's Liturgy.
    d.setDate(d.getDate() + ((7 - d.getDay()) || 7));
    return d;
  }

  function chosenCandle() {
    return $('input[name="ctype"]:checked', proofForm);
  }

  function renderProof() {
    const pick = chosenCandle();
    const price = +pick.dataset.price;
    const days = +pick.dataset.days;
    cfTotal.textContent = '$' + price;

    const sunday = nextSunday();
    $('#trackWhen').textContent = days > 1
      ? t(`From ${longDate(sunday)}, for forty days`,
          `Од ${longDate(sunday)}, четрдесет дана`)
      : longDate(sunday);
  }

  $$('input[name="ctype"]', proofForm).forEach(r => r.addEventListener('change', renderProof));

  proofForm.addEventListener('submit', e => {
    e.preventDefault();
    const forWhom = $('#cfFor').value.trim();
    const email   = $('#cfEmail').value.trim();
    const status  = $('#proofStatus');

    if (!forWhom) {
      status.textContent = t('Please add a name for the candle.', 'Молимо унесите име за свећу.');
      $('#cfFor').focus();
      return;
    }
    // Good enough for a demo, and it catches the mistakes people actually make.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      status.textContent = t('Please add an address the photograph can go to.',
                             'Молимо унесите адресу на коју да пошаљемо фотографију.');
      $('#cfEmail').focus();
      return;
    }

    // Walk the track forward so the flow is legible.
    const steps = $$('.track__i', $('#proofTrack'));
    steps.forEach((li, i) => {
      li.classList.toggle('is-done', i === 0);
      li.classList.toggle('is-now', i === 1);
    });

    const intent = $('#cfIntent').value === 'health'
      ? t('for the health of', 'за здравље')
      : t('for the repose of', 'за упокојење');

    status.textContent = t(
      `Thank you. A candle ${intent} ${forWhom} would be lit at the Liturgy on ` +
      `${longDate(nextSunday())}, photographed on the stand, and the picture sent to ${email}.`,
      `Хвала вам. Свећа ${intent} ${forWhom} била би упаљена на Литургији ` +
      `${longDate(nextSunday())}, фотографисана на свећњаку, а слика послата на ${email}.`
    );

    // Light one on the on-screen stand too, so the two halves agree.
    addCandle(forWhom, '');
    proofForm.reset();
    renderProof();
  });

  renderProof();

  /* --------------------------------------------- The Little Chronicler deck
     Twelve oral-history prompts a child takes to an older parishioner. Which
     ones have been asked is kept in the browser so a child can come back to
     the list over several weeks. */
  const QUESTIONS = [
    { en: 'Where were you born, and what was the house like?',
      sr: 'Где си рођен, и каква је била кућа?' },
    { en: 'What did your mother cook that nobody makes anymore?',
      sr: 'Шта је твоја мајка кувала што више нико не прави?' },
    { en: 'What did you bring with you when you came here?',
      sr: 'Шта си донео са собом када си дошао овде?' },
    { en: 'What is the first thing you remember about church?',
      sr: 'Чега се прво сећаш из цркве?' },
    { en: 'Who taught you to pray?',
      sr: 'Ко те је научио да се молиш?' },
    { en: 'What was your family’s Slava, and who used to come?',
      sr: 'Која је Слава твоје породице, и ко је долазио?' },
    { en: 'What song did your father sing?',
      sr: 'Коју је песму твој отац певао?' },
    { en: 'What was the hardest winter you remember?',
      sr: 'Које је најтеже зиме било, како се сећаш?' },
    { en: 'What did you miss most in your first year here?',
      sr: 'Шта ти је највише недостајало прве године овде?' },
    { en: 'Is there a Serbian word you never found in English?',
      sr: 'Има ли српска реч коју никада ниси нашао на енглеском?' },
    { en: 'What are you proud of that you never say out loud?',
      sr: 'На шта си поносан, а никада то не кажеш наглас?' },
    { en: 'What do you want me to tell my children about you?',
      sr: 'Шта желиш да испричам својој деци о теби?' }
  ];

  const qCard  = $('#qCard');
  const qText  = $('#qText');
  const qBar   = $('#qBar');
  const qMark  = $('#qMark');
  const qBadge = $('#qBadge');
  let qIndex = 0;

  const askedSet = () => new Set(store.get('asked', []));

  function renderQuestion(turning) {
    const asked = askedSet();
    qText.textContent = t(QUESTIONS[qIndex].en, QUESTIONS[qIndex].sr);
    $('#qNow').textContent = qIndex + 1;
    $('#qTotal').textContent = QUESTIONS.length;
    $('#qAsked').textContent = asked.size;
    qBar.style.width = (asked.size / QUESTIONS.length * 100) + '%';

    const isAsked = asked.has(qIndex);
    qMark.setAttribute('aria-pressed', String(isAsked));
    qMark.textContent = isAsked ? t('Asked', 'Постављено') : t('I asked this', 'Питао сам ово');

    $('#qPrev').disabled = qIndex === 0;
    $('#qNext').disabled = qIndex === QUESTIONS.length - 1;
    qBadge.hidden = asked.size < QUESTIONS.length;

    if (turning && !reduced) {
      qCard.classList.remove('is-turning');
      void qCard.offsetWidth;              // restart the animation
      qCard.classList.add('is-turning');
    }
  }

  /* Marking a question advances the deck on a short delay, so a tap on Next
     inside that window must not push the index past the end. Everything goes
     through goTo, which clamps, and manual navigation cancels the pending
     auto-advance. */
  let advanceTimer;

  function goTo(i) {
    const next = Math.max(0, Math.min(i, QUESTIONS.length - 1));
    if (next === qIndex) return;
    qIndex = next;
    renderQuestion(true);
  }

  $('#qPrev').addEventListener('click', () => { clearTimeout(advanceTimer); goTo(qIndex - 1); });
  $('#qNext').addEventListener('click', () => { clearTimeout(advanceTimer); goTo(qIndex + 1); });

  qMark.addEventListener('click', () => {
    const asked = askedSet();
    asked.has(qIndex) ? asked.delete(qIndex) : asked.add(qIndex);
    store.set('asked', [...asked]);
    renderQuestion(false);
    clearTimeout(advanceTimer);
    // Move along to the next question, the way a child working down a list would.
    if (asked.has(qIndex)) {
      const from = qIndex;
      advanceTimer = setTimeout(() => goTo(from + 1), 260);
    }
  });

  /* ----------------------------------------------------------- The azbuka
     Thirty letters of Serbian Cyrillic. The words lean on the vocabulary a
     child actually meets in this church. */
  const AZBUKA = [
    ['А', 'Анђео', 'angel'],          ['Б', 'Бака', 'grandmother'],
    ['В', 'Восак', 'beeswax'],        ['Г', 'Гаврило', 'Gabriel'],
    ['Д', 'Деда', 'grandfather'],     ['Ђ', 'Ђурђевдан', 'St. George’s Day'],
    ['Е', 'Еванђеље', 'the Gospel'],  ['Ж', 'Жито', 'wheat, for koljivo'],
    ['З', 'Звоно', 'bell'],           ['И', 'Икона', 'icon'],
    ['Ј', 'Јагње', 'lamb'],           ['К', 'Кољиво', 'koljivo'],
    ['Л', 'Лампада', 'vigil lamp'],   ['Љ', 'Љубав', 'love'],
    ['М', 'Мајка', 'mother'],         ['Н', 'Небо', 'heaven, sky'],
    ['Њ', 'Њива', 'field'],           ['О', 'Отац', 'father'],
    ['П', 'Причест', 'communion'],    ['Р', 'Радост', 'joy'],
    ['С', 'Свећа', 'candle'],         ['Т', 'Тамјан', 'incense'],
    ['Ћ', 'Ћирилица', 'Cyrillic'],    ['У', 'Ускрс', 'Pascha'],
    ['Ф', 'Фреска', 'fresco'],        ['Х', 'Храм', 'temple, church'],
    ['Ц', 'Црква', 'church'],         ['Ч', 'Чтец', 'reader'],
    ['Џ', 'Џем', 'jam'],              ['Ш', 'Шума', 'forest']
  ];

  const azGrid = $('#azGrid');
  azGrid.innerHTML = AZBUKA.map(([letter], i) =>
    `<button class="az" type="button" data-i="${i}" aria-pressed="${i === 0}"
             aria-label="${letter} – ${AZBUKA[i][1]}">${letter}</button>`).join('');

  azGrid.addEventListener('click', e => {
    const btn = e.target.closest('.az');
    if (!btn) return;
    const [letter, word, gloss] = AZBUKA[+btn.dataset.i];
    $('#azLetter').textContent = letter;
    $('#azWord').textContent = word;
    $('#azGloss').textContent = gloss;
    $$('.az', azGrid).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  });

  // Paint these now, so they work even if the memorial data never loads.
  renderQuestion(false);
  renderPrayers();
  renderIcons();
  speechReady();

  /* -------------------------------------------------------------- Lightbox */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let lbLast = null;

  function openLightbox(figure) {
    lbLast = document.activeElement;
    lbImg.src = figure.dataset.full;
    lbImg.alt = $('img', figure)?.alt || '';
    lbCap.textContent = figure.dataset.cap || '';
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    const done = () => { lightbox.hidden = true; lbImg.src = ''; };
    reduced ? done() : setTimeout(done, 340);
    lbLast?.focus();
  }

  $$('.shot').forEach(figure => {
    figure.addEventListener('click', () => openLightbox(figure));
    figure.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(figure); }
    });
  });

  $('#lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  /* ------------------------------------------------------------------ Keys */
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!lightbox.hidden) closeLightbox();
      else if (!mp.hidden) closeMemoryPage();
      else if (!sm.hidden) setMenu(false);
    }
    // "/" jumps to the memorial search, as long as you are not already typing.
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      $('#wallSearch').focus();
    }
  });

  /* ------------------------------------------------------------------ Year */
  $('#year').textContent = new Date().getFullYear();
})();
