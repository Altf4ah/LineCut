# GridPulse

A power-cut reporting and feeder-line mapping site. Residents swipe a bar to report an outage; KSEB sees which line feeds each house and can mark planned maintenance.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

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
3. Vercel auto-detects Vite — leave the defaults (Build Command: `npm run build`, Output Directory: `dist`) and click **Deploy**.
4. After a minute you'll get a live URL like `gridpulse.vercel.app`. Every future push to `main` redeploys automatically.

## Notes

- This is a front-end-only prototype: house data lives in memory and resets on refresh. To make reports persist and reach KSEB in real time, you'll want a backend (e.g. a small API + database) that the swipe action and the KSEB dashboard both talk to.
- The camera feature needs HTTPS to access the device camera in most browsers — Vercel serves over HTTPS by default, so this works once deployed (localhost also works for dev).
