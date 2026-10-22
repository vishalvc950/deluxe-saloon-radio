import { useCallback, useEffect, useRef, useState } from "react";

/* =====================================================================
   📻 YouTube IFrame Player engine — free API, no keys.
   Behaviour per spec:
   • load playlist via listType:"playlist", loop on
   • random start index once at boot, then strictly sequential prev/next
   • silent preload: mute → jump to random track → on first PLAYING pause,
     unmute, volume 100 — so metadata + thumbnail are warm before Play
   • metadata polled @250ms, progress @500ms, auto-skip on error
   • Media Session API wired (metadata + transport handlers)
   ===================================================================== */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export interface RadioState {
  ready: boolean;
  playing: boolean;
  title: string;
  author: string;
  thumb: string;
  current: number;
  duration: number;
  volume: number;
  muted: boolean;
}

export function useRadioPlayer(playlistId: string) {
  const [state, setState] = useState<RadioState>({
    ready: false,
    playing: false,
    title: "Nostalgia Loading...",
    author: "YouTube",
    thumb: "",
    current: 0,
    duration: 0,
    volume: 100,
    muted: false,
  });

  const playerRef = useRef<any>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const primedRef = useRef(false);
  const userPlayRef = useRef(false);
  const volumeRef = useRef(100);
  const intervalsRef = useRef<number[]>([]);

  const patch = useCallback((p: Partial<RadioState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  /* ---- boot the hidden bridge player ---- */
  useEffect(() => {
    let cancelled = false;

    // hidden 200×200 bridge (opacity ~0, no pointer events)
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;bottom:0;right:0;width:200px;height:200px;opacity:0.001;pointer-events:none;z-index:-1;";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    hostRef.current = host;

    const startIntervals = () => {
      const meta = window.setInterval(() => {
        const p = playerRef.current;
        if (!p?.getVideoData) return;
        const vd = p.getVideoData();
        if (!vd?.title) return;
        const thumb = vd.video_id
          ? `https://img.youtube.com/vi/${vd.video_id}/hqdefault.jpg`
          : "";
        setState((s) =>
          s.title === vd.title && s.author === (vd.author || "YouTube")
            ? s
            : { ...s, title: vd.title, author: vd.author || "YouTube", thumb }
        );
      }, 250);
      const prog = window.setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        const current = p.getCurrentTime() || 0;
        const duration = p.getDuration() || 0;
        setState((s) =>
          Math.abs(s.current - current) < 0.4 && s.duration === duration
            ? s
            : { ...s, current, duration }
        );
      }, 500);
      intervalsRef.current = [meta, prog];
    };

    const randomStart = (tries = 0) => {
      const p = playerRef.current;
      if (!p || cancelled) return;
      let list: string[] = [];
      try {
        list = p.getPlaylist?.() || [];
      } catch {
        list = [];
      }
      if (!list.length) {
        if (tries < 20) window.setTimeout(() => randomStart(tries + 1), 250);
        return;
      }
      const idx = Math.floor(Math.random() * list.length);
      try {
        p.playVideoAt(idx);
      } catch {
        p.seekTo(0);
        p.playVideo();
      }
    };

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(host, {
        width: 200,
        height: 200,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          origin: location.origin,
          listType: "playlist",
          list: playlistId,
        },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            const p = e.target;
            try {
              p.mute();
              p.setLoop(true);
              p.setShuffle(true);
            } catch {}
            patch({ ready: true });
            randomStart();
            startIntervals();
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            const PLAYING = 1,
              PAUSED = 2;
            if (e.data === PLAYING) {
              patch({ playing: true });
              if (!primedRef.current) {
                primedRef.current = true;
                const p = e.target;
                if (userPlayRef.current) {
                  // listener pressed play first — just hand over the audio
                  try {
                    p.unMute();
                    p.setVolume(volumeRef.current);
                  } catch {}
                } else {
                  // silent preload complete → park, unmute, ready
                  try {
                    p.pauseVideo();
                    p.unMute();
                    p.setVolume(volumeRef.current);
                  } catch {}
                }
              }
            } else if (e.data === PAUSED) {
              patch({ playing: false });
            }
          },
          onError: () => {
            try {
              playerRef.current?.nextVideo();
            } catch {}
          },
        },
      });
    });

    return () => {
      cancelled = true;
      intervalsRef.current.forEach((id) => clearInterval(id));
      intervalsRef.current = [];
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      hostRef.current?.remove();
      hostRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  /* ---- controls ---- */
  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (state.playing) {
      p.pauseVideo();
    } else {
      userPlayRef.current = true;
      p.playVideo();
    }
  }, [state.playing]);

  const next = useCallback(() => {
    userPlayRef.current = true;
    try {
      playerRef.current?.nextVideo();
    } catch {}
  }, []);

  const prev = useCallback(() => {
    userPlayRef.current = true;
    try {
      playerRef.current?.previousVideo();
    } catch {}
  }, []);

  const seek = useCallback((frac: number) => {
    const p = playerRef.current;
    if (!p?.getDuration) return;
    const d = p.getDuration() || 0;
    p.seekTo(Math.max(0, Math.min(1, frac)) * d, true);
  }, []);

  const setVolume = useCallback((v: number) => {
    const p = playerRef.current;
    volumeRef.current = v;
    if (!p) return;
    if (v <= 0) {
      p.mute();
      patch({ muted: true, volume: 0 });
    } else {
      p.unMute();
      p.setVolume(v);
      patch({ muted: false, volume: v });
    }
  }, [patch]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (state.muted || state.volume === 0) {
      p.unMute();
      p.setVolume(volumeRef.current || 80);
      patch({ muted: false, volume: volumeRef.current || 80 });
    } else {
      p.mute();
      patch({ muted: true });
    }
  }, [state.muted, state.volume, patch]);

  /* ---- Media Session API ---- */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.title || "Deluxe Saloon",
        artist: state.author || "2000s Bollywood",
        album: "Deluxe Saloon",
        artwork: state.thumb
          ? [
              { src: state.thumb, sizes: "480x360", type: "image/jpeg" },
              { src: state.thumb.replace("hqdefault", "maxresdefault"), sizes: "1280x720", type: "image/jpeg" },
            ]
          : [],
      });
      navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
    } catch {}
  }, [state.title, state.author, state.thumb, state.playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => { userPlayRef.current = true; playerRef.current?.playVideo(); });
      navigator.mediaSession.setActionHandler("pause", () => playerRef.current?.pauseVideo());
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
    } catch {}
  }, [next, prev]);

  return { ...state, toggle, next, prev, seek, setVolume, toggleMute };
}

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
