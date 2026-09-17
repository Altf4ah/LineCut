# GridPulse

A power-cut reporting and feeder-line mapping site. Residents swipe a bar to report an outage; KSEB sees which line feeds each house — plotted on a real Google Map — and can mark planned maintenance.

## Get a Google Maps API key

The map is real Google Maps tiles (the same building outlines you see zoomed into Google Maps normally), so you need your own key:

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (or use an existing one).
2. Under **APIs & Services → Library**, enable the **Maps JavaScript API**.
3. Under **APIs & Services → Credentials**, create an API key.
4. Click the key and restrict it to **HTTP referrers**, adding `localhost:5173/*` for local dev and your Vercel domain once you have one (e.g. `gridpulse.vercel.app/*`). This stops anyone else from using your key.
5. Google's free tier covers a generous number of map loads per month; beyond that it's billed, so keep the key restricted.

## Run it locally

```bash
npm install
cp .env.example .env
# edit .env and paste your key in place of "your-google-maps-api-key-here"
npm run dev
```

Opens at `http://localhost:5173`. On the KSEB view, use **Add / move houses** to click anywhere on the real map and drop a house pin exactly on the building you mean, or drag existing pins onto place.

## Put it on GitHub

```bash
cd gridpulse
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository on GitHub (no README/license, so it stays empty), and push:

```bash
git remote add origin https://github.com/<your-username>/gridpulse.git
git branch -M main
git push -u origin main
```

## Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New → Project**, and pick the `gridpulse` repo you just pushed.
3. Vercel auto-detects Vite — leave the defaults (Build Command: `npm run build`, Output Directory: `dist`).
4. Before deploying, open **Environment Variables** and add `VITE_GOOGLE_MAPS_API_KEY` with your key, then click **Deploy**.
5. After a minute you'll get a live URL like `gridpulse.vercel.app`. Go back to your key's HTTP referrer restrictions in Google Cloud Console and add that domain. Every future push to `main` redeploys automatically.

## Notes

- This is a front-end-only prototype: house data (including any pins you add or move) lives in memory and resets on refresh. To make reports and house placements persist and reach KSEB in real time, you'll want a backend (e.g. a small API + database) that the swipe action, the "add house" flow, and the KSEB dashboard all talk to.
- The camera feature needs HTTPS to access the device camera in most browsers — Vercel serves over HTTPS by default, so this works once deployed (localhost also works for dev).
- The colored squares are markers placed at a lat/lng, not the actual building polygon — Google doesn't expose individual building footprints as editable shapes through the standard Maps JavaScript API. Positioning a marker directly over the right building (using "Add / move houses") gets the same visual effect you're after.
