/* =====================================================================
   ⚙️ EDIT HERE — DELUXE SALOON SITE CONFIG
   All copy, links, playlist IDs and backend wiring live in this one file.
   ===================================================================== */

/** Bump this to force a hard reload on every visitor's next visit. */
export const APP_VERSION = "1.0.0";

/**
 * 🎵 EDIT HERE — YouTube playlist that powers the radio.
 * Audio streams through YouTube's free IFrame Player API; nothing is hosted.
 */
export const PLAYLIST_ID = "PLVFLMYM1tErk";

export const SITE = {
  name: "Deluxe Saloon",
  nameHi: "डीलक्स सैलून",
  url: "https://vishalvc950.github.io/deluxe-saloon-radio/",
  contact: "Vishalvc950@gmail.com",
  playlistUrl: `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`,
};

/* =====================================================================
   💬 EDIT HERE — FREE CHAT BACKEND
   provider: "local"  → zero-setup demo mode (localStorage + BroadcastChannel,
                        works across tabs on one device; ships with seeded
                        ambient messages so the room feels alive)
             "firebase" → Firebase Realtime Database REST (Spark free plan).
                        Set FIREBASE_RTDB_URL to
                        "https://YOUR-PROJECT-default-rtdb.firebaseio.com"
                        and set rules: { "chat": { ".read": true, ".write": true } }
   See README.md for step-by-step free-tier setup.
   ===================================================================== */
export const CHAT_BACKEND = {
  provider: "local" as "local" | "firebase",
  firebaseRtdbUrl: "", // e.g. "https://deluxe-saloon-default-rtdb.firebaseio.com"
  pollOpenMs: 2500,
  pollClosedMs: 20000,
};

export const ADMIN_NAME = "rjsameer";
export const ADMIN_KEY = "deluxe2000"; // demo admin key; change for production
export const ADMIN_DISPLAY = "Deluxe Salon Admin";

/** 📌 Pinned announcement shown at the top of chat. */
export const PINNED_MESSAGE =
  "Welcome to the saloon baithak. Be kind — the barber is listening. 🪒";

/* =====================================================================
   💰 EDIT HERE — UPI / SUPPORT
   ===================================================================== */
export const UPI_ID = "deluxsalon@upi";
export const UPI_NAME = "Deluxe Saloon";

/* =====================================================================
   📲 EDIT HERE — WHATSAPP / SOCIAL LINKS (all free, no API keys)
   ===================================================================== */
export const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbB0qXq4Xy0example"; // ← replace with your channel
export const INSTAGRAM_URL = "https://instagram.com/deluxsalon.in";

/** Two alternating share messages (Hindi + English) per spec. */
export const SHARE_MESSAGES = [
  `अरे भाई! 2000s वाले सैलून के गाने याद हैं? 🪒️ रेडियो-on, क्लिपर की buzz और बॉलीवुड हिट्स — बिल्कुल वही फीलिंग। अभी सुनो: ${SITE.url}`,
  `Remember the 2000s neighbourhood saloon? Cracking radio, clipper buzz, nonstop Bollywood hits. Sit back in the chair and press play: ${SITE.url}`,
];

/* =====================================================================
   🗣️ EDIT HERE — BARBER ONE-LINERS (rotate in the player bar)
   ===================================================================== */
export const BARBER_QUOTES = [
  "TUNED TO DELHI FM 2004",
  "भाई, थोड़ा और ऊपर? — trim chalega?",
  "Arre wah! Yeh gaana toh Usha khanna ji ka hai.",
  "Sir ji, aaj oil lagana hai ya seedha cut?",
  "Clipper ki awaaz + Sonu Nigam = asli Delhi 2004.",
  "Beta, 2000s mein radio hi Netflix tha.",
  "Chai aa gayi! Cutting ke saath ek kadak chai.",
  "Yeh song sunke har baar lagta hai — school chhod doon.",
];

/* =====================================================================
   🖼️ EDIT HERE — THEME FALLBACK
   Used only if public/themes.json can't be fetched (e.g. single-file
   hosting). The full list lives in themes.json.
   ===================================================================== */
export interface ThemeDef {
  id: string;
  emoji: string;
  label: string;
  path: string;
  accent: string;
  accentSoft?: string;
  tagline: string;
  titleHi: string;
  titleEn: string;
}

export const FALLBACK_THEMES: ThemeDef[] = [
  { id: "saloon", emoji: "✂️", label: "Deluxe Salon", path: "/", accent: "#f59e0b", accentSoft: "#fbbf24", tagline: "EST. 2000 · RADIO", titleHi: "डीलक्स सैलून", titleEn: "Deluxe Saloon" },
];

export const LS_KEYS = {
  appVersion: "deluxe_client_app_version",
  installDismissed: "deluxe_install_dismissed",
  supportLastShown: "support_popup_last_shown",
  chatName: "deluxe_chat_name",
  chatLastRead: "deluxe_chat_last_read",
  shareToggle: "deluxe_share_toggle",
  messages: "deluxe_chat_messages",
};
