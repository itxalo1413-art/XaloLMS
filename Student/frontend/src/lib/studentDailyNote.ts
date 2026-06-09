export type StudentDailyNote = {
  word: string;
  meaning: string;
  updatedAt: string;
};

/** Nền note — 20% lavender (#fbf5ff) + 80% trắng, khớp --color-background */
export const DAILY_NOTE_SURFACE = "color-mix(in srgb, #fbf5ff 20%, #ffffff 80%)";

export const DEFAULT_STUDENT_DAILY_NOTE: StudentDailyNote = {
  word: "Clouds.",
  meaning: "there's divinity in the clouds.",
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = "xalo.student.dailyNote.v1";
export const STUDENT_DAILY_NOTE_UPDATE_EVENT = "xalo-student-daily-note-updated";

let cache: StudentDailyNote = { ...DEFAULT_STUDENT_DAILY_NOTE };

function dispatchUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDENT_DAILY_NOTE_UPDATE_EVENT));
}

function loadLocal(): StudentDailyNote {
  if (typeof window === "undefined") return { ...DEFAULT_STUDENT_DAILY_NOTE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  if (typeof window !== "undefined" && cache === DEFAULT_STUDENT_DAILY_NOTE) {
    cache = loadLocal();
  }
  return cache;
}

export function saveStudentDailyNote(next: Omit<StudentDailyNote, "updatedAt">): StudentDailyNote {
  const saved: StudentDailyNote = {
    word: next.word.trim() || DEFAULT_STUDENT_DAILY_NOTE.word,
    meaning: next.meaning.trim() || DEFAULT_STUDENT_DAILY_NOTE.meaning,
    updatedAt: new Date().toISOString(),
  };
  cache = saved;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    dispatchUpdate();
  }
  return saved;
}

export function refreshStudentDailyNote(): StudentDailyNote {
  cache = loadLocal();
  dispatchUpdate();
  return cache;
}

const NOTE_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export function formatDailyNoteDate(date = new Date()): string {
  return `${date.getDate()} ${NOTE_MONTHS[date.getMonth()]}`;
}

if (typeof window !== "undefined") {
  cache = loadLocal();
}
