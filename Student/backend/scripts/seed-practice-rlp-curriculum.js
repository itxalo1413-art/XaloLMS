/**
 * Sync nội dung RLP luyện đề LĐ 33–44 vào Mongo (mọi practice_rlp_stores).
 * Chạy: node scripts/seed-practice-rlp-curriculum.js
 *
 * Mặc định: ghi đè sessions (nội dung mới).
 * Giữ điểm danh/BTVN nếu cùng date+skill: PASS --merge
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function getMongoUri() {
  let uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) throw new Error('Thiếu MONGODB_URI');
  try {
    const u = new URL(uri);
    if (u.hostname.endsWith('.mongodb.net') && !u.searchParams.has('authSource')) {
      u.searchParams.set('authSource', 'admin');
      uri = u.toString();
    }
  } catch {
    /* keep */
  }
  return uri;
}

function addDaysDdMmYyyy(dateStr, days) {
  const m = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function sess(no, date, skill, contents, recordingUrl) {
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

const CURRICULUM = [
  {
    testNo: 33,
    date: '11/07/2026',
    speaking: ['LĐ 33 | Speaking - Topic: Daily routines & Habits', 'https://youtu.be/pxjPBS1rjmQ'],
    writing: ['LĐ 33 | Writing (Process + Advantages/Disadvantages)', 'https://youtu.be/CQXCQZziqns'],
  },
  {
    testNo: 34,
    date: '18/07/2026',
    speaking: ['LĐ 34 | Speaking - Topic: Music', 'https://youtu.be/iRbTj9NJpAI'],
    writing: ['LĐ 34 | Writing (Mixed charts + Two-part Questions)', 'https://youtu.be/YVTXBM7mftg'],
  },
  {
    testNo: 35,
    date: '25/07/2026',
    speaking: ['LĐ 35 | Speaking - Topic: Animals', 'https://youtu.be/SbVJk1phB2c'],
    writing: ['LĐ 35 | Writing (Dynamic charts + Positive/Negative)', 'https://youtu.be/bZYVky3kr-c'],
  },
  {
    testNo: 36,
    date: '01/08/2026',
    speaking: ['LĐ 36 | Speaking - Topic: Communication', 'https://youtu.be/8fQ00Lgv2XA'],
    writing: ['LĐ 36 | Writing (Dynamic charts + Agree/Disagree)', 'https://youtu.be/BT3o7qK6NaE'],
  },
  {
    testNo: 37,
    date: '08/08/2026',
    speaking: ['LĐ 37 | Speaking - Topic: Clothes & Shopping', 'https://youtu.be/cP7WKt0YC3Y'],
    writing: ['LĐ 37 | Writing (Static charts + Discussion)', 'https://youtu.be/f5GPUbOcMxM'],
  },
  {
    testNo: 38,
    date: '15/08/2026',
    speaking: ['LĐ 38 | Speaking - Topic: Buildings & Accommodation', 'https://youtu.be/sL3N0R6RMb4'],
    writing: ['LĐ 38 | Writing (Maps + Two-part Questions)', 'https://youtu.be/rwrqQtwtai0'],
  },
  {
    testNo: 39,
    date: '22/08/2026',
    speaking: ['LĐ 39 | Speaking - Topic: Movies', 'https://youtu.be/rf3xj1o0ER0'],
    writing: ['LĐ 39 | Writing (Process + Two-part Questions)', 'https://youtu.be/WeEPyo8eSdc'],
  },
  {
    testNo: 40,
    date: '29/08/2026',
    writing: ['LĐ 40 | Writing (Dynamic charts + Agree/Disagree)', 'https://youtu.be/x_SFFDj2Wkc'],
  },
  {
    testNo: 41,
    date: '05/09/2026',
    speaking: ['LĐ 41 | Speaking - Topic: Environment', 'https://youtu.be/nieLV0QUI_s'],
    writing: ['LĐ 41 | Writing (Static charts + Discussion)', 'https://youtu.be/wuerpp7Ae2E'],
  },
  {
    testNo: 42,
    date: '12/09/2026',
    speaking: ['LĐ 42 | Speaking - Topic: Sports', 'https://youtu.be/bUSSBu7zTxQ'],
    writing: ['LĐ 42 | Writing (Maps + Positive/Negative)', 'https://youtu.be/t8o4tnEr_E0'],
  },
  {
    testNo: 43,
    date: '19/09/2026',
    speaking: ['LĐ 43 | Speaking - Topic: Study & Education', 'https://youtu.be/ZWu-pNoc4qo'],
    writing: ['LĐ 43 | Writing (Process + Agree/Disagree)', 'https://youtu.be/NPCP1zUYh4I'],
  },
  {
    testNo: 44,
    date: '26/09/2026',
    speaking: ['LĐ 44 | Speaking - Topic: Science & Medicine', ''],
    writing: ['LĐ 44 | WRITING', ''],
  },
];

function buildSessions() {
  const sessions = [];
  let no = 1;
  for (const row of CURRICULUM) {
    if (row.speaking) {
      sessions.push(sess(no++, row.date, 'Speaking', row.speaking[0], row.speaking[1]));
    }
    if (row.writing) {
      sessions.push(sess(no++, row.date, 'Writing', row.writing[0], row.writing[1]));
    }
  }
  return sessions;
}

function mergeSessions(existing, curriculum) {
  const byKey = new Map();
  for (const s of existing || []) {
    const key = `${s.date}|${s.skill}`;
    byKey.set(key, s);
  }
  return curriculum.map((c) => {
    const prev = byKey.get(`${c.date}|${c.skill}`);
    if (!prev) return c;
    return {
      ...c,
      teacherNote: prev.teacherNote || c.teacherNote,
      homeworkStatus: prev.homeworkStatus || c.homeworkStatus,
      attendance: prev.attendance || c.attendance,
      homeworkFileUrl: prev.homeworkFileUrl || '',
      lessonFileUrl: prev.lessonFileUrl || c.lessonFileUrl,
    };
  });
}

const CURRICULUM_ID = '__practice_rlp_curriculum__';

async function main() {
  loadEnv();
  const merge = process.argv.includes('--merge');
  const sessions = buildSessions();
  console.log(`Curriculum sessions: ${sessions.length} (merge=${merge})`);

  await mongoose.connect(getMongoUri());
  const col = mongoose.connection.db.collection('practice_rlp_stores');

  await col.updateOne(
    { studentId: CURRICULUM_ID },
    { $set: { sessions, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  console.log(`+ curriculum store ${CURRICULUM_ID}`);

  const docs = await col.find({ studentId: { $ne: CURRICULUM_ID } }).toArray();
  let updated = 0;
  for (const doc of docs) {
    const next = merge ? mergeSessions(doc.sessions, sessions) : sessions;
    await col.updateOne(
      { _id: doc._id },
      { $set: { sessions: next, updatedAt: new Date() } },
    );
    updated += 1;
    console.log(`~ ${doc.studentId} (${(doc.sessions || []).length} → ${next.length})`);
  }

  // Seed demo student if missing store
  const email = (process.env.STUDENT_SEED_EMAIL || 'nguyenduong939705@gmail.com')
    .trim()
    .toLowerCase();
  const user = await mongoose.connection.db.collection('users').findOne({ email });
  if (user) {
    const sid = String(user._id);
    const exists = await col.findOne({ studentId: sid });
    if (!exists) {
      await col.insertOne({
        studentId: sid,
        sessions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`+ demo student store ${email}`);
    }
  }

  console.log(`\nDone. Stores updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
