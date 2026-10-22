import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio,
} from "lucide-react";
import { fmtTime, type RadioState } from "../lib/player";
import { BARBER_QUOTES } from "../config";

interface Props {
  radio: RadioState & {
    toggle: () => void;
    next: () => void;
    prev: () => void;
    seek: (f: number) => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
  };
}

export default function Player({ radio }: Props) {
  const [volOpen, setVolOpen] = useState(false);
  const [quote, setQuote] = useState(BARBER_QUOTES[0]);
  const barRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);

  /* rotating barber one-liner */
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % BARBER_QUOTES.length;
      setQuote(BARBER_QUOTES[i]);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  /* close volume popover on outside click */
  useEffect(() => {
    if (!volOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!volRef.current?.contains(e.target as Node)) setVolOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [volOpen]);

  const pct = radio.duration > 0 ? (radio.current / radio.duration) * 100 : 0;

  const onSeek = (e: React.MouseEvent) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    radio.seek((e.clientX - r.left) / r.width);
  };

  return (
    <div
      className="glass-strong rounded-2xl px-3 py-3 xs:px-4 xs:py-4 w-full max-w-xl mx-auto"
      aria-label="Deluxe Saloon YouTube playlist music player"
    >
      <div className="flex items-center gap-3">
        {/* spinning vinyl cover */}
        <button
          onClick={radio.toggle}
          aria-label={radio.playing ? "Pause the radio" : "Play the radio"}
          className={`vinyl relative shrink-0 w-14 h-14 xs:w-16 xs:h-16 rounded-full border-2 border-white/25 overflow-hidden shadow-[0_0_24px_rgba(245,158,11,0.35)] ${radio.playing ? "is-playing" : ""}`}
          style={{
            background: radio.thumb
              ? `url(${radio.thumb}) center/cover`
              : "radial-gradient(circle at 35% 30%, #3a1c10, #120806 70%)",
          }}
        >
          <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, transparent 34%, rgba(0,0,0,0.35) 60%)" }} />
          <span className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-ink border border-white/40" />
        </button>

        {/* title + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] xs:text-sm font-semibold text-cream truncate">
            {radio.title}
          </p>
          <p className="text-[11px] text-mute truncate">
            Credits: <span className="text-accent-soft">{radio.author}</span>
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] text-mute tabular-nums w-8">
              {fmtTime(radio.current)}
            </span>
            <div
              ref={barRef}
              onClick={onSeek}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              className="group relative flex-1 h-4 flex items-center cursor-pointer"
            >
              <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }}
                />
              </div>
              <div
                className="absolute w-3 h-3 rounded-full bg-accent-soft shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            </div>
            <span className="font-mono text-[10px] text-mute tabular-nums w-8 text-right">
              {fmtTime(radio.duration)}
            </span>
          </div>

          <p className="mt-1 text-center text-[9px] tracking-[0.22em] uppercase text-accent/90 font-semibold truncate">
            {quote}
          </p>
        </div>

        {/* transport */}
        <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
          <button onClick={radio.prev} aria-label="Previous track"
            className="pill glass w-9 h-9 grid place-items-center text-cream/90 hover:text-accent-soft">
            <SkipBack size={15} fill="currentColor" />
          </button>

          <button
            onClick={radio.toggle}
            aria-label={radio.playing ? "Pause" : "Play"}
            className="pill w-11 h-11 xs:w-12 xs:h-12 grid place-items-center text-ink font-bold"
            style={{
              background: "linear-gradient(145deg, var(--accent-soft), var(--accent))",
              boxShadow: radio.playing
                ? "0 0 26px rgba(245,158,11,0.65), inset 0 1px 0 rgba(255,255,255,0.5)"
                : "0 0 14px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            {radio.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <button onClick={radio.next} aria-label="Next track"
            className="pill glass w-9 h-9 grid place-items-center text-cream/90 hover:text-accent-soft">
            <SkipForward size={15} fill="currentColor" />
          </button>

          {/* volume */}
          <div className="relative" ref={volRef}>
            <button
              onClick={() => setVolOpen((v) => !v)}
              aria-label="Volume"
              aria-expanded={volOpen}
              className="pill glass w-9 h-9 grid place-items-center text-cream/90 hover:text-accent-soft"
            >
              {radio.muted || radio.volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            {volOpen && (
              <div className="glass-strong absolute bottom-full right-0 mb-2 w-36 rounded-xl p-3 modal-in z-30">
                <div className="flex items-center gap-2">
                  <button onClick={radio.toggleMute} aria-label="Mute toggle" className="text-cream/80 hover:text-accent-soft">
                    {radio.muted || radio.volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range" min={0} max={100} value={radio.muted ? 0 : radio.volume}
                    onChange={(e) => radio.setVolume(Number(e.target.value))}
                    className="vol" aria-label="Volume level"
                  />
                  <span className="font-mono text-[10px] text-mute w-6 text-right">{radio.muted ? 0 : radio.volume}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!radio.ready && (
        <p className="mt-2 text-center text-[10px] text-mute flex items-center justify-center gap-1.5">
          <Radio size={11} className="animate-pulse" /> warming up the tubes…
        </p>
      )}
    </div>
  );
}
