
(function () {
  'use strict';

  /* ---------- storage (works offline, stays on the device) ---------- */
  const LS = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- health indicators ----------
     normal  = green range, caution = amber range, anything outside = red.
     General adult reference ranges for demonstration only, not medical advice. */
  const IND = {
    hr: {
      label: 'Resting heart rate', unit: 'bpm', min: 20, max: 220, step: 1, ph: 64,
      normal: [50, 90], caution: [40, 100], organ: 'heart',
      how: 'Sit still for 5 minutes. Place two fingers on the inside of your wrist (or use the crew wearable) and count beats for 30 seconds, then double it.',
      why: 'Fluid shifts toward the head, fitness loss, stress and poor sleep all change resting heart rate in space.',
      low: 'A low rate can be normal for very fit crew. If you feel dizzy or faint, sit or lie down, drink fluids and report it.',
      high: 'Rest 10 minutes, drink water, avoid caffeine and measure again. If it stays high at rest or you have chest pain, contact the flight surgeon.'
    },
    sys: {
      label: 'Blood pressure, systolic (top number)', unit: 'mmHg', min: 50, max: 250, step: 1, ph: 118,
      normal: [90, 129], caution: [80, 139], organ: 'heart',
      how: 'Sit with your back supported and the cuff at heart level. Rest 5 minutes, stay still and silent, and read the top number.',
      why: 'Microgravity redistributes blood, and the cardiovascular system adapts. Pressure can swing when you return to gravity.',
      low: 'Low pressure can cause dizziness when you stand. Move slowly, drink fluids and re-measure after 15 minutes.',
      high: 'Rest and measure again in 10 minutes. Check salt intake and stress. Repeated high readings need flight surgeon review.'
    },
    dia: {
      label: 'Blood pressure, diastolic (bottom number)', unit: 'mmHg', min: 30, max: 150, step: 1, ph: 76,
      normal: [60, 84], caution: [50, 89], organ: 'heart',
      how: 'Taken in the same reading as the systolic value. Read the bottom number on the cuff.',
      why: 'Together with systolic pressure it shows how hard your vessels are working at rest.',
      low: 'Sit or lie down, drink fluids and re-measure. Report it if you also feel faint.',
      high: 'Rest, reduce salt and stimulants, and re-measure. Repeated high readings need flight surgeon review.'
    },
    glu: {
      label: 'Blood glucose (fasting)', unit: 'mg/dL', min: 20, max: 500, step: 1, ph: 90,
      normal: [70, 99], caution: [60, 125], organ: 'gut',
      how: 'Measure before your first meal. Clean a fingertip, use a fresh lancet and test strip, and read the meter.',
      why: 'Stress, altered diet, less activity and sleep loss can change how the body handles sugar.',
      low: 'Take about 15 g of fast carbohydrate (juice or glucose tablets), re-test in 15 minutes and report it.',
      high: 'Drink water, review what you ate and re-test after fasting. Repeated high values need flight surgeon review.'
    },
    temp: {
      label: 'Body temperature', unit: '°C', min: 33, max: 42, step: 0.1, ph: 36.6,
      normal: [36.1, 37.2], caution: [35.5, 38.0], organ: 'skin',
      how: 'Use the ear or forehead thermometer. Wait 15 minutes after exercise or a hot drink.',
      why: 'Closed cabins hold heat, and infection or immune changes show up as temperature changes.',
      low: 'Add layers, have a warm drink, check cabin temperature and re-measure in 30 minutes.',
      high: 'Hydrate, rest and check cabin cooling. A fever above 38.0 °C with other symptoms needs the flight surgeon, and limit contact with the crew.'
    },
    sleep: {
      label: 'Sleep last night', unit: 'hours', min: 0, max: 16, step: 0.1, ph: 7.5,
      normal: [7, 9], caution: [6, 10], organ: 'brain',
      how: 'Use your sleep tracker, or estimate from lights-out to wake-up minus time awake.',
      why: 'Odd light cycles, noise and workload cut sleep in space, and poor sleep hurts mood, judgement and immunity.',
      low: 'Keep a fixed schedule, dim screens an hour before bed, use an eye mask and earplugs, and skip late caffeine. Report several short nights in a row.',
      high: 'Very long sleep can point to low mood or illness. Check how you feel and how active you have been.'
    },
    mood: {
      label: 'Mood today', unit: '/ 5', min: 1, max: 5, step: 1, ph: 4,
      options: ['1 · Very low', '2 · Low', '3 · Okay', '4 · Good', '5 · Great'],
      normal: [4, 5], caution: [3, 5], organ: 'brain',
      how: 'Pick the option that best matches how you felt for most of today.',
      why: 'Isolation, confinement and distance from Earth can wear on mental health, and mood is an early warning.',
      low: 'Talk to a crewmate, schedule a private call with family or a counselor, and take a break at the window. If low mood lasts several days, request a behavioral health conference.',
      high: ''
    },
    ex: {
      label: 'Exercise today', unit: 'min', min: 0, max: 400, step: 5, ph: 100,
      normal: [90, 180], caution: [45, 240], organ: 'bones',
      how: 'Add up your resistive and aerobic exercise time today.',
      why: 'Without full gravity, bones and muscles weaken. Daily resistive and aerobic exercise is the main countermeasure.',
      low: 'Schedule a session now. Even 20 minutes of resistive exercise helps protect bones and muscles.',
      high: 'Lots of training. Watch for overuse, and make sure you get enough protein, fluids and rest.'
    }
  };

  const ORGANS = {
    brain: { name: 'Brain and mind', inds: ['mood', 'sleep'],
      src: ['Isolation and confinement', 'https://www.nasa.gov/hrp/hazard-isolation-and-confinement/'],
      fn: 'Controls sleep, mood, focus and decision-making.',
      hazard: 'NASA describes behavioral responses in groups isolated and confined in a small space, far from Earth, for a long time. Space radiation can also alter cognitive function.' },
    heart: { name: 'Heart and blood vessels', inds: ['hr', 'sys', 'dia'],
      src: ['Gravity fields', 'https://www.nasa.gov/hrp/hazard-gravity-fields/'],
      fn: 'Pumps blood around the body.',
      hazard: 'Organs, muscles, bones and the inner ear all have to adjust to each new gravity level, and again on return to Earth. Cardiovascular events are among the health problems spaceflight hazards can contribute to.' },
    gut: { name: 'Metabolism (blood sugar)', inds: ['glu'],
      src: ['Hostile and closed environments', 'https://www.nasa.gov/hrp/hazard-hostile-closed-environments/'],
      fn: 'Turns food into energy, and insulin keeps blood sugar steady.',
      hazard: 'Inadequate nutrition is a known spaceflight health problem. Living in a closed environment, stress and less activity can all affect blood sugar.' },
    skin: { name: 'Temperature and immune system', inds: ['temp'],
      src: ['Hostile and closed environments', 'https://www.nasa.gov/hrp/hazard-hostile-closed-environments/'],
      fn: 'Body temperature reflects infection, stress and heat load.',
      hazard: 'NASA tracks temperature, pressure, lighting, noise, microbial communities and astronaut immune responses inside a spacecraft.' },
    bones: { name: 'Bones and muscles', inds: ['ex'],
      src: ['Gravity fields', 'https://www.nasa.gov/hrp/hazard-gravity-fields/'],
      fn: 'Support the body and absorb loads.',
      hazard: 'Bones and muscles must adjust to every new gravity level. Bone density loss is a known spaceflight health problem, so daily exercise matters.' }
  };

  const ENV = [
    { id: 'iss', delay: 'near real time, with gaps in coverage', name: 'Space station (low Earth orbit)', g: 'Microgravity',
      note: 'NASA uses the station to study how the body responds in space. Neutron radiation makes up about 30% of total radiation on the ISS (CSA), so keep your dosimeter checks up to date.' },
    { id: 'transit', delay: 'many minutes one-way, depending on distance', name: 'Deep-space spacecraft', g: 'Microgravity',
      note: 'Beyond Earth’s magnetic field, galactic cosmic rays and solar storms are a serious risk (NASA). Help and supplies are far away, so self-care matters most.' },
    { id: 'moon', delay: 'about 1.3 seconds one-way', name: 'Moon base', g: '0.16 g',
      note: 'Muscles, bones and the inner ear must adjust to a new gravity level (NASA), so keep exercising. Plan for radiation protection and for slower help from Earth.' },
    { id: 'mars', delay: 'about 3 to 22 minutes one-way', name: 'Mars base', g: '0.38 g',
      note: 'Astronauts would live in three-eighths of Earth’s gravity for up to two years. Mars is about 140 million miles away on average and a mission could last roughly three years, so self-sufficiency is key (NASA).' }
  ];

  const MISSIONS = [
    { id: 'checkin', text: 'Log today\u2019s vitals', tag: 'Auto-completes when you check in', auto: true },
    { id: 'exercise', text: 'Finish your exercise session', tag: 'Gravity fields: protects bones and muscles' },
    { id: 'fluids', text: 'Drink your fluid target', tag: 'Hostile closed environment: fluids and cabin air' },
    { id: 'dosimeter', text: 'Check your radiation dosimeter', tag: 'Space radiation · log it on the Radiation page' },
    { id: 'social', text: 'Have a social call with crew or family', tag: 'Isolation and confinement' },
    { id: 'lights', text: 'Lights out on your sleep schedule', tag: 'Sleep and circadian rhythm' }
  ];

  const LABELS = ['In range', 'Watch', 'Act now'];

  /* ---------- evaluation ---------- */
  function status(k, v) {
    const d = IND[k];
    if (v === null || v === undefined || v === '' || isNaN(v)) return { level: -1, dir: null };
    v = +v;
    if (v >= d.normal[0] && v <= d.normal[1]) return { level: 0, dir: null };
    const dir = v < d.normal[0] ? 'low' : 'high';
    const inCaution = v >= d.caution[0] && v <= d.caution[1];
    return { level: inCaution ? 1 : 2, dir };
  }
  function chip(level) {
    return '<span class="chip s' + level + '">' + (level < 0 ? 'No data' : LABELS[level]) + '</span>';
  }
  function fmt(k, v) {
    return IND[k].options ? v + ' / 5' : v + ' ' + IND[k].unit;
  }

  /* ---------- entries ---------- */
  function day(d) {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }
  function entries() {
    return LS.get('vo_entries', []).sort((a, b) => (a.t < b.t ? -1 : 1));
  }
  function addEntry(values) {
    const e = entries();
    const now = new Date();
    e.push({ t: now.toISOString(), date: day(now), values });
    LS.set('vo_entries', e);
  }
  function latest() {
    const out = {};
    entries().forEach(e => { for (const k in e.values) out[k] = { v: e.values[k], t: e.t }; });
    return out;
  }
  function score() {
    const L = latest(); let s = 0, n = 0;
    for (const k in IND) {
      if (!L[k]) continue;
      s += [100, 60, 20][status(k, L[k].v).level]; n++;
    }
    return n ? Math.round(s / n) : null;
  }
  function scoreLevel(s) { return s === null ? -1 : s >= 80 ? 0 : s >= 55 ? 1 : 2; }
  function organLevel(id) {
    const L = latest(); let worst = -1;
    ORGANS[id].inds.forEach(k => { if (L[k]) worst = Math.max(worst, status(k, L[k].v).level); });
    return worst;
  }
  function advice() {
    const L = latest(); const out = [];
    for (const k in IND) {
      if (!L[k]) continue;
      const s = status(k, L[k].v);
      if (s.level > 0 && IND[k][s.dir]) out.push({ k, level: s.level, dir: s.dir, v: L[k].v, text: IND[k][s.dir] });
    }
    return out.sort((a, b) => b.level - a.level);
  }

  /* ---------- gamification ---------- */
  function streak() {
    const days = new Set(entries().map(e => e.date));
    let n = 0; const d = new Date();
    if (!days.has(day(d))) d.setDate(d.getDate() - 1);
    while (days.has(day(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function missionsDone() { return LS.get('vo_missions', {}); }
  function doneToday() {
    const t = day(new Date());
    const list = (missionsDone()[t] || []).slice();
    if (entries().some(e => e.date === t) && !list.includes('checkin')) list.push('checkin');
    return list;
  }
  function toggleMission(id) {
    const all = missionsDone(); const t = day(new Date());
    const list = all[t] || [];
    all[t] = list.includes(id) ? list.filter(x => x !== id) : list.concat(id);
    LS.set('vo_missions', all);
  }
  function stats() {
    const m = missionsDone();
    let manual = 0; for (const d in m) manual += m[d].filter(x => x !== 'checkin').length;
    const xp = entries().length * 10 + manual * 5;
    const per = 60;
    return { xp, level: Math.floor(xp / per) + 1, into: xp % per, per };
  }
  function badges() {
    const s = streak(), sc = score();
    const all = doneToday().length === MISSIONS.length;
    const L = latest(); const full = Object.keys(IND).every(k => L[k]);
    return [
      { name: 'First check-in', desc: 'Log your first set of vitals', got: entries().length > 0 },
      { name: 'Three-day streak', desc: 'Check in 3 days in a row', got: s >= 3 },
      { name: 'Week in orbit', desc: 'Check in 7 days in a row', got: s >= 7 },
      { name: 'Full panel', desc: 'Record all 8 indicators', got: full },
      { name: 'All green', desc: 'Reach a health score of 100', got: sc === 100 },
      { name: 'Mission complete', desc: 'Finish every daily mission', got: all }
    ];
  }

  /* ---------- environment and demo data ---------- */
  function getEnv() { const id = LS.get('vo_env', 'iss'); return ENV.find(e => e.id === id) || ENV[0]; }

  function demo() {
    let s = 7; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(8, 0, 0, 0);
      const p = 13 - i;
      list.push({
        t: d.toISOString(), date: day(d),
        values: {
          hr: Math.round(62 + p * 0.9 + r() * 6),
          sys: Math.round(116 + p * 1.1 + r() * 6),
          dia: Math.round(74 + p * 0.7 + r() * 4),
          glu: Math.round(88 + p * 0.8 + r() * 6),
          temp: +(36.6 + r() * 0.4 + (p > 11 ? 0.5 : 0)).toFixed(1),
          sleep: +(7.4 - p * 0.13 + r() * 0.8).toFixed(1),
          mood: Math.max(1, Math.min(5, Math.round(4.3 - p * 0.1 + r()))),
          ex: Math.round(105 - p * 3 + r() * 20)
        }
      });
    }
    LS.set('vo_entries', list);
    // demo dosimeter log: about 0.3 to 0.7 mSv/day, consistent with the 50 to 120 mSv per six months NASA/National Academies cite for the ISS
    LS.set('vo_dose', { prior: 120, log: list.map((e, i) => ({ date: e.date, mSv: +(0.45 + Math.sin(i * 1.7) * 0.12 + (i % 3) * 0.03).toFixed(2) })) });
  }
  function clearAll() {
    ['vo_entries', 'vo_missions', 'vo_dose', 'vo_sw'].forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
  }

  /* ---------- shared header ---------- */
  function nav(active) {
    const pages = [['index', 'Dashboard', '/'], ['checkin', 'Check-in', '/checkin.html'],
      ['trends', 'Trends', '/trends.html'], ['radiation', 'Radiation', '/radiation.html'], ['missions', 'Missions', '/missions.html'], ['guide', 'Guide', '/guide.html']];
    const env = getEnv();
    document.getElementById('top').innerHTML =
      '<a class="brand" href="/">VitalOrbit</a>' +
      '<nav aria-label="Main">' + pages.map(p =>
        '<a href="' + p[2] + '"' + (p[0] === active ? ' aria-current="page"' : '') + '>' + p[1] + '</a>').join('') + '</nav>' +
      '<span class="utc" id="utc" role="timer" aria-label="Current UTC time"></span>' +
      '<label class="env">Location <select id="envSel">' + ENV.map(e =>
        '<option value="' + e.id + '"' + (e.id === env.id ? ' selected' : '') + '>' + e.name + '</option>').join('') + '</select></label>';
    const tick = () => { const n = new Date(); document.getElementById('utc').textContent = 'UTC ' + n.toISOString().slice(11, 19); };
    tick(); setInterval(tick, 1000);
    document.getElementById('envSel').onchange = function () { LS.set('vo_env', this.value); location.reload(); };
  }

  /* ---------- personal baseline (early warning) ----------
     Flight surgeons care about change from YOUR normal, not only population ranges.
     Baseline = first 7 readings of each indicator. A later value is flagged when it is 2+ SD
     from baseline AND moving away from the centre of the normal range. */
  const BASE_N = 7;
  function series(k) {
    return entries().filter(e => e.values[k] != null).map(e => ({ t: e.t, v: +e.values[k] }));
  }
  function baseline(k) {
    const sr = series(k);
    if (sr.length < BASE_N + 1) return null;
    const b = sr.slice(0, BASE_N).map(p => p.v);
    const mean = b.reduce((a, x) => a + x, 0) / b.length;
    const sd = Math.sqrt(b.reduce((a, x) => a + (x - mean) * (x - mean), 0) / b.length);
    const d = IND[k];
    return { mean, sd: Math.max(sd, (d.normal[1] - d.normal[0]) * 0.15) };
  }
  function drift() {
    const out = []; const L = latest();
    for (const k in IND) {
      const b = baseline(k); if (!b || !L[k]) continue;
      const v = +L[k].v, z = (v - b.mean) / b.sd, d = IND[k];
      const mid = (d.normal[0] + d.normal[1]) / 2;
      if (Math.abs(z) >= 2 && Math.abs(v - mid) > Math.abs(b.mean - mid)) {
        out.push({ k, z, v, mean: b.mean, dir: z > 0 ? 'above' : 'below', inRange: status(k, v).level === 0 });
      }
    }
    return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  }
  function trend(k, n) {
    const sr = series(k).slice(-n);
    if (sr.length < 3) return null;
    const h = Math.ceil(sr.length / 2), avg = a => a.reduce((t, p) => t + p.v, 0) / a.length;
    const f = avg(sr.slice(0, h)), l = avg(sr.slice(-h)), d = IND[k];
    const dir = Math.abs(l - f) < (d.normal[1] - d.normal[0]) * 0.05 ? 'steady' : l > f ? 'rising' : 'falling';
    return { dir, first: f, last: l, n: sr.length };
  }

  /* ---------- radiation dose ledger ----------
     NASA-STD-3001 Vol. 1 (NASA radiation protection technical brief): career limit under 600 mSv,
     universal for all ages and sexes; solar particle event limit 250 mSv per event. */
  const DOSE_LIMIT = 600, SPE_LIMIT = 250;
  function dose() { return LS.get('vo_dose', { prior: 0, log: [] }); }
  function setPrior(v) { const d = dose(); d.prior = Math.max(0, +v || 0); LS.set('vo_dose', d); }
  function addDose(mSv, date) {
    const d = dose();
    d.log = d.log.filter(x => x.date !== date).concat({ date, mSv: +mSv });
    d.log.sort((a, b) => (a.date < b.date ? -1 : 1));
    LS.set('vo_dose', d);
  }
  function doseStats() {
    const d = dose();
    const mission = d.log.reduce((t, x) => t + x.mSv, 0), total = d.prior + mission;
    const recent = d.log.slice(-14);
    const rate = recent.length ? recent.reduce((t, x) => t + x.mSv, 0) / recent.length : null;
    const left = DOSE_LIMIT - total;
    return { prior: d.prior, mission, total, pct: total / DOSE_LIMIT * 100, rate, left,
      daysLeft: rate > 0 && left > 0 ? Math.floor(left / rate) : null, log: d.log };
  }
  // Simple summary of NASA DONKI notifications from the last 72 hours (not a forecast).
  function swLevel(d) {
    const since = Date.now() - 72 * 36e5;
    const recent = a => (a || []).filter(x => new Date(x.time || x.peak).getTime() >= since);
    if (recent(d.sep).length || recent(d.flares).some(f => /^X/i.test(f.class || ''))) return 2;
    if (recent(d.flares).some(f => /^M/i.test(f.class || '')) || recent(d.cme).length) return 1;
    return 0;
  }

  /* ---------- flight surgeon report (SBAR, store-and-forward) ---------- */
  function report() {
    const L = latest(), env = getEnv(), sc = score(), adv = advice(), dr = drift(), ds = doseStats();
    const red = adv.filter(a => a.level === 2), amber = adv.filter(a => a.level === 1);
    const out = [];
    out.push('VITALORBIT FLIGHT SURGEON REPORT (SBAR)');
    out.push('Generated: ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC');
    out.push('Location: ' + env.name + ' (' + env.g + ')');
    out.push('');
    out.push('S - SITUATION');
    out.push(red.length ? 'Out of range (act now): ' + red.map(a => IND[a.k].label + ' ' + fmt(a.k, a.v) + ' (' + a.dir + ')').join('; ')
      : 'No readings in the act-now range.');
    if (amber.length) out.push('Watch: ' + amber.map(a => IND[a.k].label + ' ' + fmt(a.k, a.v) + ' (' + a.dir + ')').join('; '));
    out.push('');
    out.push('B - BACKGROUND');
    out.push('Health score: ' + (sc === null ? 'no data' : sc + '/100') + '. Check-in streak: ' + streak() + ' day(s). Total check-ins: ' + entries().length + '.');
    out.push('Personal baseline: first ' + BASE_N + ' check-ins per indicator.');
    out.push('');
    out.push('A - ASSESSMENT (latest value, status, trend over last 7 check-ins)');
    Object.keys(IND).forEach(k => {
      if (!L[k]) { out.push('- ' + IND[k].label + ': no data'); return; }
      const st = status(k, L[k].v), t = trend(k, 7);
      out.push('- ' + IND[k].label + ': ' + fmt(k, L[k].v) + ' [' + LABELS[st.level] + ']' + (t ? ', ' + t.dir : ''));
    });
    if (dr.length) out.push('Drift from personal baseline: ' + dr.map(x => IND[x.k].label + ' ' + x.dir + ' baseline (' + Math.abs(x.z).toFixed(1) + ' SD)').join('; ') + '.');
    if (ds.log.length || ds.prior) {
      out.push('Radiation: mission dose ' + ds.mission.toFixed(1) + ' mSv; career total ' + ds.total.toFixed(1) + ' mSv = ' + ds.pct.toFixed(0) + '% of the ' + DOSE_LIMIT + ' mSv NASA career limit.');
    }
    const sw = LS.get('vo_sw', null);
    if (sw) out.push('Space weather (NASA DONKI, last 72 h): ' + ['quiet', 'watch', 'elevated'][swLevel(sw)] + ' (fetched ' + String(sw.fetchedAt || '').slice(0, 16).replace('T', ' ') + ' UTC).');
    out.push('');
    out.push('R - RECOMMENDATION / REQUEST');
    if (red.length || amber.length >= 3) out.push('Requesting flight surgeon review. Self-care steps in progress: ' + (adv.length ? adv.slice(0, 3).map(a => IND[a.k].label + ' - ' + a.text.replace(/\.$/, '')).join(' | ') : 'none') + '.');
    else out.push('Routine report. No action requested.');
    out.push('');
    out.push('Communication: ' + env.delay + '. Send now; do not wait for a reply before taking the safe steps above.');
    out.push('Reference ranges are common adult clinical ranges, not individual crew limits.');
    return out.join('\n');
  }

  window.VO = { IND, ORGANS, ENV, MISSIONS, LABELS, LS, status, chip, fmt, day, entries, addEntry, latest, score, scoreLevel,
    organLevel, advice, series, baseline, drift, trend, DOSE_LIMIT, SPE_LIMIT, dose, setPrior, addDose, doseStats, swLevel, report, streak, doneToday, toggleMission, stats, badges, getEnv, demo, clearAll, nav };
})();