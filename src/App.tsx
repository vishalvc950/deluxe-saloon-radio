import { useCallback, useEffect, useRef, useState } from "react";
import Hero from "./components/Hero";
import Sections from "./components/Sections";
import Chat from "./components/Chat";
import RainOverlay from "./components/Rain";
import { SupportModal, EarningModal } from "./components/Overlays";
import { useRadioPlayer } from "./lib/player";
import { useOnlineCount } from "./lib/utils";
import {
  APP_VERSION, LS_KEYS, PLAYLIST_ID, SHARE_MESSAGES, SITE,
  FALLBACK_THEMES, type ThemeDef,
} from "./config";

/* app-version cache buster: hard reload once when the shell version changes */
(function versionBust() {
  try {
    const prev = localStorage.getItem(LS_KEYS.appVersion);
    if (prev && prev !== APP_VERSION) {
      localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
      location.reload();
      return;
    }
    if (!prev) localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch {}
})();

function themeFromHash(themes: ThemeDef[]): ThemeDef {
  const path = location.hash.replace(/^#/, "") || "/";
  return themes.find((t) => t.path === path) || themes[0] || FALLBACK_THEMES[0];
}

export default function App() {
  /* ---------- themes ---------- */
  const [themes, setThemes] = useState<ThemeDef[]>(FALLBACK_THEMES);
  const [theme, setTheme] = useState<ThemeDef>(FALLBACK_THEMES[0]);

  useEffect(() => {
    let alive = true;
    fetch("/themes.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (alive && j?.themes?.length) setThemes(j.themes); })
      .catch(() => { /* single-file hosting: fall back to Saloon theme */ });
    setTheme(themeFromHash(themes));
    const onHash = () => setTheme(themeFromHash(themes));
    window.addEventListener("hashchange", onHash);
    return () => { alive = false; window.removeEventListener("hashchange", onHash); };
  }, [themes]);

  /* apply accent tokens + title per theme */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", theme.accentSoft || theme.accent);
    document.title = `${theme.titleEn} — 2000s Indian Retro Ambient Radio | ${theme.titleHi}`;
  }, [theme]);

  const pickTheme = useCallback((t: ThemeDef) => {
    location.hash = t.path === "/" ? "/" : t.path;
    setTheme(t);
  }, []);

  /* ---------- core engines ---------- */
  const radio = useRadioPlayer(PLAYLIST_ID);
  const online = useOnlineCount();

  /* ---------- overlays ---------- */
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [earningOpen, setEarningOpen] = useState(false);
  const [rainOn, setRainOn] = useState(false);

  /* ---------- support auto-popup: 5 min on page, 30 min cooldown ---------- */
  const mountRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const last = Number(localStorage.getItem(LS_KEYS.supportLastShown) || 0);
        if (Date.now() - mountRef.current >= 5 * 60_000 && Date.now() - last >= 30 * 60_000) {
          localStorage.setItem(LS_KEYS.supportLastShown, String(Date.now()));
          setSupportOpen(true);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, []);

  /* ---------- WhatsApp share (alternating HI/EN) ---------- */
  const share = useCallback(() => {
    try {
      const i = Number(localStorage.getItem(LS_KEYS.shareToggle) || 0);
      localStorage.setItem(LS_KEYS.shareToggle, String(i + 1));
      const msg = SHARE_MESSAGES[i % SHARE_MESSAGES.length];
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    } catch {}
  }, []);

  /* ---------- PWA install ---------- */
  const deferredRef = useRef<any>(null);
  const [installEvt, setInstallEvt] = useState<any>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e;
      try {
        if (!localStorage.getItem(LS_KEYS.installDismissed)) setInstallEvt(e);
      } catch { setInstallEvt(e); }
    };
    const onInstalled = () => { setInstallEvt(null); deferredRef.current = null; };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = useCallback(async () => {
    const evt = deferredRef.current;
    if (!evt) return;
    evt.prompt();
    try { await evt.userChoice; } catch {}
    setInstallEvt(null);
    deferredRef.current = null;
  }, []);
  const dismissInstall = useCallback(() => {
    setInstallEvt(null);
    try { localStorage.setItem(LS_KEYS.installDismissed, "1"); } catch {}
  }, []);

  /* ---------- service worker ---------- */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-ink text-cream">
      {/* 1. accessibility skip link */}
      <a href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-accent-soft focus:text-ink focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold">
        Skip to content
      </a>

      {/* ambient rain layer */}
      <RainOverlay on={rainOn} />

      {/* 3. hero + player */}
      <Hero
        theme={theme}
        themes={themes}
        online={online}
        unread={unread}
        radio={radio}
        rainOn={rainOn}
        onToggleRain={() => setRainOn((r) => !r)}
        onOpenChat={() => setChatOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        onOpenEarning={() => setEarningOpen(true)}
        onShare={share}
        onPickTheme={pickTheme}
        installEvt={installEvt}
        onInstall={install}
        onDismissInstall={dismissInstall}
      />

      {/* 4. fixed overlays */}
      <Chat open={chatOpen} onClose={() => setChatOpen(false)} onUnread={setUnread} />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <EarningModal open={earningOpen} onClose={() => setEarningOpen(false)} />

      {/* 5–7. about / faq / footer */}
      <Sections onOpenSupport={() => setSupportOpen(true)} />

      {/* hidden contact for crawlers */}
      <span className="sr-only">{SITE.name} contact: {SITE.contact}</span>
    </div>
  );
}
