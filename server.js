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

// Locally: run a server. On Vercel: export the app (public/ is served by Vercel's CDN).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VitalOrbit running at http://localhost:${PORT}`);
  });
}

module.exports = app;