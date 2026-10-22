/* =====================================================================
   🌧️ BAARISH ENGINE — canvas rain + lightning, all audio synthesized
   live with the Web Audio API (zero audio files, zero APIs).
   • brown-noise loop → lowpass 1000 Hz = rain (1.2 s fade-in)
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
    this.master.connect(this.ac.destination);

    // brown noise → lowpass 1000 Hz = rain bed
    const len = this.ac.sampleRate * 2;
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = this.ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = this.ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1000;
    this.rainGain = this.ac.createGain();
    this.rainGain.gain.value = 0;
    src.connect(lp).connect(this.rainGain).connect(this.master);
    src.start();
    // 1.2 s fade-in
    this.rainGain.gain.linearRampToValueAtTime(0.32, this.ac.currentTime + 1.2);
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
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.raf);
    clearTimeout(this.lightningTimer);
    if (this.rainGain && this.ac) {
      this.rainGain.gain.cancelScheduledValues(this.ac.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(0, this.ac.currentTime + 0.8);
    }
    const ac = this.ac;
    if (ac) window.setTimeout(() => ac.close().catch(() => {}), 900);
    this.ac = null;
    this.master = null;
    this.rainGain = null;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
