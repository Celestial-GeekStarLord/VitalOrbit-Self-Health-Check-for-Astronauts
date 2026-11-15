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