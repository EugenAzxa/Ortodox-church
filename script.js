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

  /* ------------------------------------------------------------------- Nav */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const navLinks = $('#navLinks');
  /* The open menu panel slides in behind the bar and covers its background,
     so the bar has to switch to its light-on-dark colours while it is open. */
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);
    nav.classList.toggle('is-menu-open', open);
  }

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  navLinks.addEventListener('click', e => {
    if (e.target.closest('a')) setMenu(false);
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

  const years = entry => `${parseDate(entry.born).getFullYear()} — ${parseDate(entry.died).getFullYear()}`;

  const esc = str => String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

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
    })
    .catch(() => {
      $('#wallGrid').innerHTML =
        `<p style="color:var(--bone-faint);grid-column:1/-1">
           The memorial could not be loaded. If you opened this file directly, serve the folder
           over HTTP instead — <code>npx serve</code> — so that data/memorials.json can be read.
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
              aria-label="${esc(t(e.name, e.nameSr))}, ${esc(years(e))} — open the Memory Page">
        <span class="card__frame">
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
    `).join('');

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
    const card = e.target.closest('.card');
    if (card) openMemoryPage(card.dataset.id);
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

    return `
      <div class="mp__hero">
        <div class="mp__frame">
          <span class="card__halo" aria-hidden="true"></span>
          <span class="card__monogram" aria-hidden="true">${esc(e.monogram)}</span>
        </div>
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

        <h3>${t('Integrity', 'Интегритет')}</h3>
        <div class="anchor">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
          </svg>
          <span>${t('Anchored to the blockchain', 'Усидрено у ланац блокова')}</span>
          <code>${esc(e.anchor)}</code>
        </div>

        <div class="mp__actions">
          <button class="btn btn--gold" type="button" id="mpLight" data-id="${e.id}">
            ${t('Light a candle', 'Упали свећу')}
          </button>
          <a class="btn btn--ghost" href="#parastos" id="mpParastos">
            ${t('Request a Parastos', 'Затражи парастос')}
          </a>
        </div>

        <div class="mp__saylavy">
          <span class="saylavy-mark">Saylavy</span>
          <span>${t('Memory Page · one-time purchase · no subscription',
                    'Спомен-страница · једнократно · без претплате')}</span>
        </div>
      </div>`;
  }

  function openMemoryPage(id, keepScroll = false) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    if (!keepScroll) lastFocused = document.activeElement;
    const y = keepScroll ? mpPanel.scrollTop : 0;

    openId = id;
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

    $('#mpParastos')?.addEventListener('click', () => {
      const field = $('#pName');
      if (field) field.value = t(entry.name, entry.nameSr);
      if (entry.died) $('#pRepose').value = entry.died;
      closeMemoryPage();
    });
  }

  function closeMemoryPage() {
    openId = null;
    mp.classList.remove('is-open');
    document.body.style.overflow = '';
    const done = () => { mp.hidden = true; mpContent.innerHTML = ''; };
    reduced ? done() : setTimeout(done, 480);
    lastFocused?.focus();
  }

  $('#mpClose').addEventListener('click', closeMemoryPage);
  $('#mpScrim').addEventListener('click', closeMemoryPage);

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
      else if (navLinks.classList.contains('is-open')) setMenu(false);
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
