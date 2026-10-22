import { useEffect, useRef, useState } from "react";

/* =====================================================================
   👥 SYNTHETIC ONLINE COUNTER — no API, fully client-side.
   Time-bucketed (5 s) so every visitor sees the same number each tick:
   daily sine curve ~1080–1680 (peaks evening IST) + deterministic
   pseudo-random jitter, hard floor 980. UI re-reads every 1 s.
   ===================================================================== */
export function onlineCount(nowMs = Date.now()): number {
  // shift to IST (UTC+5:30)
  const ist = nowMs + (330 + new Date().getTimezoneOffset()) * 60000;
  const bucket = Math.floor(ist / 5000);
  const dayFrac = (ist % 86400000) / 86400000;
  // peak around 20:30 IST, trough around 05:00 IST
  const base = 1380 + 300 * Math.sin((dayFrac - 0.33) * Math.PI * 2);
  // deterministic hash jitter from the 5 s bucket
  const h = Math.sin(bucket * 127.1) * 43758.5453;
  const jitter = (h - Math.floor(h) - 0.5) * 150;
  return Math.max(980, Math.round(base + jitter));
}

export function useOnlineCount(): number {
  const [count, setCount] = useState(() => onlineCount());
  useEffect(() => {
    const id = setInterval(() => setCount(onlineCount()), 1000);
    return () => clearInterval(id);
  }, []);
  return count;
}

/* Reveal-on-scroll helper (IntersectionObserver, once). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("in"); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.15 }
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}
