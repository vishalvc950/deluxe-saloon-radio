# डीलक्स सैलून — Deluxe Saloon

A free **2000s Indian retro ambient saloon radio** — the feeling of sitting in a
neighbourhood barbershop with a battered radio playing nonstop 2000s Bollywood hits,
the buzz of clippers and the barber's one-liners. Rebuilt as a deployable static PWA.

Also spelled **Deluxe Salon** / **Delux Salon** · inspired by deluxsalon.in.

**Zero paid services.** Everything runs on free tiers: YouTube IFrame Player API,
img.youtube.com thumbnails, Google Fonts, api.qrserver.com QR, WhatsApp click-to-share,
and an optional free chat backend.

---

## Run it

```bash
npm install
npm run dev      # local dev
npm run build    # single-file dist/index.html (+ public assets)
```

Deploy the `dist/` folder anywhere static (Netlify, Vercel, GitHub Pages, any VPS).

## Project map

```
index.html            SEO meta, JSON-LD (WebSite + FAQPage), PWA/iOS tags, font + preconnect
src/config.ts         ⚙️ EDIT HERE — playlist ID, UPI, WhatsApp links, quotes, chat backend
src/index.css         🎨 EDIT HERE — all design tokens (@theme), glass system, animations
src/lib/player.ts     YouTube radio engine (random start, silent preload, Media Session)
src/lib/rain.ts       🌧️ Baarish: canvas rain + lightning + synthesized thunder (Web Audio)
src/lib/chat.ts       💬 Chat transport (local demo mode / Firebase REST) + helpers
src/lib/utils.ts      Synthetic synced online counter, scroll reveal
src/components/       Hero, Player, Chat, Rain, Overlays (modals), Sections (About/FAQ/Footer)
public/themes.json    Scene switcher data (Saloon, Bus Driver, Bhojpuri, Bartan Time, …)
public/manifest.json  PWA manifest · public/sw.js service worker (precache + smart caching)
src/assets/           🖼️ EDIT HERE — hero-desktop.jpg / hero-mobile.jpg / icon-512.png
```

## Swap in your own UI & background

1. **Background art** — replace `src/assets/hero-desktop.jpg` (landscape) and
   `src/assets/hero-mobile.jpg` (portrait). The hero picks one by viewport; if the
   image fails, an inline SVG saloon illustration renders instead.
2. **Colours / fonts / breakpoints** — edit the `@theme` block at the top of
   `src/index.css`. The runtime theme switcher also writes `--accent` / `--accent-soft`.
3. **Copy, playlist, UPI, links, barber quotes** — all in `src/config.ts`
   (look for the `EDIT HERE` banners).

## Free chat backend setup (optional)

Out of the box, chat runs in **local demo mode** (localStorage + BroadcastChannel,
seeded with ambient saloon chatter). To make it multi-device with Firebase's free
Spark tier:

1. Go to <https://console.firebase.google.com> → **Add project** (free).
2. **Build → Realtime Database → Create database** → start in *test mode*.
3. Copy the database URL (looks like `https://NAME-default-rtdb.firebaseio.com`).
4. In `src/config.ts` set:
   ```ts
   export const CHAT_BACKEND = {
     provider: "firebase",
     firebaseRtdbUrl: "https://NAME-default-rtdb.firebaseio.com",
     ...
   };
   ```
5. Lock down rules when ready (still free):
   ```json
   { "rules": { "chat": { ".read": true, ".write": "newData.child('text').val().length < 300" } } }
   ```

The client uses plain `fetch` REST calls and polls every **2.5 s** while the panel is
open and **20 s** in the background for the unread badge — no SDKs, no websockets.

*(Supabase works the same way: swap the two fetch URLs in `src/lib/chat.ts`.)*

## How the radio works

- A hidden 200×200 YouTube IFrame bridge streams the **Deluxe Salon** playlist
  (`PLVFLMYM1tErk` in `src/config.ts`) — nothing is hosted on this site.
- At boot it mutes, jumps to a **random** track, and on the first `PLAYING` event
  pauses + unmutes so title/credits/thumbnail are warm before you press play.
- Prev/Next are strictly sequential after the random start; errors auto-skip.
- Media Session API wires lock-screen / Bluetooth transport controls.

## Baarish? 🌧️

The rain toggle runs a full-viewport canvas (≤300 depth-sorted drops, wind, splashes)
plus random lightning every 5–14 s with a 3-stage screen flash and a glowing bolt.
**All audio is synthesized live** with the Web Audio API — brown-noise→lowpass rain,
sawtooth 80→25 Hz thunder. No audio files, no APIs.

## PWA

`manifest.json` (standalone, portrait, `#120806`) + `sw.js` (precache shell,
network-first navigation with cached fallback, cache-first assets, old-cache purge).
The hero shows a native **Install Our APP** card on `beforeinstallprompt`,
dismissible and remembered in `localStorage['deluxe_install_dismissed']`.

## localStorage keys (exact)

`deluxe_client_app_version` · `deluxe_install_dismissed` ·
`support_popup_last_shown` · `deluxe_chat_name`

## Rights

Audio plays through YouTube's embedded player; all rights remain with the respective
record labels, composers and performers. Powered by VC · contact Vishalvc950@gmail.com.
