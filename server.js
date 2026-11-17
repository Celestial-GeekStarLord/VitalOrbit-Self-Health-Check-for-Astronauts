// Code written with assistance from Claude (Anthropic), a Super Intelligence (SI) tool, for the NASA Space Apps Challenge.
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// Vercel's filesystem is read-only except /tmp (temporary), so use it there.
const DATA_DIR = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, 'data');
const DOWNLINK_FILE = path.join(DATA_DIR, 'downlink.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simulated "downlink to flight surgeon": stores the crew member's log on the server.
app.post('/api/sync', (req, res) => {
  const { env, entries } = req.body || {};
  if (!Array.isArray(entries)) {
    return res.status(400).json({ ok: false, error: 'entries must be an array' });
  }
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = { receivedAt: new Date().toISOString(), env: env || 'unknown', entries };
    fs.writeFileSync(DOWNLINK_FILE, JSON.stringify(payload, null, 2));
    res.json({ ok: true, count: entries.length, receivedAt: payload.receivedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Could not save data' });
  }
});

// What the ground team would see.
app.get('/api/sync', (req, res) => {
  if (!fs.existsSync(DOWNLINK_FILE)) return res.json({ ok: true, entries: [] });
  res.type('json').send(fs.readFileSync(DOWNLINK_FILE, 'utf8'));
});

// Live space weather from NASA DONKI (api.nasa.gov). Cached for 30 minutes to respect rate limits.
// Set NASA_API_KEY (free at https://api.nasa.gov) for higher limits; DEMO_KEY allows about 30 requests/hour.
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
let swCache = { t: 0, data: null };

async function donki(type, start, end) {
  const url = `https://api.nasa.gov/DONKI/${type}?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`${type} ${r.status}`);
  const text = await r.text();
  if (!text.trim()) return [];
  try { const j = JSON.parse(text); return Array.isArray(j) ? j : []; } catch (e) { return []; }
}

app.get('/api/spaceweather', async (req, res) => {
  if (swCache.data && Date.now() - swCache.t < 30 * 60 * 1000) return res.json(swCache.data);
  const iso = d => d.toISOString().slice(0, 10);
  const end = new Date(), start = new Date(Date.now() - 7 * 864e5);
  const types = ['FLR', 'SEP', 'CME', 'GST'];
  // allSettled: one failing NASA feed should not hide the others.
  const results = await Promise.allSettled(types.map(t => donki(t, iso(start), iso(end))));
  const got = {}, missing = [], reasons = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') got[types[i]] = r.value;
    else { got[types[i]] = []; missing.push(types[i]); reasons.push(r.reason && r.reason.message ? r.reason.message : String(r.reason)); }
  });
  if (missing.length === types.length) {
    console.error('DONKI failed:', reasons);
    const rate = reasons.some(m => / 429/.test(m));
    if (swCache.data) return res.json({ ...swCache.data, stale: true });
    return res.status(502).json({ ok: false, error: 'NASA DONKI request failed (' + reasons[0] + ')',
      hint: rate ? 'NASA rate limit reached. Add a free NASA_API_KEY (api.nasa.gov) in the server environment.' : 'Check that the server can reach api.nasa.gov.' });
  }
  const data = {
    ok: true, fetchedAt: new Date().toISOString(), source: 'NASA DONKI (api.nasa.gov)', missing,
    flares: got.FLR.map(f => ({ class: f.classType, peak: f.peakTime || f.beginTime, region: f.sourceLocation || null })),
    sep: got.SEP.map(x => ({ time: x.eventTime })),
    cme: got.CME.map(c => ({ time: c.startTime, region: c.sourceLocation || null })),
    storms: got.GST.map(g => ({ time: g.startTime, kp: Math.max(0, ...((g.allKpIndex || []).map(k => k.kpIndex || 0))) }))
  };
  if (!missing.length) swCache = { t: Date.now(), data };
  res.json(data);
});

// Locally: run a server. On Vercel: export the app (public/ is served by Vercel's CDN).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VitalOrbit running at http://localhost:${PORT}`);
  });
}

module.exports = app;