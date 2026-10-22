import { useState } from "react";
import { Heart, X, Download, HandCoins, MessageCircle } from "lucide-react";
import { UPI_ID, UPI_NAME, WHATSAPP_CHANNEL } from "../config";

function Shell({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-strong relative rounded-2xl w-full max-w-md p-6 modal-in">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-mute hover:text-cream">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ============ SUPPORT MODAL ============ */
export function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [qrFailed, setQrFailed] = useState(false);
  if (!open) return null;
  const upiStr = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&bgcolor=120806&color=fbbf24&data=${encodeURIComponent(upiStr)}`;

  return (
    <Shell onClose={onClose} label="Support Deluxe Saloon">
      <div className="flex items-center gap-2 text-accent-soft">
        <Heart size={18} fill="currentColor" />
        <h3 className="font-display text-xl text-cream">Support the Saloon</h3>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-cream/90">
        <strong className="text-accent-soft">No ads — just memories.</strong> Support the
        platform to stay <strong>FOREVER</strong>.
      </p>
      <p className="mt-2 text-[12px] text-mute leading-relaxed">
        The saloon sees 1 lac+ daily visitors and we promise to never run ads.
        If even a few of you chip in, the radio keeps playing for everyone, free.
      </p>

      <div className="mt-4 rounded-xl bg-white p-3 grid place-items-center">
        {qrFailed ? (
          <p className="text-[12px] text-ink font-mono py-6 px-2 text-center">
            UPI: <strong>{UPI_ID}</strong><br />({UPI_NAME})
          </p>
        ) : (
          <img src={qrUrl} alt={`UPI QR code for ${UPI_NAME}`} width={180} height={180}
            onError={() => setQrFailed(true)} className="rounded" />
        )}
      </div>

      <a href={qrUrl} target="_blank" rel="noopener noreferrer"
        className="pill mt-3 w-full h-9 flex items-center justify-center gap-2 text-[12px] font-bold text-ink"
        style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}>
        <Download size={13} /> Download QR Code
      </a>
      <p className="mt-2 text-center text-[10.5px] text-mute">
        Save it and scan with any UPI app. (GPay / PhonePe / Paytm)
      </p>

      <button onClick={onClose} className="mt-4 w-full text-[12px] text-mute hover:text-cream underline underline-offset-4">
        Dismiss
      </button>
    </Shell>
  );
}

/* ============ PART TIME EARNING MODAL ============ */
export function EarningModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Shell onClose={onClose} label="Part time earning">
      <div className="flex items-center gap-2 text-accent-soft">
        <HandCoins size={18} />
        <h3 className="font-display text-xl text-cream">Part Time Earning</h3>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-cream/90">
        Simple online tasks — sharing posts, testing links, small daily work.
        Pocket-money payments sent <strong className="text-accent-soft">instantly via UPI</strong>,
        no experience needed. Do it between haircuts. 🙂
      </p>
      <ul className="mt-3 space-y-1.5 text-[12px] text-mute">
        <li>• 10–20 min a day, from your phone</li>
        <li>• UPI payout the same day</li>
        <li>• Details shared in our WhatsApp group</li>
      </ul>
      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="pill mt-4 w-full h-10 flex items-center justify-center gap-2 text-[12.5px] font-bold text-white bg-whatsapp hover:brightness-110">
        <MessageCircle size={14} /> Join Now
      </a>
      <button onClick={onClose} className="mt-3 w-full text-[12px] text-mute hover:text-cream underline underline-offset-4">
        Dismiss
      </button>
    </Shell>
  );
}
