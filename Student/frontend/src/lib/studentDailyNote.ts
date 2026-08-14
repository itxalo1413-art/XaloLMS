export type StudentDailyNote = {
  word: string;
  meaning: string;
  author?: string;
  updatedAt: string;
};

export type QuoteItem = {
  id: string;
  word: string;
  meaning: string;
  author?: string;
  active: boolean;
  createdAt: string;
};

export type QuoteMode = "random" | "pinned";

/** Nền note — 20% lavender (#fbf5ff) + 80% trắng, khớp --color-background */
export const DAILY_NOTE_SURFACE = "color-mix(in srgb, #fbf5ff 20%, #ffffff 80%)";

export const DEFAULT_STUDENT_DAILY_NOTE: StudentDailyNote = {
  word: "Clouds.",
  meaning: "there's divinity in the clouds.",
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_QUOTES_LIST: QuoteItem[] = [
  {
    id: "quote-1",
    word: "Clouds.",
    meaning: "there's divinity in the clouds.",
    author: "Xa Lộ English",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "quote-2",
    word: "Keep Pushing.",
    meaning: "success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    active: true,
    createdAt: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "quote-3",
    word: "Believe & Achieve.",
    meaning: "con đường vạn dặm bắt đầu bằng một bước chân nhỏ.",
    author: "Lão Tử",
    active: true,
    createdAt: "2026-08-03T00:00:00.000Z",
  },
  {
    id: "quote-4",
    word: "Focus & Discipline.",
    meaning: "kỷ luật là cầu nối giữa mục tiêu và thành tựu.",
    author: "Jim Rohn",
    active: true,
    createdAt: "2026-08-04T00:00:00.000Z",
  },
  {
    id: "quote-5",
    word: "Embrace the Journey.",
    meaning: "mỗi ngày luyện tập là một bước tiến gần hơn tới ước mơ IELTS 7.5+.",
    author: "Xa Lộ English",
    active: true,
    createdAt: "2026-08-05T00:00:00.000Z",
  },
];

const STORAGE_KEY_NOTE = "xalo.student.dailyNote.v1";
const STORAGE_KEY_QUOTES = "xalo.student.quotesList.v1";
const STORAGE_KEY_MODE = "xalo.student.quoteMode.v1";

export const STUDENT_DAILY_NOTE_UPDATE_EVENT = "xalo-student-daily-note-updated";

let cacheNote: StudentDailyNote = { ...DEFAULT_STUDENT_DAILY_NOTE };

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDENT_DAILY_NOTE_UPDATE_EVENT));
}

/** ── Mode Management ── */
export function getQuoteMode(): QuoteMode {
  if (typeof window === "undefined") return "random";
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODE);
    return raw === "pinned" ? "pinned" : "random";
  } catch {
    return "random";
  }
}

export function saveQuoteMode(mode: QuoteMode): QuoteMode {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    dispatchUpdate();
    void persistDailyNotesToBackend({ mode });
  }
  return mode;
}

/** ── Quotes List Management ── */
export function getQuotesList(): QuoteItem[] {
  if (typeof window === "undefined") return DEFAULT_QUOTES_LIST;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTES);
    if (!raw) return DEFAULT_QUOTES_LIST;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_QUOTES_LIST;
  } catch {
    return DEFAULT_QUOTES_LIST;
  }
}

export function saveQuotesList(items: QuoteItem[]): QuoteItem[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(items));
    dispatchUpdate();
    void persistDailyNotesToBackend({ quotes: items });
  }
  return items;
}

export function addQuote(data: { word: string; meaning: string; author?: string }): QuoteItem[] {
  const current = getQuotesList();
  const newItem: QuoteItem = {
    id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    word: data.word.trim(),
    meaning: data.meaning.trim(),
    author: data.author?.trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  const nextList = [newItem, ...current];
  saveQuotesList(nextList);
  return nextList;
}

export function updateQuote(id: string, updates: Partial<Omit<QuoteItem, "id">>): QuoteItem[] {
  const current = getQuotesList();
  const nextList = current.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveQuotesList(nextList);
  return nextList;
}

export function deleteQuote(id: string): QuoteItem[] {
  const current = getQuotesList();
  const nextList = current.filter((item) => item.id !== id);
  saveQuotesList(nextList);
  return nextList;
}

export function toggleQuoteActive(id: string): QuoteItem[] {
  const current = getQuotesList();
  const nextList = current.map((item) =>
    item.id === id ? { ...item, active: !item.active } : item
  );
  saveQuotesList(nextList);
  return nextList;
}

/** Lấy ngẫu nhiên 1 câu Quote active trong kho */
export function getRandomQuote(): StudentDailyNote {
  const list = getQuotesList().filter((q) => q.active);
  if (list.length === 0) {
    return loadLocalNote();
  }
  const randomIndex = Math.floor(Math.random() * list.length);
  const picked = list[randomIndex];
  return {
    word: picked.word,
    meaning: picked.meaning,
    author: picked.author,
    updatedAt: picked.createdAt,
  };
}

/** Tự động xoay ngẫu nhiên 1 câu Quote mỗi ngày dựa theo ngày hiện tại (YYYY-MM-DD) */
export function getDailyQuoteForDate(date = new Date()): StudentDailyNote {
  const list = getQuotesList().filter((q) => q.active);
  if (list.length === 0) {
    return loadLocalNote();
  }
  
  // Tính hash integer theo ngày YYYY-MM-DD để mỗi ngày chọn 1 câu ngẫu nhiên cố định
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateHash = year * 10000 + month * 100 + day;
  
  const index = Math.abs(dateHash) % list.length;
  const picked = list[index];

  return {
    word: picked.word,
    meaning: picked.meaning,
    author: picked.author,
    updatedAt: picked.createdAt,
  };
}

/** ── Single Pinned Note Management ── */
function loadLocalNote(): StudentDailyNote {
  if (typeof window === "undefined") return { ...DEFAULT_STUDENT_DAILY_NOTE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTE);
    if (!raw) return { ...DEFAULT_STUDENT_DAILY_NOTE };
    const data = JSON.parse(raw) as Partial<StudentDailyNote>;
    return {
      word: data.word?.trim() || DEFAULT_STUDENT_DAILY_NOTE.word,
      meaning: data.meaning?.trim() || DEFAULT_STUDENT_DAILY_NOTE.meaning,
      updatedAt: data.updatedAt || DEFAULT_STUDENT_DAILY_NOTE.updatedAt,
    };
  } catch {
    return { ...DEFAULT_STUDENT_DAILY_NOTE };
  }
}

export function getStudentDailyNote(): StudentDailyNote {
  const mode = getQuoteMode();
  if (mode === "random") {
    return getDailyQuoteForDate(new Date());
  }
  if (typeof window !== "undefined" && cacheNote === DEFAULT_STUDENT_DAILY_NOTE) {
    cacheNote = loadLocalNote();
  }
  return cacheNote;
}

export function saveStudentDailyNote(next: Omit<StudentDailyNote, "updatedAt">): StudentDailyNote {
  const saved: StudentDailyNote = {
    word: next.word.trim() || DEFAULT_STUDENT_DAILY_NOTE.word,
    meaning: next.meaning.trim() || DEFAULT_STUDENT_DAILY_NOTE.meaning,
    updatedAt: new Date().toISOString(),
  };
  cacheNote = saved;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_NOTE, JSON.stringify(saved));
    dispatchUpdate();
    void persistDailyNotesToBackend({ pinnedWord: saved.word, pinnedMeaning: saved.meaning });
  }
  return saved;
}

export function refreshStudentDailyNote(): StudentDailyNote {
  cacheNote = loadLocalNote();
  dispatchUpdate();
  return getStudentDailyNote();
}

import { apiFetch } from "@/lib/auth";

export async function syncDailyNotesFromBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await apiFetch("/api/aca/daily-notes", { method: "GET" });
    if (!res.ok) return;
    const data = await res.json();
    if (data) {
      if (data.mode) localStorage.setItem(STORAGE_KEY_MODE, data.mode);
      if (Array.isArray(data.quotes)) localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(data.quotes));
      if (data.pinnedWord || data.pinnedMeaning) {
        const pinned: StudentDailyNote = {
          word: data.pinnedWord || DEFAULT_STUDENT_DAILY_NOTE.word,
          meaning: data.pinnedMeaning || DEFAULT_STUDENT_DAILY_NOTE.meaning,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_NOTE, JSON.stringify(pinned));
        cacheNote = pinned;
      }
      dispatchUpdate();
    }
  } catch (err) {
    console.warn("Could not sync daily notes from backend", err);
  }
}

async function persistDailyNotesToBackend(patch: { mode?: string; quotes?: QuoteItem[]; pinnedWord?: string; pinnedMeaning?: string }): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await apiFetch("/api/aca/daily-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch (err) {
    console.warn("Could not persist daily notes to backend", err);
  }
}

const NOTE_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export function formatDailyNoteDate(date = new Date()): string {
  return `${date.getDate()} ${NOTE_MONTHS[date.getMonth()]}`;
}

if (typeof window !== "undefined") {
  cacheNote = loadLocalNote();
  void syncDailyNotesFromBackend();
}
