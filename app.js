(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const store = 'meryds_meeting_meter_v02';
  const ids = ['fullTime', 'partTime', 'meetingGoal', 'showDetails'];
  const FULL_TIME_YEN_PER_HOUR = 2500;
  const PART_TIME_YEN_PER_HOUR = 1500;
  let running = false, elapsedMs = 0, accruedYen = 0, checkpoint = 0;
  let segmentRate = 0, rafId = 0, sessionStart = null, sessionEnd = null;
  const count = id => Number($(id).value);
  const validCount = id => $(id).value.trim() !== '' && Number.isInteger(count(id)) && count(id) >= 0 && count(id) <= 5000;
  const valid = () => validCount('fullTime') && validCount('partTime') && count('fullTime') + count('partTime') > 0;
  const values = () => ({fullTime: count('fullTime'), partTime: count('partTime'), meetingGoal: $('meetingGoal').value.slice(0, 100), showDetails: $('showDetails').checked});
  const hourly = o => o.fullTime * FULL_TIME_YEN_PER_HOUR + o.partTime * PART_TIME_YEN_PER_HOUR;
  const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
  const clock = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':'); };
  const duration = () => elapsedMs + (running ? performance.now() - checkpoint : 0);
  const total = () => accruedYen + (running ? segmentRate * (performance.now() - checkpoint) / 3600000 : 0);
  function save() { if (!valid()) return; try { localStorage.setItem(store, JSON.stringify(values())); } catch {} }
  function render() {
    const okay = valid(), rate = okay ? hourly(values()) : 0;
    $('inputError').hidden = okay;
    $('elapsed').textContent = clock(duration());
    $('total').textContent = Math.round(total()).toLocaleString('ja-JP');
    $('rate').textContent = '現在の参加者で ' + yen(rate / 60) + ' / 分';
    $('fifteen').textContent = yen(rate / 4); $('thirty').textContent = yen(rate / 2);
    $('indicator').classList.toggle('run', running);
    $('status').textContent = running ? '計測中' : duration() > 0 ? '一時停止' : '開始前';
    $('start').textContent = running ? '▶ 計測中' : duration() > 0 ? '▶ 再開' : '▶ 計測開始';
    $('start').disabled = running || !okay; $('pause').disabled = !running; $('export').disabled = duration() <= 0;
    document.querySelectorAll('.mini').forEach(e => { e.style.display = $('showDetails').checked ? '' : 'none'; });
  }
  function settle() {
    if (!running) return;
    const now = performance.now(), delta = now - checkpoint;
    elapsedMs += delta; accruedYen += segmentRate * delta / 3600000; checkpoint = now;
  }
  function tick() { render(); if (running) rafId = requestAnimationFrame(tick); }
  function start() {
    if (running || !valid()) return;
    running = true; if (!sessionStart) sessionStart = new Date(); sessionEnd = null;
    segmentRate = hourly(values()); checkpoint = performance.now(); save(); tick();
  }
  function pause() { if (!running) return; settle(); running = false; cancelAnimationFrame(rafId); sessionEnd = new Date(); render(); }
  function reset() { pause(); elapsedMs = 0; accruedYen = 0; sessionStart = null; sessionEnd = null; render(); }
  function csv() {
    const o = values();
    const lines = [['会議記録', '値'], ['開始日時', sessionStart?.toISOString() || ''], ['終了日時', (running ? new Date() : sessionEnd || new Date()).toISOString()], ['目的', o.meetingGoal], ['フルタイム人数', o.fullTime], ['パートタイム人数', o.partTime], ['経過時間（秒）', (duration() / 1000).toFixed(1)], ['推定会議人件費（円）', Math.round(total())], ['算定方式', 'フルタイム人数×2500円/時＋パートタイム人数×1500円/時。人数変更は区間ごとに積算']];
    const safe = x => { let s = String(x ?? ''); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(safe).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'meeting-cost-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  try {
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
  $('reset').addEventListener('click', reset); $('export').addEventListener('click', csv);
  $('focusToggle').addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    $('focusToggle').textContent = document.body.classList.contains('focus-mode') ? '× 通常表示へ' : '▣ スクリーン表示';
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
