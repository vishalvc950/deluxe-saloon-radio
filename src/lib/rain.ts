/* =====================================================================
   🌧️ BAARISH ENGINE — canvas rain + lightning, Web Audio.
   • rain bed = public/rain.mp3 (Mixkit thunderstorm), fetched + decoded,
     baked into a seamless mid-track loop (loud opening skipped, 1.5 s
     equal-power crossfade), 1.2 s fade-in
   • if the fetch/decode fails (offline, first visit) it falls back to a
     live pink-noise 10 s loop → highpass 220 + lowpass 5400
   • sawtooth 80→25 Hz + lowpass + noise crack = thunder
   • random lightning every 5–14 s: 3-stage screen flash + jagged bolt
   ===================================================================== */

interface Drop { x: number; y: number; len: number; speed: number; depth: number; }
interface Splash { x: number; y: number; r: number; a: number; }
interface Bolt { pts: { x: number; y: number }[]; a: number; }

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export class RainEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private flashEl: HTMLDivElement;
  private drops: Drop[] = [];
  private splashes: Splash[] = [];
  private bolts: Bolt[] = [];
  private raf = 0;
  private lightningTimer = 0;
  private running = false;

  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSrc: AudioBufferSourceNode | null = null;
  private gen = 0;

  constructor(canvas: HTMLCanvasElement, flashEl: HTMLDivElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.flashEl = flashEl;
    this.resize();
  }

  private resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(300, Math.floor(w / 4));
    this.drops = Array.from({ length: count }, () => this.newDrop(true));
  };

  private newDrop(scatter = false): Drop {
    const depth = 0.35 + Math.random() * 0.65;
    return {
      x: Math.random() * window.innerWidth,
      y: scatter ? Math.random() * window.innerHeight : -30,
      len: 9 + depth * 16,
      speed: 5 + depth * 9,
      depth,
    };
  }

  /* ---------- audio ---------- */
  private initAudio() {
    if (this.ac) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = 1;
    // soft limiter: rain bed + thunder can overlap and exceed 0 dBFS
    const lim = this.ac.createDynamicsCompressor();
    lim.threshold.value = -6;
    lim.knee.value = 6;
    lim.ratio.value = 12;
    lim.attack.value = 0.003;
    lim.release.value = 0.25;
    this.master.connect(lim).connect(this.ac.destination);

    // rain bed
    this.rainGain = this.ac.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.master);

    // recorded thunderstorm, seamless loop → falls back to synthesized rain
    const gen = ++this.gen;
    void this.loadRainBed().then((ok) => {
      if (!ok && gen === this.gen) this.synthRain();
    });
  }

  /* recorded rain bed: public/rain.mp3 → crossfade-baked loop */
  private async loadRainBed(): Promise<boolean> {
    const gen = this.gen;
    try {
      const ac = this.ac;
      if (!ac) return false;
      const res = await fetch(new URL("rain.mp3", document.baseURI).href);
      if (!res.ok) return false;
      const raw = await ac.decodeAudioData(await res.arrayBuffer());
      if (gen !== this.gen || !this.running || !this.ac || !this.master || !this.rainGain)
        return false;
      const src = this.ac.createBufferSource();
      src.buffer = this.seamlessLoop(raw, this.ac);
      src.loop = true;
      src.connect(this.rainGain);
      src.start();
      this.rainSrc = src;
      // 1.2 s fade-in (0.72: body-level window, loud opening no longer boosts the average)
      this.rainGain.gain.setValueAtTime(0, this.ac.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(0.72, this.ac.currentTime + 1.2);
      return true;
    } catch {
      return false;
    }
  }

  /* bake a seamless loop from a mid-track window. The bed opens with a loud
     swell (0–4 s ≈ −18 dB vs ≈ −31 dB body), so wrapping the full file surges
     ~13 dB into the limiter at every loop → audible weirdness at the seam.
     Skip the opening + the trailing encoder flush, then blend the window's
     tail into its head at constant power: out[L-1] → out[0] stays
     sample-continuous, with matched energy on both sides of the seam */
  private seamlessLoop(raw: AudioBuffer, ac: AudioContext): AudioBuffer {
    const sr = raw.sampleRate;
    const X = Math.floor(sr * 1.5); // crossfade tail
    const skip = Math.min(Math.floor(sr * 6), Math.floor(raw.length * 0.15));
    const end = raw.length - Math.floor(sr * 0.5);
    const L = end - X - skip;
    if (L <= X) return raw;
    const out = ac.createBuffer(raw.numberOfChannels, L, raw.sampleRate);
    for (let ch = 0; ch < raw.numberOfChannels; ch++) {
      const d = raw.getChannelData(ch);
      const o = out.getChannelData(ch);
      for (let i = 0; i < X; i++) {
        const t = (i / X) * (Math.PI / 2);
        o[i] = d[skip + L + i] * Math.cos(t) + d[skip + i] * Math.sin(t);
      }
      o.set(d.subarray(skip + X, skip + L), X);
    }
    return out;
  }

  /* fallback: synthesized pink-noise rain (offline / failed fetch) */
  private synthRain() {
    const ac = this.ac, gain = this.rainGain;
    if (!ac || !gain || !this.running) return;
    const X = Math.floor(ac.sampleRate * 0.5); // crossfade tail
    const N = Math.floor(ac.sampleRate * 10); // 10 s loop length
    const gen = new Float32Array(N + X);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < N + X; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      gen[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    // blend gen[N..] (which continues gen[N-1]) into the head: constant power,
    // so out[N-1] → out[0] is continuous — no click, no audible loop cycle
    const buf = ac.createBuffer(1, N, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < X; i++) {
      const t = (i / X) * (Math.PI / 2);
      data[i] = gen[N + i] * Math.cos(t) + gen[i] * Math.sin(t);
    }
    data.set(gen.subarray(X, N), X);

    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 220;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5400;
    src.connect(hp).connect(lp).connect(gain);
    src.start();
    this.rainSrc = src;
    // 1.2 s fade-in
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.32, ac.currentTime + 1.2);
  }

  private thunder() {
    if (!this.ac || !this.master) return;
    const t = this.ac.currentTime;
    // deep sawtooth rumble 80 → 25 Hz
    const osc = this.ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.1);
    const lp = this.ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.exponentialRampToValueAtTime(90, t + 1.2);
    const g = this.ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(lp).connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 1.7);

    // crack: short noise burst
    const n = this.ac.createBufferSource();
    const nb = this.ac.createBuffer(1, this.ac.sampleRate * 0.4, this.ac.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    n.buffer = nb;
    const bp = this.ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    const ng = this.ac.createGain();
    ng.gain.setValueAtTime(0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    n.connect(bp).connect(ng).connect(this.master);
    n.start(t);
  }

  /* ---------- lightning ---------- */
  private scheduleLightning() {
    if (!this.running) return;
    const delay = 5000 + Math.random() * 9000; // 5–14 s
    this.lightningTimer = window.setTimeout(() => this.strike(), delay);
  }

  private strike() {
    if (!this.running) return;
    if (!prefersReduced()) {
      // 3-stage screen flash via CSS keyframe (mix-blend: screen)
      this.flashEl.classList.remove("lightning-flash");
      void this.flashEl.offsetWidth; // restart animation
      this.flashEl.classList.add("lightning-flash");

      // jagged glowing bolt on canvas
      const w = window.innerWidth, h = window.innerHeight;
      let x = w * (0.15 + Math.random() * 0.7);
      const pts = [{ x, y: 0 }];
      let y = 0;
      while (y < h * 0.72) {
        y += 24 + Math.random() * 42;
        x += (Math.random() - 0.5) * 90;
        pts.push({ x, y });
      }
      this.bolts.push({ pts, a: 1 });
    }
    // thunder arrives a beat after the flash
    window.setTimeout(() => this.thunder(), 180 + Math.random() * 700);
    this.scheduleLightning();
  }

  /* ---------- loop ---------- */
  private frame = () => {
    if (!this.running) return;
    const ctx = this.ctx;
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const wind = Math.sin(performance.now() * 0.00025) * 1.4;

    // rain
    ctx.lineCap = "round";
    for (const d of this.drops) {
      d.y += d.speed;
      d.x += wind * d.depth;
      if (d.y > h) {
        if (this.splashes.length < 60 && d.depth > 0.6)
          this.splashes.push({ x: d.x, y: h - 2, r: 1, a: 0.5 });
        Object.assign(d, this.newDrop());
      }
      ctx.strokeStyle = `rgba(147,197,253,${0.16 + d.depth * 0.34})`;
      ctx.lineWidth = d.depth * 1.6;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + wind * 2, d.y + d.len);
      ctx.stroke();
    }

    // splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.r += 0.9;
      s.a -= 0.03;
      if (s.a <= 0) { this.splashes.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(191,219,254,${s.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.a -= 0.045;
      if (b.a <= 0) { this.bolts.splice(i, 1); continue; }
      ctx.save();
      ctx.shadowColor = "rgba(190,220,255,0.9)";
      ctx.shadowBlur = 22;
      ctx.strokeStyle = `rgba(235,244,255,${b.a})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      b.pts.forEach((p, idx) => (idx ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
    }

    this.raf = requestAnimationFrame(this.frame);
  };

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("resize", this.resize);
    this.initAudio();
    this.ac?.resume();
    this.raf = requestAnimationFrame(this.frame);
    this.scheduleLightning();
  }

  stop() {
    this.running = false;
    this.gen++; // any in-flight rain-bed load becomes stale
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.raf);
    clearTimeout(this.lightningTimer);
    if (this.rainGain && this.ac) {
      this.rainGain.gain.cancelScheduledValues(this.ac.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(0, this.ac.currentTime + 0.8);
    }
    const src = this.rainSrc;
    this.rainSrc = null;
    if (src) window.setTimeout(() => { try { src.stop(); } catch {} }, 900);
    const ac = this.ac;
    if (ac) window.setTimeout(() => ac.close().catch(() => {}), 900);
    this.ac = null;
    this.master = null;
    this.rainGain = null;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
