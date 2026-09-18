# LineCut

A house-by-house power-cut reporting map. A resident swipes a bar to report an outage, and it tints that exact house's real building outline — not just a nearby pin — red on the map. Planned maintenance shows the same way, in yellow, ahead of time.

## Get a Google Maps API key

The base map is real Google Maps tiles, so you need your own key:

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (or use an existing one).
2. Under **APIs & Services → Library**, enable the **Maps JavaScript API**.
3. Under **APIs & Services → Credentials**, create an API key.
4. Click the key and restrict it to **Websites** (this is Google's current name for the old "HTTP referrers" restriction), adding `localhost:5173/*` for local dev and your Vercel domain once you have one (e.g. `linecut.vercel.app/*`). This stops anyone else from using your key.
5. Google's free tier covers a generous number of map loads per month; beyond that it's billed, so keep the key restricted.

## How the building shapes work

Google's own map tiles draw building footprints, but Google doesn't expose those individual shapes as something you can grab and color through the standard Maps JavaScript API. To actually color a specific house's building, LineCut looks up that building's outline from **OpenStreetMap** (a free, open map database) using its public Overpass API, and draws it as a colored polygon on top of Google's map, positioned to match.

Practically:
- On the **Manage Houses** page, click **Add a house**, then click directly on a building on the map. LineCut queries Overpass for the building at that point (usually 1–3 seconds) and, if found, uses its real outline.
- If no mapped building is found there (some areas, especially newer construction, aren't fully mapped in OpenStreetMap yet), the house falls back to a plain colored marker you can drag into place instead.
- The demo houses try this lookup automatically when the site loads.

Two things worth knowing:
- Overpass is a shared public service with light rate limits — fine for a prototype, but for real production use at scale you'd want your own Overpass mirror or a paid building-footprint provider.
- Coverage depends entirely on how well your area is mapped in OpenStreetMap. If your street's buildings aren't traced yet, anyone can add them at [openstreetmap.org](https://www.openstreetmap.org) — most of Kerala's urban areas already have decent building coverage.

## Run it locally

```bash
npm install
cp .env.example .env
# edit .env and paste your key in place of "your-google-maps-api-key-here"
npm run dev
```

Opens at `http://localhost:5173`.

## Put it on GitHub

```bash
cd linecut
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository on GitHub (no README/license, so it stays empty), and push:

```bash
git remote add origin https://github.com/<your-username>/linecut.git
git branch -M main
git push -u origin main
```

## Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New → Project**, and pick the `linecut` repo you just pushed.
3. Vercel auto-detects Vite — leave the defaults (Build Command: `npm run build`, Output Directory: `dist`).
4. Before deploying, open **Environment Variables** and add `VITE_GOOGLE_MAPS_API_KEY` with your key, then click **Deploy**.
5. After a minute you'll get a live URL like `linecut.vercel.app`. Go back to your key's website restrictions in Google Cloud Console and add that exact domain. Every future push to `main` redeploys automatically.

## Notes

- This is a front-end-only prototype: house data (including any you add) lives in memory and resets on refresh. To make reports and house placements persist and reach KSEB in real time, you'll want a backend (e.g. a small API + database) that the swipe action, the "add house" flow, and the manage page all talk to.
- The camera feature needs HTTPS to access the device camera in most browsers — Vercel serves over HTTPS by default, so this works once deployed (localhost also works for dev).
