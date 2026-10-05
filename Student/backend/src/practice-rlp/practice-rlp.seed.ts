import type { RlpSessionRecord } from '../rlp/rlp.types';

type PracticeRlpCurriculumRow = {
  testNo: number;
  /** dd/mm/yyyy */
  date: string;
  speaking?: { contents: string; recordingUrl?: string };
  writing?: { contents: string; recordingUrl?: string };
};

/**
 * Nội dung RLP lớp luyện đề (Minh Tâm) — LĐ 33 → 44.
 * Test 37 sheet ghi 8/6/2026 (lệch lịch) → chuẩn hóa 08/08/2026.
 */
const CURRICULUM: PracticeRlpCurriculumRow[] = [
  {
    testNo: 33,
    date: '11/07/2026',
    speaking: {
      contents: 'LĐ 33 | Speaking - Topic: Daily routines & Habits',
      recordingUrl: 'https://youtu.be/pxjPBS1rjmQ',
    },
    writing: {
      contents: 'LĐ 33 | Writing (Process + Advantages/Disadvantages)',
      recordingUrl: 'https://youtu.be/CQXCQZziqns',
    },
  },
  {
    testNo: 34,
    date: '18/07/2026',
    speaking: {
      contents: 'LĐ 34 | Speaking - Topic: Music',
      recordingUrl: 'https://youtu.be/iRbTj9NJpAI',
    },
    writing: {
      contents: 'LĐ 34 | Writing (Mixed charts + Two-part Questions)',
      recordingUrl: 'https://youtu.be/YVTXBM7mftg',
    },
  },
  {
    testNo: 35,
    date: '25/07/2026',
    speaking: {
      contents: 'LĐ 35 | Speaking - Topic: Animals',
      recordingUrl: 'https://youtu.be/SbVJk1phB2c',
    },
    writing: {
      contents: 'LĐ 35 | Writing (Dynamic charts + Positive/Negative)',
      recordingUrl: 'https://youtu.be/bZYVky3kr-c',
    },
  },
  {
    testNo: 36,
    date: '01/08/2026',
    speaking: {
      contents: 'LĐ 36 | Speaking - Topic: Communication',
      recordingUrl: 'https://youtu.be/8fQ00Lgv2XA',
    },
    writing: {
      contents: 'LĐ 36 | Writing (Dynamic charts + Agree/Disagree)',
      recordingUrl: 'https://youtu.be/BT3o7qK6NaE',
    },
  },
  {
    testNo: 37,
    date: '08/08/2026',
    speaking: {
      contents: 'LĐ 37 | Speaking - Topic: Clothes & Shopping',
      recordingUrl: 'https://youtu.be/cP7WKt0YC3Y',
    },
    writing: {
      contents: 'LĐ 37 | Writing (Static charts + Discussion)',
      recordingUrl: 'https://youtu.be/f5GPUbOcMxM',
    },
  },
  {
    testNo: 38,
    date: '15/08/2026',
    speaking: {
      contents: 'LĐ 38 | Speaking - Topic: Buildings & Accommodation',
      recordingUrl: 'https://youtu.be/sL3N0R6RMb4',
    },
    writing: {
      contents: 'LĐ 38 | Writing (Maps + Two-part Questions)',
      recordingUrl: 'https://youtu.be/rwrqQtwtai0',
    },
  },
  {
    testNo: 39,
    date: '22/08/2026',
    speaking: {
      contents: 'LĐ 39 | Speaking - Topic: Movies',
      recordingUrl: 'https://youtu.be/rf3xj1o0ER0',
    },
    writing: {
      contents: 'LĐ 39 | Writing (Process + Two-part Questions)',
      recordingUrl: 'https://youtu.be/WeEPyo8eSdc',
    },
  },
  {
    testNo: 40,
    date: '29/08/2026',
    writing: {
      contents: 'LĐ 40 | Writing (Dynamic charts + Agree/Disagree)',
      recordingUrl: 'https://youtu.be/x_SFFDj2Wkc',
    },
  },
  {
    testNo: 41,
    date: '05/09/2026',
    speaking: {
      contents: 'LĐ 41 | Speaking - Topic: Environment',
      recordingUrl: 'https://youtu.be/nieLV0QUI_s',
    },
    writing: {
      contents: 'LĐ 41 | Writing (Static charts + Discussion)',
      recordingUrl: 'https://youtu.be/wuerpp7Ae2E',
    },
  },
  {
    testNo: 42,
    date: '12/09/2026',
    speaking: {
      contents: 'LĐ 42 | Speaking - Topic: Sports',
      recordingUrl: 'https://youtu.be/bUSSBu7zTxQ',
    },
    writing: {
      contents: 'LĐ 42 | Writing (Maps + Positive/Negative)',
      recordingUrl: 'https://youtu.be/t8o4tnEr_E0',
    },
  },
  {
    testNo: 43,
    date: '19/09/2026',
    speaking: {
      contents: 'LĐ 43 | Speaking - Topic: Study & Education',
      recordingUrl: 'https://youtu.be/ZWu-pNoc4qo',
    },
    writing: {
      contents: 'LĐ 43 | Writing (Process + Agree/Disagree)',
      recordingUrl: 'https://youtu.be/NPCP1zUYh4I',
    },
  },
  {
    testNo: 44,
    date: '26/09/2026',
    speaking: {
      contents: 'LĐ 44 | Speaking - Topic: Science & Medicine',
      recordingUrl: '',
    },
    writing: {
      contents: 'LĐ 44 | WRITING',
      recordingUrl: '',
    },
  },
];

function addDaysDdMmYyyy(dateStr: string, days: number): string {
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function buildSession(
  no: number,
  date: string,
  skill: string,
  contents: string,
  recordingUrl: string,
): RlpSessionRecord {
  return {
    no,
    date,
    skill,
    contents,
    teacherNote: '—',
    deadline: addDaysDdMmYyyy(date, 7),
    homeworkStatus: 'not_assigned',
    attendance: 'present',
    lessonFileUrl: '',
    homeworkFileUrl: '',
    recordingUrl: recordingUrl || '',
  };
}

/** Danh sách buổi RLP luyện đề LĐ 33–44 (Speaking + Writing theo tuần). */
export function buildPracticeRlpCurriculumSessions(): RlpSessionRecord[] {
  const sessions: RlpSessionRecord[] = [];
  let no = 1;
  for (const row of CURRICULUM) {
    if (row.speaking) {
      sessions.push(
        buildSession(
          no++,
          row.date,
          'Speaking',
          row.speaking.contents,
          row.speaking.recordingUrl || '',
        ),
      );
    }
    if (row.writing) {
      sessions.push(
        buildSession(
          no++,
          row.date,
          'Writing',
          row.writing.contents,
          row.writing.recordingUrl || '',
        ),
      );
    }
  }
  return sessions;
}

/** @deprecated tên cũ — dùng curriculum LĐ 33–44 */
export const PRACTICE_RLP_DEMO_SESSIONS: RlpSessionRecord[] =
  buildPracticeRlpCurriculumSessions();

/** studentId đặc biệt — mẫu curriculum dùng cho seed / sync */
export const PRACTICE_RLP_CURRICULUM_STUDENT_ID = '__practice_rlp_curriculum__';
