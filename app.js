(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = 'meryds_meeting_meter_v02';
  const langStore = 'meryds_meeting_meter_lang';
  const countryStore = 'meryds_meeting_meter_country';
  const copy = window.TMM_I18N;
  const countries = window.TMM_COUNTRIES;
  let language = 'ja';
  const ids = ['fullTime', 'partTime', 'participants', 'meetingType', 'meetingGoal', 'showDetails'];
  let running = false, elapsedMs = 0, accruedAmount = 0, checkpoint = 0;
  let segmentRate = 0, rafId = 0, sessionStart = null, sessionEnd = null, finished = false;
  let moneyFitKey = '';
  const count = id => Number($(id).value);
  const validCount = id => $(id).value.trim() !== '' && Number.isInteger(count(id)) && count(id) >= 0 && count(id) <= 5000;
  const singleRate = () => Number.isFinite(profile()?.rates?.all);
  const validPeople = () => singleRate() ? validCount('participants') && count('participants') > 0 : validCount('fullTime') && validCount('partTime') && count('fullTime') + count('partTime') > 0;
  const validPurpose = () => !!purposeLabels[$('meetingType').value];
  const profile = () => countries[$('country').value];
  const rateNote = t => ({us: t.rateUS, cn: t.rateChina, gb: t.rateUK, ie: t.rateIreland}[$('country').value] || t.rateProvisional);
  const disclaimer = t => ({us: t.disclaimerUS, cn: t.disclaimerChina, gb: t.disclaimerUK, ie: t.disclaimerIreland}[$('country').value] || t.disclaimer);
  const valid = () => validPeople() && validPurpose() && !!profile()?.rates;
  const values = () => ({fullTime: count('fullTime'), partTime: count('partTime'), participants: count('participants'), meetingType: $('meetingType').value, meetingGoal: $('meetingGoal').value.slice(0, 100), showDetails: $('showDetails').checked});
  const purposeLabels = {decision: '決定', share: '共有', dialogue: '対話'};
  const hourly = o => { const rates = profile()?.rates; return rates ? singleRate() ? o.participants * rates.all : o.fullTime * rates.fullTime + o.partTime * rates.partTime : 0; };
  const money = n => { const p = profile(); return p.symbol + new Intl.NumberFormat(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', {maximumFractionDigits: p.currency === 'JPY' ? 0 : 2}).format(n); };
  const clock = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':'); };
  const duration = () => elapsedMs + (running ? performance.now() - checkpoint : 0);
  const total = () => accruedAmount + (running ? segmentRate * (performance.now() - checkpoint) / 3600000 : 0);
  function applyCopy() {
    const t = copy[language];
    const put = (selector, value) => { document.querySelector(selector).textContent = value; };
    const rich = (selector, parts) => {
      const strong = document.createElement('strong'); strong.textContent = parts[1];
      document.querySelector(selector).replaceChildren(parts[0], strong, parts[2]);
    };
    document.documentElement.lang = language;
    document.title = t.title;
    document.querySelector('meta[name="description"]').content = t.description;
    document.querySelector('link[rel="manifest"]').href = language === 'ja' ? './manifest.webmanifest' : language === 'zh' ? './manifest.zh.webmanifest' : './manifest.en.webmanifest';
    document.querySelector('.lang-switch').setAttribute('aria-label', t.langLabel);
    put('.rightbrand', t.header);
    const mobile = document.createElement('span'); mobile.className = 'mobile-break'; mobile.append(document.createElement('br'));
    document.querySelector('.hero h1').replaceChildren(t.hero[0], mobile, t.hero[1], document.createElement('br'), t.hero[2]);
    rich('.hero .sub', t.heroSub);
    put('#settings h2', t.settings);
    put('label[for="country"]', t.country);
    ['jp', 'us', 'gb', 'ie', 'cn'].forEach((id, index) => { $('country').options[index].textContent = `${t.countryNames[id]} · ${countries[id].currency}`; });
    put('#countryNotice', rateNote(t));
    $('countryNotice').classList.toggle('input-error', !profile().rates);
    put('label[for="fullTime"]', t.fullTime); put('label[for="partTime"]', t.partTime);
    put('label[for="participants"]', t.participants);
    put('#inputError', t.peopleError); put('label[for="meetingType"]', t.purpose);
    const purposeOptions = $('meetingType').options;
    [t.choose, t.decision, t.share, t.dialogue].forEach((value, index) => { purposeOptions[index].textContent = value; });
    put('#purposeError', t.purposeError); put('label[for="meetingGoal"]', t.goal);
    $('meetingGoal').placeholder = t.goalPlaceholder;
    put('label[for="showDetails"]', t.showDetails); put('.eyebrow', t.eyebrow);
    put('.mini:first-child span', t.fifteen); put('.mini:nth-child(2) span', t.thirty);
    put('#outcomeSection h2', t.outcomeTitle); put('#outcomeSection > p:first-of-type', t.outcomeIntro);
    put('label[for="outcomeStatus"]', t.outcomeQuestion);
    const outcomeOptions = $('outcomeStatus').options;
    [t.choose, t.outcome.achieved, t.outcome.partial, t.outcome.none, t.outcome.unknown].forEach((value, index) => { outcomeOptions[index].textContent = value; });
    put('label[for="outcomeNote"]', t.outcomeNote); $('outcomeNote').placeholder = t.outcomePlaceholder;
    put('.result-note', t.resultNote);
    put('.essay section:first-child h2', t.essay1Title); put('.essay .question', t.essay1Question);
    put('.essay section:first-child p:last-child', t.essay1);
    put('.essay section:nth-child(2) h2', t.essay2Title); rich('.essay section:nth-child(2) p', t.essay2);
    put('.disclaimer', disclaimer(t)); put('footer span:last-child', t.footer);
    $('pause').textContent = t.action.pause; $('finish').textContent = t.action.finish;
    $('reset').textContent = t.action.reset; $('export').textContent = t.action.export;
    $('focusToggle').textContent = document.body.classList.contains('focus-mode') ? t.action.unfocus : t.action.focus;
    $('langJa').setAttribute('aria-pressed', String(language === 'ja'));
    $('langEn').setAttribute('aria-pressed', String(language === 'en'));
    $('langZh').setAttribute('aria-pressed', String(language === 'zh'));
  }
  function setLanguage(next) {
    if (!Object.hasOwn(copy, next)) return;
    language = next;
    try { localStorage.setItem(langStore, language); } catch {}
    applyCopy(); render();
  }
  function save() { if (!valid()) return; try { localStorage.setItem(store, JSON.stringify(values())); } catch {} }
  function render() {
    const t = copy[language], okay = valid(), rate = validPeople() ? hourly(values()) : 0;
    const p = profile();
    $('participants').closest('.field').hidden = !singleRate();
    $('fullTime').closest('.field').hidden = singleRate();
    $('partTime').closest('.field').hidden = singleRate();
    $('currencySymbol').textContent = p.symbol;
    $('currencyCode').textContent = p.currency;
    $('countryNotice').textContent = rateNote(t);
    document.querySelector('.disclaimer').textContent = disclaimer(t);
    $('countryNotice').classList.toggle('input-error', !p.rates);
    $('inputError').hidden = validPeople();
    for (const id of ['fullTime', 'partTime', 'participants']) $(id).setAttribute('aria-invalid', String(!validCount(id) || (singleRate() ? count('participants') === 0 : count('fullTime') + count('partTime') === 0)));
    $('meetingType').setAttribute('aria-invalid', String(!validPurpose()));
    $('purposeError').hidden = validPurpose();
    $('elapsed').textContent = clock(duration());
    $('total').textContent = new Intl.NumberFormat(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', {maximumFractionDigits: p.currency === 'JPY' ? 0 : 2}).format(total());
    $('rate').textContent = p.rates ? t.perMinute(money(rate / 60)) : t.ratePending;
    $('fifteen').textContent = p.rates ? money(rate / 4) : '—'; $('thirty').textContent = p.rates ? money(rate / 2) : '—';
    $('indicator').classList.toggle('run', running);
    $('status').textContent = finished ? t.status.finished : running ? t.status.running : duration() > 0 ? t.status.paused : t.status.ready;
    $('start').textContent = running ? t.action.running : duration() > 0 ? t.action.resume : t.action.start;
    $('start').disabled = running || finished || !okay;
    $('pause').disabled = !running;
    $('finish').disabled = !sessionStart || finished;
    $('export').disabled = duration() <= 0 || (finished && !$('outcomeStatus').value);
    $('meetingType').disabled = !!sessionStart;
    $('meetingGoal').disabled = !!sessionStart;
    $('country').disabled = !!sessionStart;
    $('outcomeSection').hidden = !finished;
    document.querySelectorAll('.mini').forEach(e => { e.style.display = $('showDetails').checked ? '' : 'none'; });
    const box = document.querySelector('.money');
    const fitKey = [box.clientWidth, $('total').textContent.length, p.currency, document.body.classList.contains('focus-mode')].join(':');
    if (fitKey !== moneyFitKey) {
      moneyFitKey = fitKey; box.style.fontSize = '';
      if (box.scrollWidth > box.clientWidth && box.clientWidth > 0) box.style.fontSize = Math.floor(parseFloat(getComputedStyle(box).fontSize) * box.clientWidth / box.scrollWidth * 0.98) + 'px';
    }
  }
  function settle() {
    if (!running) return;
    const now = performance.now(), delta = now - checkpoint;
    elapsedMs += delta; accruedAmount += segmentRate * delta / 3600000; checkpoint = now;
  }
  function tick() { render(); if (running) rafId = requestAnimationFrame(tick); }
  function start() {
    if (running || finished || !valid()) return;
    running = true; if (!sessionStart) sessionStart = new Date(); sessionEnd = null;
    segmentRate = hourly(values()); checkpoint = performance.now(); save(); tick();
  }
  function pause() { if (!running) return; settle(); running = false; cancelAnimationFrame(rafId); sessionEnd = new Date(); render(); }
  function finish() {
    if (!sessionStart || finished) return;
    pause(); finished = true; sessionEnd = new Date();
    document.body.classList.remove('focus-mode');
    $('focusToggle').textContent = copy[language].action.focus;
    render(); $('outcomeSection').scrollIntoView({behavior: 'smooth', block: 'start'});
    $('outcomeStatus').focus();
  }
  function reset() {
    pause(); elapsedMs = 0; accruedAmount = 0; sessionStart = null; sessionEnd = null; finished = false;
    $('outcomeStatus').value = ''; $('outcomeNote').value = ''; render();
  }
  function csv() {
    const o = values(), c = copy[language].csv, p = profile();
    const lines = [[c.record, c.value], [tCountry(), $('country').value], [tCurrency(), p.currency], [tRateStatus(), p.status], [tSource(), p.source || 'CE provisional assumptions'], ['Survey year', p.year || ''], ['Population', p.population || ''], [c.start, sessionStart?.toISOString() || ''], [c.end, (running ? new Date() : sessionEnd || new Date()).toISOString()], [c.purpose, c.purposeLabels[o.meetingType]], [c.goal, o.meetingGoal], [c.outcome, finished ? c.outcomeLabels[$('outcomeStatus').value] || '' : c.unfinished], [c.left, finished ? $('outcomeNote').value.slice(0, 300) : ''], ...(singleRate() ? [[copy[language].participants, o.participants]] : [[c.fullTime, o.fullTime], [c.partTime, o.partTime]]), [c.elapsed, (duration() / 1000).toFixed(1)], [c.cost, total().toFixed(p.currency === 'JPY' ? 0 : 2)], [c.formula, singleRate() ? `participants x ${p.rates.all} ${p.currency}/hour; annualMedian=${p.annualMedian || 'n/a'}; assumedAnnualHours=${p.annualHours || 'n/a'}; participant changes accrue by segment` : `full-time × ${p.rates.fullTime} ${p.currency}/hour + part-time × ${p.rates.partTime} ${p.currency}/hour; participant changes accrue by segment`]];
    function tCountry() { return copy[language].csvCountry; }
    function tCurrency() { return copy[language].csvCurrency; }
    function tRateStatus() { return copy[language].csvRateStatus; }
    function tSource() { return copy[language].csvSource; }
    const safe = x => { let s = String(x ?? ''); if (/^\s*[=+@\-]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(safe).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'time-is-money-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  try {
    language = Object.hasOwn(copy, localStorage.getItem(langStore)) ? localStorage.getItem(langStore) : 'ja';
    const storedCountry = localStorage.getItem(countryStore);
    if (Object.hasOwn(countries, storedCountry)) $('country').value = storedCountry;
    const old = JSON.parse(localStorage.getItem(store) || 'null');
    if (old && typeof old === 'object') for (const id of ids) if (Object.hasOwn(old, id)) {
      if (id === 'showDetails') $(id).checked = !!old[id]; else $(id).value = old[id];
    }
  } catch {}
  for (const id of ids) $(id).addEventListener('input', () => {
    if (running) { settle(); segmentRate = valid() ? hourly(values()) : 0; }
    save(); render();
  });
  $('start').addEventListener('click', start); $('pause').addEventListener('click', pause);
  $('finish').addEventListener('click', finish);
  $('outcomeStatus').addEventListener('change', render);
  $('reset').addEventListener('click', reset); $('export').addEventListener('click', csv);
  $('langJa').addEventListener('click', () => setLanguage('ja'));
  $('langEn').addEventListener('click', () => setLanguage('en'));
  $('langZh').addEventListener('click', () => setLanguage('zh'));
  $('country').addEventListener('change', () => { if (sessionStart) return; try { localStorage.setItem(countryStore, $('country').value); } catch {} applyCopy(); render(); });
  $('focusToggle').addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    $('focusToggle').textContent = document.body.classList.contains('focus-mode') ? copy[language].action.unfocus : copy[language].action.focus;
    render();
  });
  window.addEventListener('resize', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  applyCopy(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
