import { useState } from "react";
import {
  CloudRain, Zap, Share2, MessageSquare, HandCoins, Heart, Radio,
  ChevronDown, Download, X, UserRound, Scissors,
} from "lucide-react";
import heroDesktop from "../assets/hero-desktop.jpg";
import heroMobile from "../assets/hero-mobile.jpg";
import Player from "./Player";
import { SITE, type ThemeDef } from "../config";

/* =====================================================================
   🖼️ EDIT HERE — HERO BACKGROUND
   Swap the generated art by replacing src/assets/hero-desktop.jpg and
   src/assets/hero-mobile.jpg (any resolution; CSS covers the frame).
   If the image fails to load, an inline SVG saloon illustration shows.
   ===================================================================== */

function SaloonFallbackSVG() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" /><stop offset="0.45" stopColor="#c2610c" />
          <stop offset="0.75" stopColor="#571c08" /><stop offset="1" stopColor="#120806" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sky)" />
      <circle cx="1080" cy="330" r="90" fill="#fde68a" opacity="0.85" />
      {/* street */}
      <rect y="620" width="1440" height="280" fill="#2a1208" />
      {/* storefront */}
      <rect x="120" y="240" width="620" height="420" fill="#3b1a0c" />
      <rect x="150" y="300" width="260" height="260" fill="#f7e3c3" opacity="0.12" />
      {/* awning stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={`M${120 + i * 77.5} 240 h77.5 l-10 46 h-57.5 z`} fill={i % 2 ? "#f5e9d6" : "#b45309"} opacity="0.9" />
      ))}
      <rect x="120" y="212" width="620" height="34" fill="#7c2d12" />
      <text x="430" y="237" textAnchor="middle" fontFamily="serif" fontSize="26" fill="#fbbf24" letterSpacing="8">SALOON · ESTD 1980</text>
      {/* door + window glow */}
      <rect x="470" y="340" width="150" height="320" fill="#f59e0b" opacity="0.28" />
      <rect x="486" y="356" width="118" height="304" fill="#120806" opacity="0.55" />
      {/* barber pole */}
      <rect x="760" y="330" width="22" height="150" rx="11" fill="#f5e9d6" />
      <path d="M760 350 l22 14 M760 386 l22 14 M760 422 l22 14" stroke="#dc2626" strokeWidth="8" />
      {/* palm */}
      <path d="M1180 660 q-14 -180 10 -260" stroke="#1c0a04" strokeWidth="16" fill="none" />
      {[[1190, 396, -70], [1190, 396, -20], [1190, 396, 30], [1190, 396, 75]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y} q${r} -34 ${r * 1.6} -6`} stroke="#14532d" strokeWidth="14" fill="none" strokeLinecap="round" />
      ))}
      {/* bicycle */}
      <g stroke="#0d0503" strokeWidth="7" fill="none" opacity="0.9">
        <circle cx="930" cy="640" r="42" /><circle cx="1050" cy="640" r="42" />
        <path d="M930 640 L980 560 L1050 640 M980 560 L960 545 M980 560 L1005 552" />
      </g>
      {/* barber chair silhouette */}
      <g fill="#0d0503" opacity="0.92">
        <rect x="250" y="470" width="130" height="26" rx="8" />
        <rect x="262" y="420" width="30" height="60" rx="8" />
        <rect x="300" y="496" width="20" height="120" />
        <rect x="270" y="612" width="90" height="14" rx="7" />
      </g>
    </svg>
  );
}

interface Props {
  theme: ThemeDef;
  themes: ThemeDef[];
  online: number;
  unread: number;
  radio: any;
  rainOn: boolean;
  onToggleRain: () => void;
  onOpenChat: () => void;
  onOpenSupport: () => void;
  onOpenEarning: () => void;
  onShare: () => void;
  onPickTheme: (t: ThemeDef) => void;
  installEvt: any;
  onInstall: () => void;
  onDismissInstall: () => void;
}

const H36 = "h-9"; // equal 36px pill height everywhere

export default function Hero(p: Props) {
  const [imgOk, setImgOk] = useState(true);
  const titleLines = p.theme.titleHi.split(" ");

  return (
    <section className="relative min-h-[100svh] select-none flex flex-col overflow-hidden" id="top">
      {/* ---------- background layers ---------- */}
      <div className="absolute inset-0" aria-hidden="true">
        <SaloonFallbackSVG />
        {imgOk && (
          <>
            <img src={heroMobile} alt="" onError={() => setImgOk(false)}
              className="md:hidden absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
            <img src={heroDesktop} alt=""
              className="hidden md:block absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
          </>
        )}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="absolute inset-0 bg-ink/25" />
      </div>

      {/* ---------- header ---------- */}
      <header className="relative z-20 px-3 xs:px-5 pt-4 flex items-center gap-2 flex-wrap">
        <div className={`glass pill ${H36} px-3 flex items-center gap-2`}>
          <span className="w-6 h-6 rounded-full grid place-items-center text-ink"
            style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}>
            <Radio size={13} />
          </span>
          <span className="leading-none">
            <span className="block font-hindi text-[13px] text-cream">{p.theme.titleHi}</span>
            <span className="block text-[8px] tracking-[0.18em] text-mute">{p.theme.tagline}</span>
          </span>
        </div>

        <div className={`glass pill ${H36} px-3 flex items-center gap-2 text-[11.5px] font-semibold`} aria-live="polite">
          <span className="w-2 h-2 rounded-full bg-whatsapp dot-live" />
          <span className="tabular-nums">{p.online.toLocaleString("en-IN")} online</span>
        </div>

        <div className="relative ml-auto xs:ml-0">
          <select
            aria-label="Change theme"
            defaultValue=""
            onChange={(e) => {
              const t = p.themes.find((t) => t.id === e.target.value);
              if (t) p.onPickTheme(t);
              e.target.value = "";
            }}
            className={`glass pill ${H36} px-3 pr-7 text-[11.5px] font-semibold appearance-none cursor-pointer text-cream bg-transparent`}
          >
            <option value="" disabled className="text-ink">Change Theme</option>
            {p.themes.map((t) => (
              <option key={t.id} value={t.id} className="text-ink">{t.emoji} {t.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-mute" />
        </div>

        <nav className="hidden md:flex items-center gap-2 ml-auto">
          <a href="#about" className={`glass pill ${H36} px-4 grid place-items-center text-[11.5px] font-semibold text-cream/90 hover:text-accent-soft`}>About</a>
          <a href="#faq" className={`glass pill ${H36} px-4 grid place-items-center text-[11.5px] font-semibold text-cream/90 hover:text-accent-soft`}>FAQ</a>
        </nav>

        <button onClick={p.onOpenSupport}
          className={`pill ${H36} px-4 ml-auto md:ml-0 flex items-center gap-1.5 text-[11.5px] font-bold text-ink`}
          style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}>
          <Heart size={12} fill="currentColor" /> Support us
        </button>

        <button onClick={p.onOpenChat} aria-label="Open live chat"
          className={`glass pill ${H36} w-9 grid place-items-center text-accent-soft`}>
          <UserRound size={15} />
        </button>
      </header>

      {/* ---------- side saloon cards (desktop) ---------- */}
      <aside className="hidden lg:block absolute left-5 top-28 z-10 glass rounded-xl p-4 w-40 fade-up" style={{ animationDelay: "0.4s" }}>
        <p className="text-[9px] tracking-[0.25em] text-accent-soft font-bold">DELUXE SALOON</p>
        <p className="font-hindi text-cream text-lg leading-tight mt-1">स्पेशल गधी<br />हैयर कट</p>
        <Scissors size={18} className="text-rain mt-2" />
      </aside>
      <aside className="hidden lg:block absolute right-5 top-28 z-10 glass rounded-xl p-4 w-40 fade-up" style={{ animationDelay: "0.55s" }}>
        <p className="inline-block text-[9px] font-bold text-ink bg-accent-soft rounded px-1.5 py-0.5">स्पेशल</p>
        <ul className="mt-2 space-y-1 text-[10px] text-cream/85 font-hindi">
          <li>• ईयर बड</li><li>• शेविंग</li><li>• नयी शेप</li><li>• हैयर मसाज</li><li>• फेसिस</li><li>• महँदी अप</li>
        </ul>
      </aside>

      {/* ---------- centre ---------- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="hindi-title text-[17vw] xs:text-7xl sm:text-8xl md:text-[8rem] lg:text-[9.5rem] fade-up">
          {titleLines.map((l, i) => <span key={i} className="block">{l}</span>)}
        </h1>

        <button onClick={p.onOpenChat}
          className="glass pill mt-5 px-4 py-2 flex items-center gap-2 text-[12px] font-semibold text-cream hover:text-accent-soft fade-up"
          style={{ animationDelay: "0.15s" }}>
          <span className="w-2 h-2 rounded-full bg-whatsapp dot-live" />
          <MessageSquare size={13} /> Live Chat
          {p.unread > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold grid place-items-center">
              {p.unread > 9 ? "9+" : p.unread}
            </span>
          )}
        </button>

        {/* pill strip */}
        <div className="mt-6 flex items-center gap-2 flex-wrap justify-center fade-up" style={{ animationDelay: "0.25s" }}>
          <button onClick={p.onToggleRain} aria-pressed={p.rainOn}
            className={`pill ${H36} px-4 flex items-center gap-2 text-[11.5px] font-semibold glass ${p.rainOn ? "!border-rain !text-rain" : "text-cream/90"}`}
            style={p.rainOn ? { background: "rgba(147,197,253,0.16)" } : undefined}>
            {p.rainOn
              ? <Zap size={13} className="animate-bounce-x text-rain" />
              : <CloudRain size={13} className="animate-bounce-x" />}
            {p.rainOn ? "Sirf Gaane" : "Baarish?"}
          </button>
          <button onClick={p.onOpenEarning}
            className={`pill glass ${H36} px-4 flex items-center gap-2 text-[11.5px] font-semibold text-cream/90`}>
            <HandCoins size={13} className="text-accent-soft" /> Part Time Earning
          </button>
          <button onClick={p.onShare}
            className={`pill glass ${H36} px-4 flex items-center gap-2 text-[11.5px] font-semibold text-cream/90`}>
            <Share2 size={13} className="text-whatsapp" /> Share
          </button>
        </div>

        {/* PWA install card */}
        {p.installEvt && (
          <div className="glass-strong rounded-2xl mt-6 p-4 max-w-xs text-left modal-in relative">
            <button onClick={p.onDismissInstall} aria-label="Dismiss install prompt"
              className="absolute top-2 right-2 text-mute hover:text-cream"><X size={14} /></button>
            <p className="text-[13px] font-bold text-accent-soft">Install Our APP</p>
            <p className="text-[11px] text-mute mt-0.5">One tap listen anywhere.</p>
            <button onClick={p.onInstall}
              className="pill mt-3 px-4 h-8 flex items-center gap-1.5 text-[11px] font-bold text-ink"
              style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}>
              <Download size={12} /> Install
            </button>
          </div>
        )}

        {/* player */}
        <div className="w-full mt-7 fade-up" style={{ animationDelay: "0.35s" }}>
          <Player radio={p.radio} />
          <p className="mt-3 font-mono text-[10px] tracking-widest text-mute">
            contact: <a className="link-amber" href={`mailto:${SITE.contact}`}>{SITE.contact}</a>
          </p>
        </div>
      </main>

      {/* scroll cue */}
      <a href="#about" aria-label="Scroll to learn more about Deluxe Saloon"
        className="hidden md:flex relative z-10 flex-col items-center gap-1 pb-5 text-mute hover:text-accent-soft">
        <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <ChevronDown size={16} className="animate-bob" />
      </a>
    </section>
  );
}
