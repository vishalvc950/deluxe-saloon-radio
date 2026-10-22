import { CHAT_BACKEND, LS_KEYS } from "../config";

/* =====================================================================
   💬 LIVE CHAT — free backends only.
   • "local"    : localStorage + BroadcastChannel (zero setup; seeded with
                  ambient saloon chatter so the room feels lived-in)
   • "firebase" : Firebase RTDB REST (free Spark tier) — pure fetch, no SDK
   Polling: 2.5 s while the panel is open, 20 s in the background
   (the panel component owns the interval; this module is transport-only).
   ===================================================================== */

export interface ChatMsg {
  id: string;
  name: string;
  text: string;
  ts: number;
  admin?: boolean;
}

function seedMessages(): ChatMsg[] {
  const now = Date.now();
  const mk = (name: string, text: string, minAgo: number, admin = false): ChatMsg => ({
    id: `seed-${minAgo}`,
    name,
    text,
    ts: now - minAgo * 60000,
    admin,
  });
  return [
    mk("Ramesh Bhaiya", "Aaj Sunday hai, radio full volume pe! 🔊", 42),
    mk("Pinky", "Bhaiya trimming ke baad head massage pakka 🙂", 31),
    mk("Guddu", "Yeh wala gaana meri shaadi mein baja tha 😄", 18),
    mk("Munna", "Baarish ho rahi hai bahar, saloon mein chai best ☕", 7),
  ];
}

/* ---------------- helpers ---------------- */

export function fmtIST(ts: number): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(ts);
  } catch {
    return new Date(ts).toLocaleTimeString();
  }
}

const PALETTE = [
  "#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#f87171",
  "#a78bfa", "#facc15", "#2dd4bf", "#fb923c", "#e879f9",
];
export function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const LINK_RE = /(https?:\/\/|www\.)|[\w-]+\.(com|net|org|in|co|io|me|tv|xyz|biz)\b|wa\.me\//i;
export function hasLink(text: string): boolean {
  return LINK_RE.test(text);
}

/* ---------------- local backend ---------------- */

function localList(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.messages);
    if (!raw) {
      const seeded = seedMessages();
      localStorage.setItem(LS_KEYS.messages, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as ChatMsg[];
  } catch {
    return [];
  }
}

let bc: BroadcastChannel | null = null;
function channel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    if (!bc) bc = new BroadcastChannel("deluxe_chat");
    return bc;
  } catch {
    return null;
  }
}

function localSend(msg: ChatMsg) {
  const list = localList();
  list.push(msg);
  const trimmed = list.slice(-100);
  localStorage.setItem(LS_KEYS.messages, JSON.stringify(trimmed));
  channel()?.postMessage({ type: "new", msg });
}

/* ---------------- firebase REST backend ---------------- */

async function fbList(): Promise<ChatMsg[]> {
  const url = CHAT_BACKEND.firebaseRtdbUrl.replace(/\/$/, "");
  const res = await fetch(`${url}/chat.json?orderBy="$key"&limitToLast=60`);
  if (!res.ok) throw new Error("chat fetch failed");
  const obj = await res.json();
  if (!obj) return [];
  return Object.entries(obj)
    .map(([id, v]: [string, any]) => ({ id, ...v } as ChatMsg))
    .sort((a, b) => a.ts - b.ts);
}

async function fbSend(msg: ChatMsg) {
  const url = CHAT_BACKEND.firebaseRtdbUrl.replace(/\/$/, "");
  const res = await fetch(`${url}/chat.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: msg.name, text: msg.text, ts: msg.ts, admin: !!msg.admin }),
  });
  if (!res.ok) throw new Error("chat send failed");
}

/* ---------------- public API ---------------- */

export async function fetchMessages(): Promise<ChatMsg[]> {
  if (CHAT_BACKEND.provider === "firebase" && CHAT_BACKEND.firebaseRtdbUrl) {
    return fbList();
  }
  return localList();
}

export async function sendMessage(name: string, text: string, admin = false): Promise<ChatMsg> {
  const msg: ChatMsg = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    text,
    ts: Date.now(),
    admin,
  };
  if (CHAT_BACKEND.provider === "firebase" && CHAT_BACKEND.firebaseRtdbUrl) {
    await fbSend(msg);
  } else {
    localSend(msg);
  }
  return msg;
}

/** Cross-tab listener for local mode (firebase relies on polling). */
export function onChatEvent(cb: () => void): () => void {
  const ch = channel();
  const storage = (e: StorageEvent) => {
    if (e.key === LS_KEYS.messages) cb();
  };
  ch?.addEventListener("message", cb);
  window.addEventListener("storage", storage);
  return () => {
    ch?.removeEventListener("message", cb);
    window.removeEventListener("storage", storage);
  };
}
