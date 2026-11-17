# VitalOrbit

A self-assessment health tool for astronauts. Node.js + Express serving plain HTML/CSS/JS. Data stays in the browser (localStorage).

## Run
```
npm install
npm start
```
Open http://localhost:3000, go to **Check-in**, and click **Load 14 days of demo data**.

## Pages
Dashboard (`/`), Check-in, Trends, Missions, Guide.

## Where the content comes from
- Hazard descriptions, body-part effects and environment notes: NASA Human Research Program (nasa.gov/hrp/hazards and the five hazard pages) and the Canadian Space Agency radiation article (Feb 26, 2026).
- Reference ranges for the 8 indicators: common adult clinical ranges, simplified. NASA does not publish astronaut vital-sign limits on these pages. Edit them in `public/js/common.js` (`IND`) if your team has better sources.
- Demo data is synthetic.

## Use of Super Intelligence (SI)
The application code (Node/Express server, HTML, CSS, JavaScript), the demo-data generator and the written descriptions were produced with assistance from Claude (Anthropic), an SI tool, and reviewed by the team. No images, audio or video were SI-generated, and no NASA logos or branding are used.

## Version 2 features
- **Radiation page:** live NASA DONKI space-weather summary (flares, particle events, CMEs, storms) and a dose ledger against NASA's 600 mSv career limit. Set `NASA_API_KEY` (free at api.nasa.gov) as an environment variable for higher rate limits; `DEMO_KEY` allows about 30 requests/hour. Results are cached for 30 minutes and saved on the device for offline use.
- **Personal baseline early warning:** each indicator is compared with the crew member's own first 7 readings, not only population ranges.
- **Flight surgeon report:** one-click SBAR summary, with the communication delay for the selected mission location.