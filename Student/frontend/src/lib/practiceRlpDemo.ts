import type { PracticeRlpSession } from "@/lib/practiceRlpApi";

function addDays(dateStr: string, days: number): string {
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function sess(
  no: number,
  date: string,
  skill: string,
  contents: string,
  recordingUrl: string,
): PracticeRlpSession {
  return {
    no,
    date,
    skill,
    contents,
    teacherNote: "—",
    deadline: addDays(date, 7),
    homeworkStatus: "not_assigned",
    attendance: "present",
    lessonFileUrl: "",
    homeworkFileUrl: "",
    recordingUrl,
  };
}

/**
 * RLP lớp luyện đề LĐ 33–44 (fallback FE khi API trống).
 * Test 37: sheet 8/6 → 08/08/2026.
 */
export const PRACTICE_RLP_DEMO_SESSIONS: PracticeRlpSession[] = (() => {
  const rows: Array<{
    date: string;
    speaking?: [string, string];
    writing?: [string, string];
  }> = [
    {
      date: "11/07/2026",
      speaking: ["LĐ 33 | Speaking - Topic: Daily routines & Habits", "https://youtu.be/pxjPBS1rjmQ"],
      writing: ["LĐ 33 | Writing (Process + Advantages/Disadvantages)", "https://youtu.be/CQXCQZziqns"],
    },
    {
      date: "18/07/2026",
      speaking: ["LĐ 34 | Speaking - Topic: Music", "https://youtu.be/iRbTj9NJpAI"],
      writing: ["LĐ 34 | Writing (Mixed charts + Two-part Questions)", "https://youtu.be/YVTXBM7mftg"],
    },
    {
      date: "25/07/2026",
      speaking: ["LĐ 35 | Speaking - Topic: Animals", "https://youtu.be/SbVJk1phB2c"],
      writing: ["LĐ 35 | Writing (Dynamic charts + Positive/Negative)", "https://youtu.be/bZYVky3kr-c"],
    },
    {
      date: "01/08/2026",
      speaking: ["LĐ 36 | Speaking - Topic: Communication", "https://youtu.be/8fQ00Lgv2XA"],
      writing: ["LĐ 36 | Writing (Dynamic charts + Agree/Disagree)", "https://youtu.be/BT3o7qK6NaE"],
    },
    {
      date: "08/08/2026",
      speaking: ["LĐ 37 | Speaking - Topic: Clothes & Shopping", "https://youtu.be/cP7WKt0YC3Y"],
      writing: ["LĐ 37 | Writing (Static charts + Discussion)", "https://youtu.be/f5GPUbOcMxM"],
    },
    {
      date: "15/08/2026",
      speaking: ["LĐ 38 | Speaking - Topic: Buildings & Accommodation", "https://youtu.be/sL3N0R6RMb4"],
      writing: ["LĐ 38 | Writing (Maps + Two-part Questions)", "https://youtu.be/rwrqQtwtai0"],
    },
    {
      date: "22/08/2026",
      speaking: ["LĐ 39 | Speaking - Topic: Movies", "https://youtu.be/rf3xj1o0ER0"],
      writing: ["LĐ 39 | Writing (Process + Two-part Questions)", "https://youtu.be/WeEPyo8eSdc"],
    },
    {
      date: "29/08/2026",
      writing: ["LĐ 40 | Writing (Dynamic charts + Agree/Disagree)", "https://youtu.be/x_SFFDj2Wkc"],
    },
    {
      date: "05/09/2026",
      speaking: ["LĐ 41 | Speaking - Topic: Environment", "https://youtu.be/nieLV0QUI_s"],
      writing: ["LĐ 41 | Writing (Static charts + Discussion)", "https://youtu.be/wuerpp7Ae2E"],
    },
    {
      date: "12/09/2026",
      speaking: ["LĐ 42 | Speaking - Topic: Sports", "https://youtu.be/bUSSBu7zTxQ"],
      writing: ["LĐ 42 | Writing (Maps + Positive/Negative)", "https://youtu.be/t8o4tnEr_E0"],
    },
    {
      date: "19/09/2026",
      speaking: ["LĐ 43 | Speaking - Topic: Study & Education", "https://youtu.be/ZWu-pNoc4qo"],
      writing: ["LĐ 43 | Writing (Process + Agree/Disagree)", "https://youtu.be/NPCP1zUYh4I"],
    },
    {
      date: "26/09/2026",
      speaking: ["LĐ 44 | Speaking - Topic: Science & Medicine", ""],
      writing: ["LĐ 44 | WRITING", ""],
    },
  ];

  const out: PracticeRlpSession[] = [];
  let no = 1;
  for (const row of rows) {
    if (row.speaking) out.push(sess(no++, row.date, "Speaking", row.speaking[0], row.speaking[1]));
    if (row.writing) out.push(sess(no++, row.date, "Writing", row.writing[0], row.writing[1]));
  }
  return out;
})();

export function withPracticeRlpDemoFallback(
  sessions: PracticeRlpSession[],
): PracticeRlpSession[] {
  return sessions.length > 0 ? sessions : PRACTICE_RLP_DEMO_SESSIONS;
}
