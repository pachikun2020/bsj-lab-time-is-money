(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = 'meryds_meeting_meter_v02';
  const langStore = 'meryds_meeting_meter_lang';
  const copy = window.TMM_I18N;
  let language = 'ja';
  const ids = ['fullTime', 'partTime', 'meetingType', 'meetingGoal', 'showDetails'];
  const FULL_TIME_YEN_PER_HOUR = 2500;
  const PART_TIME_YEN_PER_HOUR = 1500;
  let running = false, elapsedMs = 0, accruedYen = 0, checkpoint = 0;
  let segmentRate = 0, rafId = 0, sessionStart = null, sessionEnd = null, finished = false;
  const count = id => Number($(id).value);
  const validCount = id => $(id).value.trim() !== '' && Number.isInteger(count(id)) && count(id) >= 0 && count(id) <= 5000;
  const validPeople = () => validCount('fullTime') && validCount('partTime') && count('fullTime') + count('partTime') > 0;
  const validPurpose = () => !!purposeLabels[$('meetingType').value];
  const valid = () => validPeople() && validPurpose();
  const values = () => ({fullTime: count('fullTime'), partTime: count('partTime'), meetingType: $('meetingType').value, meetingGoal: $('meetingGoal').value.slice(0, 100), showDetails: $('showDetails').checked});
  const purposeLabels = {decision: '決定', share: '共有', dialogue: '対話'};
  const hourly = o => o.fullTime * FULL_TIME_YEN_PER_HOUR + o.partTime * PART_TIME_YEN_PER_HOUR;
  const yen = n => '¥' + Math.round(n).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US');
  const clock = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':'); };
  const duration = () => elapsedMs + (running ? performance.now() - checkpoint : 0);
  const total = () => accruedYen + (running ? segmentRate * (performance.now() - checkpoint) / 3600000 : 0);
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
    document.querySelector('link[rel="manifest"]').href = language === 'ja' ? './manifest.webmanifest' : './manifest.en.webmanifest';
    document.querySelector('.lang-switch').setAttribute('aria-label', t.langLabel);
    put('.rightbrand', t.header);
    const mobile = document.createElement('span'); mobile.className = 'mobile-break'; mobile.append(document.createElement('br'));
    document.querySelector('.hero h1').replaceChildren(t.hero[0], mobile, t.hero[1], document.createElement('br'), t.hero[2]);
    rich('.hero .sub', t.heroSub);
    put('#settings h2', t.settings);
    put('label[for="fullTime"]', t.fullTime); put('label[for="partTime"]', t.partTime);
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
    put('.disclaimer', t.disclaimer); put('footer span:last-child', t.footer);
    $('pause').textContent = t.action.pause; $('finish').textContent = t.action.finish;
    $('reset').textContent = t.action.reset; $('export').textContent = t.action.export;
    $('focusToggle').textContent = document.body.classList.contains('focus-mode') ? t.action.unfocus : t.action.focus;
    $('langJa').setAttribute('aria-pressed', String(language === 'ja'));
    $('langEn').setAttribute('aria-pressed', String(language === 'en'));
  }
  function setLanguage(next) {
    if (next !== 'ja' && next !== 'en') return;
    language = next;
    try { localStorage.setItem(langStore, language); } catch {}
    applyCopy(); render();
  }
  function save() { if (!valid()) return; try { localStorage.setItem(store, JSON.stringify(values())); } catch {} }
  function render() {
    const t = copy[language], okay = valid(), rate = validPeople() ? hourly(values()) : 0;
    $('inputError').hidden = validPeople();
    $('purposeError').hidden = validPurpose();
    $('elapsed').textContent = clock(duration());
    $('total').textContent = Math.round(total()).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US');
    $('rate').textContent = t.perMinute(yen(rate / 60));
    $('fifteen').textContent = yen(rate / 4); $('thirty').textContent = yen(rate / 2);
    $('indicator').classList.toggle('run', running);
    $('status').textContent = finished ? t.status.finished : running ? t.status.running : duration() > 0 ? t.status.paused : t.status.ready;
    $('start').textContent = running ? t.action.running : duration() > 0 ? t.action.resume : t.action.start;
    $('start').disabled = running || finished || !okay;
    $('pause').disabled = !running;
    $('finish').disabled = !sessionStart || finished;
    $('export').disabled = duration() <= 0 || (finished && !$('outcomeStatus').value);
    $('meetingType').disabled = !!sessionStart;
    $('meetingGoal').disabled = !!sessionStart;
    $('outcomeSection').hidden = !finished;
    document.querySelectorAll('.mini').forEach(e => { e.style.display = $('showDetails').checked ? '' : 'none'; });
  }
  function settle() {
    if (!running) return;
    const now = performance.now(), delta = now - checkpoint;
    elapsedMs += delta; accruedYen += segmentRate * delta / 3600000; checkpoint = now;
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
    pause(); elapsedMs = 0; accruedYen = 0; sessionStart = null; sessionEnd = null; finished = false;
    $('outcomeStatus').value = ''; $('outcomeNote').value = ''; render();
  }
  function csv() {
    const o = values(), c = copy[language].csv;
    const lines = [[c.record, c.value], [c.start, sessionStart?.toISOString() || ''], [c.end, (running ? new Date() : sessionEnd || new Date()).toISOString()], [c.purpose, c.purposeLabels[o.meetingType]], [c.goal, o.meetingGoal], [c.outcome, finished ? c.outcomeLabels[$('outcomeStatus').value] || '' : c.unfinished], [c.left, finished ? $('outcomeNote').value.slice(0, 300) : ''], [c.fullTime, o.fullTime], [c.partTime, o.partTime], [c.elapsed, (duration() / 1000).toFixed(1)], [c.cost, Math.round(total())], [c.formula, c.formulaValue]];
    const safe = x => { let s = String(x ?? ''); if (/^\s*[=+@\-]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(safe).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'time-is-money-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  try {
    language = localStorage.getItem(langStore) === 'en' ? 'en' : 'ja';
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
  $('focusToggle').addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    $('focusToggle').textContent = document.body.classList.contains('focus-mode') ? copy[language].action.unfocus : copy[language].action.focus;
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  applyCopy(); render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
