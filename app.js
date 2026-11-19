(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = 'meryds_meeting_meter_v02';
  const langStore = 'meryds_meeting_meter_lang';
  const countryStore = 'meryds_meeting_meter_country';
  const sessionStore = 'meryds_meeting_meter_session_v1';
  const copy = window.TMM_I18N;
  const countries = window.TMM_COUNTRIES;
  let language = 'ja';
  const ids = ['fullTime', 'partTime', 'participants', 'showDetails'];
  const peopleIds = ['fullTime', 'partTime', 'participants'];
  let running = false, elapsedMs = 0, accruedAmount = 0, checkpoint = 0;
  let segmentRate = 0, rafId = 0, sessionStart = null, sessionEnd = null, finished = false;
  let moneyFitKey = '';
  let segments = [], activePeople = null, restored = false, lastTick = 0, recoveryGapMs = 0;
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
  const people = () => singleRate() ? {fullTime: 0, partTime: 0, participants: count('participants')} : {fullTime: count('fullTime'), partTime: count('partTime'), participants: 0};
  const samePeople = (a, b) => !!a && (singleRate() ? a.participants === b.participants : a.fullTime === b.fullTime && a.partTime === b.partTime);
  const money = n => { const p = profile(); return p.symbol + new Intl.NumberFormat(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', {minimumFractionDigits: p.currency === 'JPY' ? 0 : 2, maximumFractionDigits: p.currency === 'JPY' ? 0 : 2}).format(n); };
  const clock = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':'); };
  const deltaNow = () => running ? Math.max(0, Date.now() - checkpoint) : 0;
  const duration = () => elapsedMs + deltaNow();
  const total = () => accruedAmount + segmentRate * deltaNow() / 3600000;
  function persistSession() {
    try {
      if (!sessionStart) { sessionStorage.removeItem(sessionStore); return; }
      sessionStorage.setItem(sessionStore, JSON.stringify({version: 1, country: $('country').value, purpose: $('meetingType').value, running, finished, elapsedMs, accruedAmount, checkpoint, activePeople, segments, recoveryGapMs, sessionStart: sessionStart.toISOString(), sessionEnd: sessionEnd?.toISOString() || null}));
    } catch {}
  }
  function commitPeople() {
    if (!running || !validPeople() || samePeople(activePeople, people())) return;
    settle(); activePeople = people(); segmentRate = hourly(activePeople); persistSession();
  }
  function applyCopy() {
    const t = copy[language];
    const put = (selector, value) => { document.querySelector(selector).textContent = value; };
    const rich = (selector, parts) => {
      const strong = document.createElement('strong'); strong.textContent = parts[1];
      document.querySelector(selector).replaceChildren(parts[0], strong, parts[2]);
    };
    document.documentElement.lang = language;
    document.title = t.title;
    document.querySelector('meta[property="og:title"]').content = t.title;
    document.querySelector('meta[name="twitter:title"]').content = t.title;
    document.querySelector('meta[property="og:description"]').content = t.description;
    document.querySelector('meta[name="twitter:description"]').content = t.description;
    document.querySelector('meta[name="description"]').content = t.description;
    document.querySelector('link[rel="manifest"]').href = language === 'ja' ? './manifest.webmanifest' : language === 'zh' ? './manifest.zh.webmanifest' : './manifest.en.webmanifest';
    document.querySelector('.lang-switch').setAttribute('aria-label', t.langLabel);
    put('.rightbrand', t.header);
    const mobile = document.createElement('span'); mobile.className = 'mobile-break'; mobile.append(document.createElement('br'));
    put('.hero .app-name', 'Time is Money MCC ミーティングコストカウンター');
    document.querySelector('.hero-tagline').replaceChildren(t.hero[0], mobile, t.hero[1], document.createElement('br'), t.hero[2]);
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
    put('#inputWarning', t.editWarning); put('#sessionNotice', t.sessionRestored);
    put('#timeCaution', t.timeCaution);
    put('#includeGap', t.includeGap); put('#excludeGap', t.excludeGap);
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
  function save() { if (!validPeople()) return; try { const o = values(); localStorage.setItem(store, JSON.stringify(Object.fromEntries(ids.map(id => [id, o[id]])))); } catch {} }
  function render() {
    const t = copy[language], okay = valid(), rate = running ? segmentRate : validPeople() ? hourly(values()) : 0;
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
    $('total').textContent = new Intl.NumberFormat(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', {minimumFractionDigits: p.currency === 'JPY' ? 0 : 2, maximumFractionDigits: p.currency === 'JPY' ? 0 : 2}).format(total());
    $('rate').textContent = p.rates ? t.perMinute(money(rate / 60)) : t.ratePending;
    $('fifteen').textContent = p.rates ? money(rate / 4) : '—'; $('thirty').textContent = p.rates ? money(rate / 2) : '—';
    $('indicator').classList.toggle('run', running);
    $('status').textContent = finished ? t.status.finished : running ? t.status.running : duration() > 0 ? t.status.paused : t.status.ready;
    $('start').textContent = running ? t.action.running : duration() > 0 ? t.action.resume : t.action.start;
    $('start').disabled = running || finished || !okay || recoveryGapMs > 0;
    $('pause').disabled = !running;
    $('focusToggle').disabled = recoveryGapMs > 0;
    $('finish').disabled = !sessionStart || finished || recoveryGapMs > 0;
    $('export').disabled = duration() <= 0 || (finished && !$('outcomeStatus').value) || recoveryGapMs > 0;
    $('meetingType').disabled = !!sessionStart;
    $('meetingGoal').disabled = !!sessionStart && !restored;
    $('country').disabled = !!sessionStart;
    for (const id of ['fullTime', 'partTime', 'participants']) $(id).disabled = finished;
    $('outcomeSection').hidden = !finished;
    $('inputWarning').hidden = !running || (validPeople() && samePeople(activePeople, people()));
    $('sessionNotice').hidden = !restored;
    $('gapPrompt').hidden = recoveryGapMs <= 0;
    $('gapMessage').textContent = recoveryGapMs > 0 ? t.gapQuestion(Math.round(recoveryGapMs / 60000)) : '';
    document.querySelectorAll('.mini').forEach(e => { e.style.display = $('showDetails').checked ? '' : 'none'; });
    const box = document.querySelector('.money');
    const fitKey = [box.clientWidth, $('total').textContent.length, p.currency, document.body.classList.contains('focus-mode')].join(':');
    if (fitKey !== moneyFitKey) {
      moneyFitKey = fitKey; box.style.fontSize = '';
      if (box.scrollWidth > box.clientWidth && box.clientWidth > 0) box.style.fontSize = Math.floor(parseFloat(getComputedStyle(box).fontSize) * box.clientWidth / box.scrollWidth * 0.98) + 'px';
    }
  }
  function settle(kind = 'measured') {
    if (!running) return;
    const now = Date.now(), delta = Math.max(0, now - checkpoint);
    if (delta > 0) {
      const amount = segmentRate * delta / 3600000, previous = segments.at(-1);
      if (previous && (previous.kind || 'measured') === kind && previous.rate === segmentRate && samePeople(previous.people, activePeople)) { previous.ms += delta; previous.amount += amount; }
      else segments.push({kind, offsetMs: elapsedMs, ms: delta, people: {...activePeople}, rate: segmentRate, amount});
      elapsedMs += delta; accruedAmount += amount;
    }
    checkpoint = now;
  }
  function tick(timestamp = 0) {
    if (running && Date.now() - checkpoint >= 15000) { settle(); persistSession(); }
    if (timestamp - lastTick >= 250 || !lastTick) { render(); lastTick = timestamp; }
    if (running) rafId = requestAnimationFrame(tick);
  }
  function start() {
    if (running || finished || !valid()) return;
    running = true; if (!sessionStart) sessionStart = new Date(); sessionEnd = null;
    activePeople = people(); segmentRate = hourly(activePeople); checkpoint = Date.now(); save(); persistSession(); tick();
  }
  function pause() { if (!running) return; commitPeople(); settle(); running = false; cancelAnimationFrame(rafId); sessionEnd = new Date(); persistSession(); render(); }
  function finish() {
    if (!sessionStart || finished) return;
    pause(); finished = true; sessionEnd = new Date();
    if (activePeople) for (const id of singleRate() ? ['participants'] : ['fullTime', 'partTime']) $(id).value = activePeople[id];
    document.body.classList.remove('focus-mode');
    $('focusToggle').textContent = copy[language].action.focus;
    persistSession();
    render(); $('outcomeSection').scrollIntoView({behavior: 'smooth', block: 'start'});
    $('outcomeStatus').focus();
  }
  function reset() {
    if (sessionStart && !window.confirm(copy[language].confirmReset)) return;
    pause(); elapsedMs = 0; accruedAmount = 0; sessionStart = null; sessionEnd = null; finished = false;
    segments = []; activePeople = null; restored = false; recoveryGapMs = 0;
    $('meetingType').value = ''; $('meetingGoal').value = '';
    $('outcomeStatus').value = ''; $('outcomeNote').value = ''; persistSession(); render();
  }
  function csv() {
    commitPeople();
    if (running) { settle(); persistSession(); }
    const o = {...values(), ...(activePeople || people())}, c = copy[language].csv, p = profile();
    const lines = [[c.record, c.value], [tCountry(), $('country').value], [tCurrency(), p.currency], [tRateStatus(), p.status], [tSource(), p.source || 'CE provisional assumptions'], ['Survey year', p.year || ''], ['Population', p.population || ''], [c.start, sessionStart?.toISOString() || ''], [c.end, (running ? new Date() : sessionEnd || new Date()).toISOString()], [c.purpose, c.purposeLabels[o.meetingType]], [c.goal, o.meetingGoal], [c.outcome, finished ? c.outcomeLabels[$('outcomeStatus').value] || '' : c.unfinished], [c.left, finished ? $('outcomeNote').value.slice(0, 300) : ''], ...(singleRate() ? [[copy[language].participants, o.participants]] : [[c.fullTime, o.fullTime], [c.partTime, o.partTime]]), [c.elapsed, (duration() / 1000).toFixed(1)], [c.cost, total().toFixed(p.currency === 'JPY' ? 0 : 2)], [c.formula, singleRate() ? `participants x ${p.rates.all} ${p.currency}/hour; annualMedian=${p.annualMedian || 'n/a'}; assumedAnnualHours=${p.annualHours || 'n/a'}; participant changes accrue by segment` : `full-time × ${p.rates.fullTime} ${p.currency}/hour + part-time × ${p.rates.partTime} ${p.currency}/hour; participant changes accrue by segment`]];
    function tCountry() { return copy[language].csvCountry; }
    function tCurrency() { return copy[language].csvCurrency; }
    function tRateStatus() { return copy[language].csvRateStatus; }
    function tSource() { return copy[language].csvSource; }
    lines.push([], [c.record, copy[language].segmentHeading], [copy[language].segmentHeading, copy[language].segmentOffset, c.elapsed, copy[language].participants, c.fullTime, c.partTime, copy[language].csvHourlyRate, c.cost, copy[language].csvCurrency, copy[language].segmentKind, copy[language].excludedSeconds]);
    segments.forEach((s, i) => lines.push([i + 1, (s.offsetMs / 1000).toFixed(3), (s.ms / 1000).toFixed(3), singleRate() ? s.people.participants : s.people.fullTime + s.people.partTime, singleRate() ? '' : s.people.fullTime, singleRate() ? '' : s.people.partTime, s.rate, s.amount.toFixed(6), p.currency, s.kind || 'measured', (s.excludedMs || 0) / 1000]));
    const safe = x => { let s = String(x ?? ''); if (/^\s*[=+@\-＝＋－＠]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(safe).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'time-is-money-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  try {
    language = Object.hasOwn(copy, localStorage.getItem(langStore)) ? localStorage.getItem(langStore) : 'ja';
    const storedCountry = localStorage.getItem(countryStore);
    if (Object.hasOwn(countries, storedCountry)) $('country').value = storedCountry;
    const old = JSON.parse(localStorage.getItem(store) || 'null');
    if (old && typeof old === 'object') for (const id of ids) if (Object.hasOwn(old, id)) {
      if (id === 'showDetails') $(id).checked = !!old[id]; else $(id).value = old[id];
    }
    if (old && typeof old === 'object') { delete old.meetingType; delete old.meetingGoal; localStorage.setItem(store, JSON.stringify(old)); }
  } catch {}
  try {
    const s = JSON.parse(sessionStorage.getItem(sessionStore) || 'null');
    const validPerson = o => o && peopleIds.every(id => Number.isInteger(o[id]) && o[id] >= 0 && o[id] <= 5000);
    const finite = n => Number.isFinite(n) && n >= 0;
    if (s && s.version === 1 && Object.hasOwn(countries, s.country) && Object.hasOwn(purposeLabels, s.purpose) && validPerson(s.activePeople) && finite(s.elapsedMs) && finite(s.accruedAmount) && finite(s.checkpoint) && Number.isFinite(Date.parse(s.sessionStart)) && Array.isArray(s.segments) && s.segments.length <= 10000 && s.segments.every(v => validPerson(v.people) && [v.offsetMs, v.ms, v.rate, v.amount].every(finite))) {
      $('country').value = s.country; $('meetingType').value = s.purpose;
      for (const id of singleRate() ? ['participants'] : ['fullTime', 'partTime']) $(id).value = s.activePeople[id];
      elapsedMs = s.elapsedMs; accruedAmount = s.accruedAmount; checkpoint = s.checkpoint;
      activePeople = s.activePeople; segments = s.segments; sessionStart = new Date(s.sessionStart);
      sessionEnd = s.sessionEnd && Number.isFinite(Date.parse(s.sessionEnd)) ? new Date(s.sessionEnd) : null;
      finished = s.finished === true; running = s.running === true && !finished; segmentRate = hourly(activePeople); restored = true;
      recoveryGapMs = !finished && finite(s.recoveryGapMs) ? s.recoveryGapMs : 0;
      if (recoveryGapMs > 0) running = false;
      if (running && Date.now() - checkpoint > 600000) { running = false; recoveryGapMs = Date.now() - checkpoint; sessionEnd = new Date(checkpoint); }
      else if (running) settle('restored-gap');
      persistSession();
    } else if (s) sessionStorage.removeItem(sessionStore);
  } catch { try { sessionStorage.removeItem(sessionStore); } catch {} }
  for (const id of ids) $(id).addEventListener('input', () => {
    save(); render();
  });
  for (const id of peopleIds) $(id).addEventListener('change', () => { commitPeople(); save(); render(); });
  $('meetingType').addEventListener('change', render);
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
  document.addEventListener('visibilitychange', () => { if (running) settle(); persistSession(); if (!document.hidden) render(); });
  window.addEventListener('pagehide', () => { if (running) settle(); persistSession(); });
  window.addEventListener('beforeunload', e => { persistSession(); if (sessionStart) { e.preventDefault(); e.returnValue = ''; } });
  function resolveGap(include) {
    if (recoveryGapMs <= 0 || !activePeople) return;
    const now = Date.now(), gap = Math.max(0, now - checkpoint);
    const ms = include ? gap : 0, amount = segmentRate * ms / 3600000;
    segments.push({kind: include ? 'confirmed-restored-gap' : 'excluded-restored-gap', offsetMs: elapsedMs, ms, people: {...activePeople}, rate: segmentRate, amount, excludedMs: include ? 0 : gap});
    elapsedMs += ms; accruedAmount += amount; recoveryGapMs = 0; checkpoint = now;
    if (include) sessionEnd = new Date(now);
    if (valid()) { activePeople = people(); segmentRate = hourly(activePeople); running = true; sessionEnd = null; }
    persistSession(); render(); if (running) tick();
  }
  $('includeGap').addEventListener('click', () => resolveGap(true));
  $('excludeGap').addEventListener('click', () => resolveGap(false));
  applyCopy(); render();
  if (running) tick();
  let offlineReady = false, updateWaiting = false, offlineFailed = false;
  function showOfflineStatus() { $('pwaStatus').textContent = updateWaiting ? copy[language].offlineUpdate : offlineFailed ? copy[language].offlineFailed : offlineReady ? copy[language].offlineReady : copy[language].offlinePending; }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      updateWaiting = !!reg.waiting; showOfflineStatus();
      const observe = worker => worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') updateWaiting = !!navigator.serviceWorker.controller;
        if (worker.state === 'redundant' && !reg.active) offlineFailed = true;
        showOfflineStatus();
      });
      observe(reg.installing); reg.addEventListener('updatefound', () => observe(reg.installing));
      navigator.serviceWorker.ready.then(() => { offlineReady = true; showOfflineStatus(); });
    }).catch(() => { offlineFailed = true; showOfflineStatus(); });
  } else offlineFailed = true;
  showOfflineStatus();
  for (const id of ['langJa', 'langEn', 'langZh']) $(id).addEventListener('click', showOfflineStatus);
})();
