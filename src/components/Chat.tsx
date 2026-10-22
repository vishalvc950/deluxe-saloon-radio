import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X, Pin, BadgeCheck, MessageSquare, WifiOff } from "lucide-react";
import {
  fetchMessages, sendMessage, onChatEvent, fmtIST, nameColor, hasLink,
  type ChatMsg,
} from "../lib/chat";
import {
  CHAT_BACKEND, LS_KEYS, PINNED_MESSAGE, ADMIN_NAME, ADMIN_KEY, ADMIN_DISPLAY,
} from "../config";

interface Props {
  open: boolean;
  onClose: () => void;
  onUnread: (n: number) => void;
}

export default function Chat({ open, onClose, onUnread }: Props) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [offline, setOffline] = useState(false);
  const [name, setName] = useState<string>(() => localStorage.getItem(LS_KEYS.chatName) || "");
  const [askingName, setAskingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastCountRef = useRef(0);

  const isAdmin = name.toLowerCase() === ADMIN_NAME;

  /* ---------- polling: 2.5 s open / 20 s closed ---------- */
  const refresh = useCallback(async () => {
    try {
      const list = await fetchMessages();
      setMsgs(list);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, open ? CHAT_BACKEND.pollOpenMs : CHAT_BACKEND.pollClosedMs);
    const off = onChatEvent(refresh);
    return () => { clearInterval(id); off(); };
  }, [open, refresh]);

  /* ---------- unread badge ---------- */
  useEffect(() => {
    const lastRead = Number(localStorage.getItem(LS_KEYS.chatLastRead) || 0);
    const mine = name;
    const unread = msgs.filter((m) => m.ts > lastRead && m.name !== mine).length;
    onUnread(open ? 0 : unread);
    if (open) localStorage.setItem(LS_KEYS.chatLastRead, String(Date.now()));
  }, [msgs, open, name, onUnread]);

  /* ---------- auto-scroll only when near bottom ---------- */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const grew = msgs.length > lastCountRef.current;
    lastCountRef.current = msgs.length;
    if (nearBottomRef.current || (grew && msgs[msgs.length - 1]?.name === name)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [msgs, name]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  };

  /* ---------- send ---------- */
  const doSend = async () => {
    const text = draft.trim();
    if (!text) return;
    if (text.length > 300) { setErr("Max 300 characters, keep it short like a saloon joke."); return; }
    if (hasLink(text)) { setErr("Links aren't allowed in chat messages."); return; }
    if (isAdmin && adminKey !== ADMIN_KEY) { setErr("Admin key galat hai, bhai."); return; }

    setErr("");
    try {
      const msg = await sendMessage(isAdmin ? ADMIN_DISPLAY : name, text, isAdmin);
      setMsgs((m) => [...m, msg]);
      setDraft("");
      setCooldown(3);
      nearBottomRef.current = true;
    } catch {
      setOffline(true);
      setErr("Chat off by Admin Good Night.");
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submitName = () => {
    const n = nameDraft.trim().slice(0, 40);
    if (!n) return;
    localStorage.setItem(LS_KEYS.chatName, n);
    setName(n);
    setAskingName(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Live chat" aria-modal="true">
      {/* click-away */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="absolute bottom-0 inset-x-0 max-h-[80svh] rounded-t-2xl md:rounded-2xl
                   md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                   md:w-[min(680px,92vw)] md:max-h-[72vh] flex flex-col overflow-hidden modal-in
                   border border-white/15"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(60,26,10,0.92), rgba(18,8,6,0.96))", backdropFilter: "blur(18px)" }}
      >
        {/* header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <MessageSquare size={15} className="text-accent-soft" />
          <span className="text-sm font-bold text-cream">Live Chat</span>
          <span className="w-2 h-2 rounded-full bg-whatsapp dot-live" />
          <span className="text-[10px] text-mute">saloon baithak</span>
          <button onClick={onClose} aria-label="Close chat" className="ml-auto text-mute hover:text-cream pill glass w-8 h-8 grid place-items-center">
            <X size={14} />
          </button>
        </div>

        {/* pinned */}
        <div className="px-4 py-2 text-[11px] text-cream/85 bg-white/5 border-b border-white/10 flex gap-2 items-start">
          <Pin size={12} className="text-accent-soft mt-0.5 shrink-0" /> {PINNED_MESSAGE}
        </div>

        {offline && (
          <div className="px-4 py-2 text-[11px] text-red-300 bg-red-950/40 border-b border-red-900/40 flex gap-2 items-center">
            <WifiOff size={12} /> Chat off by Admin Good Night.
          </div>
        )}

        {/* messages */}
        <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[220px]">
          {msgs.map((m) => {
            const own = m.name === name || (isAdmin && m.name === ADMIN_DISPLAY);
            const color = m.admin ? "#fbbf24" : nameColor(m.name);
            return (
              <div key={m.id} className={`msg-in flex ${own ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug border
                    ${own ? "rounded-br-sm bg-amber-500/20 border-amber-400/30"
                          : "rounded-bl-sm bg-white/8 border-white/10"}
                    ${m.admin ? "!bg-amber-400/25 !border-amber-300/50" : ""}`}
                >
                  <p className="flex items-center gap-1 text-[10.5px] font-bold mb-0.5" style={{ color }}>
                    {m.name}
                    {m.admin && <BadgeCheck size={11} className="text-accent-soft" />}
                  </p>
                  <p className="text-cream/95 break-words whitespace-pre-wrap">{m.text}</p>
                  <p className="text-[9px] text-mute mt-1 text-right font-mono">{fmtIST(m.ts)}</p>
                </div>
              </div>
            );
          })}
          {msgs.length === 0 && !offline && (
            <p className="text-center text-[11px] text-mute pt-8">Baithak is quiet… say hello 👋</p>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-white/10 p-3">
          {!name || askingName ? (
            <div className="modal-in">
              <p className="text-[12px] font-semibold text-accent-soft mb-2">One last step — what's your name?</p>
              <div className="flex gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
                  onKeyDown={(e) => e.key === "Enter" && submitName()}
                  placeholder="e.g. Guddu from Lajpat Nagar"
                  maxLength={40}
                  className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-[12.5px] text-cream placeholder:text-mute/60 focus:border-accent-soft outline-none"
                />
                <button onClick={submitName} className="pill px-4 text-[12px] font-bold text-ink"
                  style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}>
                  Join
                </button>
              </div>
            </div>
          ) : (
            <>
              {isAdmin && (
                <input
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  type="password"
                  placeholder="Admin key (required every send)"
                  className="w-full mb-2 bg-white/8 border border-amber-400/40 rounded-xl px-3 py-1.5 text-[11px] text-cream placeholder:text-mute/60 outline-none focus:border-accent-soft"
                />
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 300))}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }}
                    rows={1}
                    placeholder={`Chat as ${name}…`}
                    className="w-full resize-none bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-[12.5px] text-cream placeholder:text-mute/60 focus:border-accent-soft outline-none"
                  />
                  <div className="flex justify-between mt-1">
                    <button onClick={() => setAskingName(true)} className="text-[10px] text-mute hover:text-accent-soft underline underline-offset-2">
                      change name
                    </button>
                    <span className={`text-[10px] font-mono ${draft.length > 280 ? "text-red-400" : "text-mute"}`}>{draft.length}/300</span>
                  </div>
                </div>
                <button
                  onClick={doSend}
                  disabled={cooldown > 0 || !draft.trim()}
                  aria-label="Send message"
                  className="pill w-10 h-10 grid place-items-center text-ink disabled:opacity-40 shrink-0"
                  style={{ background: "linear-gradient(145deg, var(--accent-soft), var(--accent))" }}
                >
                  <Send size={15} />
                </button>
              </div>
              {cooldown > 0 && <p className="text-[10px] text-mute mt-1">wait {cooldown}s…</p>}
              {err && <p className="text-[11px] text-red-400 mt-1">{err}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
