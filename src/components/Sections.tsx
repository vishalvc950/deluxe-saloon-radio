import { Music, Mic, Clock, ChevronDown, Radio, MessageCircle, Mail, Info } from "lucide-react";

function Instagram({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
import { useReveal } from "../lib/utils";
import { SITE, WHATSAPP_CHANNEL, INSTAGRAM_URL } from "../config";

const FAQS = [
  ["What is Deluxe Saloon?",
   "Deluxe Saloon — also written Deluxe Salon or Delux Salon — is a free ambient radio website that recreates the sound and mood of a classic 2000s Indian neighbourhood barbershop, complete with nostalgic Bollywood tunes and barber chatter."],
  ["Is Deluxe Saloon free to use?",
   "Yes. Deluxe Saloon streams entirely for free in your browser, with no sign-up required, on both desktop and mobile."],
  ["What kind of music plays on Deluxe Saloon?",
   "Deluxe Saloon plays a curated 2000s Indian Bollywood playlist — the kind of songs you'd have heard on the radio inside a saloon back then. The same playlist is also available on YouTube, linked in the footer below."],
  ["Is Deluxe Saloon available on mobile?",
   "Yes. Deluxe Saloon works in any modern browser on phone or desktop, and can be installed as an app straight from the browser — no store, no sign-up."],
  ["Where can I listen to the Deluxe Salon songs?",
   "All the Deluxe Salon songs stream directly in your browser right here — just press play, no download or sign-up needed. The same tracks are also on YouTube, linked in the footer."],
  ["Is there a Deluxe Salon playlist I can follow?",
   "Yes. The Deluxe Salon playlist plays automatically in shuffle right here, and you can follow the same playlist on YouTube via the link in the footer."],
] as const;

const CARDS = [
  [Music, "2000s Bollywood Radio", "A curated playlist of the era's biggest saloon-radio staples, tuned to keep playing in the background all day."],
  [Mic, "Barber Chatter & Quotes", "Rotating one-liners from Deluxe Saloon's cast of barbers, woven into the retro soundtrack."],
  [Clock, "Always Open", "Deluxe Saloon is free, streams straight from your browser, and never closes — no sign-up, no app."],
] as const;

export default function Sections({ onOpenSupport }: { onOpenSupport: () => void }) {
  const ref = useReveal<HTMLElement>();

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {/* ================= ABOUT ================= */}
      <section id="about" className="bg-panel py-20 px-4 scroll-mt-4">
        <div className="max-w-3xl mx-auto text-center reveal">
          <p className="flex items-center justify-center gap-3 text-[10px] tracking-[0.35em] uppercase text-accent-soft font-bold">
            <span className="h-px w-8 bg-accent-soft/60" /> Welcome to <span className="h-px w-8 bg-accent-soft/60" />
          </p>
          <h2 className="font-display text-3xl xs:text-4xl md:text-[2.6rem] text-cream mt-4 leading-tight">
            Deluxe Saloon — a 2000s Indian Saloon,<br className="hidden sm:block" /> Alive in Sound
          </h2>
          <p className="mt-6 text-[14px] leading-relaxed text-cream/80">
            Deluxe Saloon (also spelled <strong className="text-cream">Deluxe Salon</strong> or{" "}
            <strong className="text-cream">Delux Salon</strong>) is a free ambient radio built to
            recreate one very specific memory: the neighbourhood hair-cutting saloon of 2000s India,
            with a battered radio in the corner playing Bollywood hits between the buzz of clippers
            and the snip of scissors. Press play, and Deluxe Saloon streams a nonstop mix of 2000s
            Bollywood radio nostalgia, styled around the sights, sounds and one-liners of a classic
            Indian barbershop.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12 grid sm:grid-cols-3 gap-4">
          {CARDS.map(([Icon, title, body], i) => (
            <article key={title} className="reveal glass rounded-2xl p-6 hover:-translate-y-1.5 transition-transform duration-300"
              style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="w-10 h-10 rounded-xl grid place-items-center text-accent-soft bg-accent/15 border border-accent/25">
                <Icon size={17} />
              </span>
              <h3 className="font-display text-lg text-cream mt-4">{title}</h3>
              <p className="text-[12.5px] leading-relaxed text-mute mt-2">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="bg-ink py-20 px-4 scroll-mt-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center reveal">
            <p className="text-[10px] tracking-[0.35em] uppercase text-accent-soft font-bold">FAQ</p>
            <h2 className="font-display text-3xl xs:text-4xl text-cream mt-3">Deluxe Saloon, Explained</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map(([q, a], i) => (
              <details key={q} open={i === 0}
                className="reveal group glass rounded-xl overflow-hidden"
                style={{ transitionDelay: `${i * 60}ms` }}>
                <summary className="flex items-center justify-between gap-4 px-5 py-4 text-[13.5px] font-display text-cream hover:text-accent-soft">
                  {q}
                  <ChevronDown size={15} className="faq-chev shrink-0 text-accent-soft" />
                </summary>
                <p className="px-5 pb-5 -mt-1 text-[12.5px] leading-relaxed text-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-footer border-t border-white/8 px-4 pt-14 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between reveal">
            <div>
              <p className="font-hindi text-2xl text-cream flex items-center gap-3">
                डीलक्स सैलून
                <span className="pill text-[8px] tracking-[0.2em] font-bold text-accent-soft border border-accent/30 bg-accent/10 px-2 py-1">NOSTALGIA RADIO</span>
              </p>
              <p className="mt-2 text-[12px] text-mute">
                Deluxe Salon Playlist · <a className="link-amber" href={SITE.url}>vishalvc950.github.io</a>
              </p>
              <p className="mt-1 text-[11px] text-mute/70 max-w-sm">
                Capturing the lazy afternoon drone, warm mirrors, and chai-stained radio cassettes of neighbourhood India.
              </p>
            </div>
            <div className="flex gap-2">
              <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
                className="pill h-9 px-4 flex items-center gap-2 text-[11.5px] font-bold border border-whatsapp/40 text-whatsapp bg-whatsapp/10 hover:bg-whatsapp/20">
                <MessageCircle size={13} /> Join Group
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                className="pill glass h-9 px-4 flex items-center gap-2 text-[11.5px] font-semibold text-cream/90 hover:text-accent-soft">
                <Instagram size={13} /> Instagram
              </a>
            </div>
          </div>

          <div className="mt-10 glass rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between reveal">
            <p className="text-[10.5px] leading-relaxed text-mute flex gap-2 max-w-2xl">
              <Info size={13} className="shrink-0 mt-0.5 text-accent-soft" />
              Disclaimer: Deluxe Saloon is an ambient web-art installation and cultural archival showcase.
              Audio plays through YouTube's embedded player; nothing is hosted on this site, and all rights
              remain with the respective record labels, composers and performers. No monetization from tracks.
            </p>
            <div className="text-[11px] shrink-0 md:text-right">
              <p className="text-mute">Powered By <span className="text-accent-soft font-bold">VC</span></p>
              <a href={`mailto:${SITE.contact}`} className="text-mute hover:text-accent-soft flex items-center gap-1.5 md:justify-end mt-1">
                <Mail size={11} /> {SITE.contact}
              </a>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] text-mute/80">
            <p className="flex items-center gap-1.5">
              <Radio size={11} className="text-accent-soft" />
              © 2000–2025 Deluxe Saloon (डीलक्स सैलून). All nostalgic memories preserved.
            </p>
            <nav className="flex gap-4">
              <a href="#about" className="hover:text-accent-soft">About</a>
              <a href="#faq" className="hover:text-accent-soft">FAQ</a>
              <button onClick={onOpenSupport} className="hover:text-accent-soft">Support Us</button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
