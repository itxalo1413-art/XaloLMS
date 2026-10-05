/**
 * Seed / upsert lớp + HV tháng 9 từ sheet vận hành.
 * Chạy: node scripts/seed-sept-2026-roster.js
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  if (!uri) {
    const user = process.env.MONGODB_USER?.trim();
    const password = process.env.MONGODB_PASSWORD;
    const host = process.env.MONGODB_HOST?.trim();
    const db = (process.env.MONGODB_DB || 'XaloLMS').trim();
    if (!user || !password || !host) {
      throw new Error('Thiếu MONGODB_URI / MONGODB_USER+PASSWORD+HOST');
    }
    uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${db}?authSource=admin`;
  }
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

function score(v) {
  if (v === undefined || v === null || v === '') return '-';
  const s = String(v).trim().replace(',', '.');
  return s || '-';
}

function fixEmail(raw) {
  let e = String(raw || '').trim();
  if (!e) return '';
  if (e.includes('drive.google') || e.startsWith('http')) return '';
  if (!e.includes('@') && /gmail\.com$/i.test(e)) {
    e = e.replace(/gmail\.com$/i, '@gmail.com');
  }
  if (!e.includes('@')) return '';
  return e.toLowerCase();
}

function fixPhone(raw) {
  let p = String(raw || '').trim().replace(/\s+/g, '');
  if (!p) return '';
  if (p.includes('@') || p.startsWith('http')) return '';
  if (/^\d{9}$/.test(p)) p = `0${p}`;
  return p;
}

function normalizeClassification(cls) {
  const c = (cls || '').trim().toLowerCase();
  if (!c) return '';
  if (c.includes('combo') || c.includes('-') || c.includes('_') || c.includes('premium'))
    return 'Combo';
  if (c.includes('học lại') || c.includes('hoc lai')) return 'Học lại';
  if (c.includes('chuyển lớp') || c.includes('chuyen lop')) return 'Chuyển lớp';
  if (c.includes('bảo lưu') || c.includes('bao luu')) return 'Lớp lẻ mới';
  if (c.includes('tái đong') || c.includes('tái đóng') || c.includes('tai dong') || c.includes('tai đóng'))
    return 'Lớp lẻ mới';
  if (c.includes('học thử') || c.includes('hoc thu')) return 'Lớp lẻ mới';
  return 'Lớp lẻ mới';
}

function slugCohortDate(ddmmyyyy) {
  const m = String(ddmmyyyy || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  return `${m[3]}${m[2].padStart(2, '0')}${m[1].padStart(2, '0')}`;
}

const MONTH = 9;

/** @type {Array<{classCode:string,name:string,type:string,openDate:string,teacher:string,currentPhase:string,phaseStartDate:string,phaseStudents:number,nextPhaseStartDate:string,nextPhase:string,slotsToEnroll:number,rlpInfo?:string,students:Array<object>}>} */
const CLASSES = [
  {
    classCode: 'U246C1',
    name: 'XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải',
    type: 'Lớp đang diễn ra',
    openDate: '26/08/2024',
    teacher: 'Duy Khải',
    currentPhase: 'S-R',
    phaseStartDate: '24/07/2026',
    phaseStudents: 1,
    nextPhaseStartDate: '09/09/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 11,
    rlpInfo: '2024RLP_ONL - U - M/W/F - 18001945 - 260824',
    students: [
      {
        stt: 1,
        name: 'Lê Thị Kim Hà',
        phone: '0339637609',
        email: 'hale28012009@gmail.com',
        classification: 'Học viên combo học tiếp',
        scores: { l: '7.5', r: '6.5', w: '6.0', s: '5.0', o: '6.5' },
        bcbLink: '[Final PC 15/6] Lê Thị Kim Hà',
      },
      {
        stt: 2,
        name: 'Phạm Diễm My',
        phone: '0934836769',
        email: 'phamdiemmy5@gmail.com',
        scores: { l: '5.0', r: '5.0', w: '5.5', s: '5.5', o: '5.5' },
        bcbLink: 'Phạm Diễm My',
      },
    ],
  },
  {
    classCode: 'U246C2.1',
    name: 'XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải',
    type: 'Lớp đang diễn ra',
    openDate: '10/02/2025',
    teacher: 'Duy Khải',
    currentPhase: 'W-L',
    phaseStartDate: '10/08/2026',
    phaseStudents: 3,
    nextPhaseStartDate: '30/09/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 9,
    rlpInfo: '2025RLP_ONL - U M/W/F - 19452130 - 100225',
    students: [
      {
        stt: 1,
        name: 'Nguyễn Đặng Bảo Trâm',
        phone: '0365110889',
        email: 'nguyendangbaotram.2009@gmail.com',
        classification: 'Tái đong',
        scores: { l: '6.5', r: '6.0', w: '5.0', s: '4.0', o: '5.5' },
        bcbLink: '[Final PC 15/6] Nguyễn Đặng Bảo Trâm',
      },
      {
        stt: 2,
        name: 'Lục Yến Đào',
        phone: '0972296540',
        email: 'lucyendao2007@gmail.com',
        scores: { l: '5.5', r: '5.5', w: '5.0', s: '4.5', o: '5.0' },
        bcbLink: 'Lục Yến Đào',
      },
      {
        stt: 3,
        name: 'Lý Trần Mai Quỳnh',
        phone: '0817360527',
        email: 'maiquynhh5224@gmail.com',
        scores: { l: '4.0', r: '4.5', w: '1.0', s: '5.0', o: '3.5' },
        bcbLink: 'Lý Trần Mai Quỳnh',
      },
      {
        stt: 4,
        name: 'Nguyễn Minh Thi',
        phone: '0797301119',
        email: 'mintthi1710@gmail.com',
        classification: 'Học thử 1 buổi trước khi đăng kí',
        scores: { l: '4.5', r: '3.5', w: '4.0', s: '4.5', o: '4.0' },
        bcbLink: 'Nguyễn Minh Thi',
      },
      {
        stt: 5,
        name: 'Huỳnh Minh Quí',
        phone: '0356578217',
        email: 'quiacdcpag73@gmail.com',
        scores: { l: '5.5', r: '7.0', w: '5.5', s: '4.5', o: '5.5' },
        bcbLink:
          'https://docs.google.com/spreadsheets/d/14yZKlfVaAMEbpnaBPc20ly6bEKjgb4ALcDxgXEFJ0hI/edit?usp=drivesdk',
      },
      { stt: 6, name: 'Lê Đỗ Quỳnh Trâm' },
    ],
  },
  {
    classCode: 'U246C2.2',
    name: 'XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa',
    type: 'Lớp đang diễn ra',
    openDate: '17/09/2024',
    teacher: 'Đăng Khoa',
    currentPhase: 'W-L',
    phaseStartDate: '12/08/2026',
    phaseStudents: 5,
    nextPhaseStartDate: '30/09/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 7,
    rlpInfo: '2025RLP_ONL - U M/W/F - 19452130 - 170925',
    students: [],
  },
  {
    classCode: 'U357C1',
    name: 'XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải',
    type: 'Lớp đang diễn ra',
    openDate: '27/03/2025',
    teacher: 'Như Hải',
    currentPhase: 'S-R',
    phaseStartDate: '13/08/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '26/09/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 10,
    rlpInfo: '2025RLP_ONL - U T/T/S - 18001945 - 270325',
    students: [
      {
        stt: 1,
        name: 'Lâm Ngọc Quyên',
        email: 'quyenlam09032010@gmail.com',
        bcbLink: 'https://drive.google.com/open?id=16vOEkZC03T89t0OMvDnQSceihVhjRoa9',
      },
      { stt: 2, name: 'Phạm Thị Thu Hiền' },
    ],
  },
  {
    classCode: 'U357C2',
    name: 'XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải',
    type: 'Lớp đang diễn ra',
    openDate: '27/06/2024',
    teacher: 'Duy Khải',
    currentPhase: 'W-L',
    phaseStartDate: '22/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '06/10/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 12,
    rlpInfo: '2024RLP_ONL - U T/T/S - 19452130 - 270624',
    students: [],
  },
  {
    classCode: 'USSC1',
    name: 'XLE RLP_Upstream - S/S - C1 - GV Nguyễn Văn Đăng Duy',
    type: 'Lớp đang diễn ra',
    openDate: '18/04/2026',
    teacher: 'Đăng Duy',
    currentPhase: 'W-L',
    phaseStartDate: '26/07/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '12/09/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 10,
    rlpInfo: '2026RLP_ONL - U S/S - 09001130 - 180426',
    students: [
      {
        stt: 1,
        name: 'Nguyễn Hà Thu Hoài',
        phone: '0928059339',
        email: 'hahoai7711@gmail.com',
        scores: { l: '5.0', r: '3.5', w: '2.0', s: '5.0', o: '4.0' },
        bcbLink: 'Thu Hoài',
      },
      {
        stt: 2,
        name: 'Lê Thị Hà Nhi',
        phone: '0768160926',
        email: 'lethihanhi2705@gmail.com',
        scores: { l: '6.5', r: '8.0', w: '4.0', s: '4.5', o: '5.5' },
        bcbLink: 'Lê Thị Hà Nhi',
      },
      {
        stt: 3,
        name: 'Nguyễn Lê Hà My',
        phone: '0325502646',
        email: 'myn92964@gmail.com',
        classification: 'Học viên combo học tiếp',
        scores: { l: '5.5', r: '5.5', w: '6.0', s: '4.0', o: '5.5' },
        bcbLink: '[Final PC 19/5] Nguyễn Lê Hà My',
      },
    ],
  },
  {
    classCode: 'M246C1',
    name: 'XLE RLP_Momentum - 246 - C1 - GV Lê Như Hải',
    type: 'Lớp đang diễn ra',
    openDate: '26/08/2024',
    teacher: 'Như Hải',
    currentPhase: 'S-R',
    phaseStartDate: '27/07/2026',
    phaseStudents: 7,
    nextPhaseStartDate: '14/09/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 3,
    rlpInfo: '2024RLP_OFF - M M/W/F - 18001945 - 260824',
    students: [
      {
        stt: 1,
        name: 'Tiển Thục Bình',
        phone: '0798440610',
        email: 'tienthucbinh@gmail.com',
        classification: 'Tái đóng',
        scores: { l: '6', r: '6', w: '6', s: '4.5', o: '5.5' },
        bcbLink: '[Final F 24/4] Tiến Thục Bình',
      },
      {
        stt: 2,
        name: 'Võ Ngọc Hân',
        phone: '0843892802',
        email: 'ngochan651240@gmail.com',
        classification: 'Bảo lưu học tiếp',
        scores: { l: '4.5', r: '6.0', w: '4.5', s: '4.5', o: '5.0' },
        bcbLink:
          'https://docs.google.com/spreadsheets/d/1RqGM674LmtaiTxDwFFY5c7exgvGgwJFIXh_s9Bf51Us/edit?gid=1360077078#gid=1360077078',
      },
      {
        stt: 3,
        name: 'Vũ Anh Thuỳ',
        email: 'ah5915821@gmail.com',
        scores: { l: '4.5', r: '4.5', w: '4.5', s: '5.5', o: '5.0' },
        bcbLink: 'Vũ Anh Thuỳ',
        note: 'Email gốc sheet thiếu @: ah5915821gmail.com',
      },
    ],
  },
  {
    classCode: 'M246C2',
    name: 'XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải',
    type: 'Lớp đang diễn ra',
    openDate: '03/05/2024',
    teacher: 'Như Hải',
    currentPhase: 'W-L',
    phaseStartDate: '10/08/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '28/09/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 8,
    rlpInfo: '2024RLP_OFF - M M/W/F - 19452130 - 030524',
    students: [
      { stt: 1, name: 'Vũ Minh Châu', classification: 'Tái đóng' },
      {
        stt: 2,
        name: 'Nguyễn Thị Huyền Trân',
        phone: '0383798266',
        email: 'huyentran798266@gmail.com',
        classification: 'Học viên combo',
        scores: { l: '5.0', r: '5.0', w: '4.5', s: '4.0', o: '4.5' },
        bcbLink: '[Final F 24/4] Nguyễn Thị Huyền Trân',
      },
      {
        stt: 3,
        name: 'Đỗ Ngọc Minh Vy',
        phone: '0812991225',
        email: 'dngmingdii9104@gmail.com',
        scores: { l: '5.5', r: '5.5', w: '5.5', s: '5.0', o: '5.5' },
        bcbLink:
          'https://docs.google.com/spreadsheets/d/14r0Lxc5JtNcNV9IV_Ef3BbIB_m2iyrtWceqWtOIQiDc/edit?usp=drivesdk',
      },
    ],
  },
  {
    classCode: 'S246C2',
    name: 'XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh',
    type: 'Lớp đang diễn ra',
    openDate: '28/10/2024',
    teacher: 'Quang Minh',
    currentPhase: 'S-R',
    phaseStartDate: '12/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '28/09/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 12,
    students: [
      {
        stt: 1,
        name: 'Phan Minh Huân',
        phone: '0858584709',
        email: 'minhhuan2107@gmail.com',
      },
    ],
  },
  {
    classCode: 'S357C2',
    name: 'XLE RLP_Soar - 357 - C2 - GV Lê Như Hải',
    type: 'Lớp đang diễn ra',
    openDate: '29/10/2024',
    teacher: 'Như Hải',
    currentPhase: 'W-L',
    phaseStartDate: '18/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '01/10/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 12,
    rlpInfo: '2024RLP_ONL - S T/T/S - 19452130 - 291024',
    students: [],
  },
  {
    classCode: 'SSSC1',
    name: 'XLE RLP_Soar - S/S - GV Nguyễn Lưu Minh Tâm',
    type: 'Lớp đang diễn ra',
    openDate: '06/12/2025',
    teacher: 'Minh Tâm',
    currentPhase: 'S-R',
    phaseStartDate: '22/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '04/10/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 12,
    rlpInfo: '2025RLP_ONL - S S/S - 9001130 - 061225',
    students: [],
  },
  {
    classCode: 'PC246C1_HS_150726',
    name: 'XLE RLP_PRE CORE - 246 - 18002000 - GV Hoàng Sa',
    type: 'Lớp đang diễn ra',
    openDate: '15/07/2026',
    teacher: 'Hoàng Sa',
    currentPhase: 'Pre IELTS',
    phaseStartDate: '15/07/2026',
    phaseStudents: 6,
    nextPhaseStartDate: '16/09/2026',
    nextPhase: 'CORE 2',
    slotsToEnroll: 6,
    rlpInfo: 'RLP_PRE CORE - 246 - 18002000 - 150726 - GV Hoàng Sa',
    students: [
      {
        stt: 1,
        name: 'Ngô Gia Minh',
        phone: '0356394949',
        email: 'dh5230138@student.stu.edu.vn',
      },
      {
        stt: 2,
        name: 'Nguyễn Thị Thanh Tâm',
        phone: '0949804640',
        email: 'than.htaam041088@gmail.com',
        scores: { l: '4.0', r: '6.0', w: '4.0', s: '3.0', o: '4.5' },
        bcbLink: 'Nguyễn Thị Thanh Tâm',
      },
      {
        stt: 3,
        name: 'Nguyễn Ngọc Thuỳ Linh',
        phone: '0367009414',
        email: 'thuylinhbato0909@gmail.com',
        scores: { l: '3.5', r: '4.0', w: '3.0', s: '3.5', o: '3.5' },
        bcbLink: 'Nguyễn Ngọc Thuỳ Linh',
      },
      {
        stt: 4,
        name: 'Lục Yến Đào',
        phone: '0972296540',
        email: 'lucyendao2007@gmail.com',
        scores: { l: '5.5', r: '5.5', w: '5.0', s: '4.5', o: '5.0' },
        bcbLink: 'Lục Yến Đào',
        note: 'Cũng có tên ở Upstream 246 C2 Duy Khải — giữ ở PRE CORE (tháng 9).',
      },
      {
        stt: 5,
        name: 'Nguyễn Thị Phúc Lợi',
        phone: '0369528468',
        email: 'phucloibt2k7@gmail.com',
        scores: { l: '1.5', r: '5.0', w: '1.5', s: '3.0', o: '3.0' },
        bcbLink: 'Nguyễn Thị Phúc Lợi',
      },
      {
        stt: 6,
        name: 'Nguyễn Đỗ Trúc Lam',
        phone: '0842531197',
        email: 'chipschips2708@gmail.com',
        scores: { l: '4.0', r: '4.0', w: '2.5', s: '3.5', o: '3.5' },
        bcbLink: 'Nguyễn Đỗ Trúc Lam',
      },
    ],
  },
  {
    classCode: 'PC246C1_TT_140826',
    name: 'XLE RLP_PRE CORE - 246 - 18002000 - GV Thanh Tâm',
    type: 'Lớp đang diễn ra',
    openDate: '14/08/2026',
    teacher: 'Thanh Tâm',
    currentPhase: 'Pre IELTS',
    phaseStartDate: '14/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '14/10/2026',
    nextPhase: 'CORE 2',
    slotsToEnroll: 10,
    students: [],
  },
  {
    classCode: 'F357C1_190926',
    name: 'XLE RLP_Foundation - 357 - C1 - GV Hoàng Sa',
    type: 'Lớp mới',
    openDate: '',
    teacher: 'Hoàng Sa',
    currentPhase: '-',
    phaseStartDate: '-',
    phaseStudents: 0,
    nextPhaseStartDate: '19/09/2026',
    nextPhase: '',
    slotsToEnroll: 10,
    students: [
      {
        stt: 1,
        name: 'Phan Thành Quí',
        classification: 'Học viên bảo lưu học tiếp',
      },
      {
        stt: 2,
        name: 'Nguyễn Thị Huỳnh Như',
        classification: 'Học viên chuyển lớp',
      },
      {
        stt: 3,
        name: 'Nguyễn Lê Yến Nhi',
        classification: 'Học viên bảo lưu học tiếp',
      },
      {
        stt: 4,
        name: 'Trần Gia Hân',
        phone: '0949937170',
        email: 'giahancutiis1vn@gmail.com',
      },
      {
        stt: 5,
        name: 'Quách Phú Giáp',
        phone: '0899672013',
        email: 'quachgiap59@gmail.com',
      },
      {
        stt: 6,
        name: 'Bùi Thiên Lan',
        phone: '0395433347',
        email: 'lanbui127@gmail.com',
        note: 'Email sheet gốc: Lanbui127com@gmail.com → chuẩn hóa lanbui127@gmail.com',
      },
    ],
  },
  {
    classCode: 'A246C1',
    name: 'XLE RLP_Advanced - 246 - C1 - GV Nguyễn Văn Đăng Duy',
    type: 'Lớp mới',
    openDate: '',
    teacher: 'Đăng Duy',
    currentPhase: '-',
    phaseStartDate: '-',
    phaseStudents: 0,
    nextPhaseStartDate: '28/09/2026',
    nextPhase: '',
    slotsToEnroll: 10,
    students: [
      {
        stt: 1,
        name: 'Bùi Phạm Diệu Linh',
        phone: '0343311238',
        email: 'lchipi055@gmail.com',
        classification: 'Học viên học lại',
        scores: { l: '5.5', r: '3.5', w: '4.5', s: '6.0', o: '5.0' },
        bcbLink: '[FINAL A 0210] Bùi Phạm Diệu Linh',
      },
      {
        stt: 2,
        name: 'Hồ Hoàng Minh Thư',
        phone: '0769843894',
        email: 'hohoangminhthu3894@gmail.com',
        classification: 'HV Combo',
        scores: { l: '5.5', r: '5.5', w: '6.0', s: '5.5', o: '5.5' },
        bcbLink: '[Final M 18/5] Hồ Hoàng Minh Thư',
      },
      {
        stt: 3,
        name: 'Võ Quốc Khải',
        phone: '0845861845',
        email: 'quockhai1411@gmail.com',
        classification: 'Tái đóng',
        scores: { l: '8.0', r: '7.0', w: '6.0', s: '6.0', o: '7.0' },
        bcbLink: 'Võ Quốc Khải',
      },
      {
        stt: 4,
        name: 'Lê Hoàng Phương Khanh',
        phone: '0903547324',
        email: 'lhpkhanh272@gmail.com',
        classification: 'Học viên học lại',
      },
    ],
  },
];

async function ensureUser(db, { name, email }) {
  const e = fixEmail(email);
  if (!e) return;
  const users = db.collection('users');
  const existing = await users.findOne({ email: e });
  if (existing) return;
  const passwordHash = await bcrypt.hash('Student@123!', 10);
  await users.insertOne({
    name: name || 'Học viên',
    email: e,
    passwordHash,
    role: 'HS',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`  + user HS ${e} / Student@123!`);
}

async function upsertClass(db, cls) {
  const classes = db.collection('aca_classes');
  const cohort =
    slugCohortDate(cls.openDate) ||
    slugCohortDate(cls.phaseStartDate) ||
    slugCohortDate(cls.nextPhaseStartDate) ||
    '202609';

  const payload = {
    classCode: cls.classCode,
    name: cls.name,
    month: MONTH,
    type: cls.type,
    openDate: cls.openDate || '',
    teacher: cls.teacher,
    currentPhase: cls.currentPhase,
    phaseStartDate: cls.phaseStartDate || '',
    phaseStudents: cls.phaseStudents || 0,
    nextPhaseStartDate: cls.nextPhaseStartDate || '',
    nextPhase: cls.nextPhase || '',
    slotsToEnroll: cls.slotsToEnroll || 0,
    rlpCohortKey: cohort,
    progressNote: cls.rlpInfo || '',
    updatedAt: new Date(),
  };

  const existing = await classes.findOne({ name: cls.name, month: MONTH });
  if (existing) {
    await classes.updateOne({ _id: existing._id }, { $set: payload });
    return String(existing._id);
  }
  const ins = await classes.insertOne({ ...payload, createdAt: new Date() });
  console.log(`  + class ${cls.classCode} → ${cls.name}`);
  return String(ins.insertedId);
}

async function upsertStudent(db, classId, rlpCohortKey, classCode, st) {
  const students = db.collection('aca_students');
  const email = fixEmail(st.email);
  const phone = fixPhone(st.phone);
  const name = String(st.name || '').trim();
  if (!name) return { skipped: true };

  const scores = {
    l: score(st.scores?.l),
    r: score(st.scores?.r),
    w: score(st.scores?.w),
    s: score(st.scores?.s),
    o: score(st.scores?.o),
  };

  const rawClassification = String(st.classification || '').trim();
  const classification = normalizeClassification(rawClassification);

  const setDoc = {
    classId,
    rlpCohortKey,
    stt: st.stt || 0,
    name,
    phone,
    email,
    classification,
    rawClassification,
    scores,
    bcbLink: String(st.bcbLink || '').trim(),
    note: String(st.note || '').trim(),
    l1: classCode,
    updatedAt: new Date(),
  };

  let existing = null;
  if (email) {
    existing = await students.findOne({ email });
  }
  if (!existing) {
    existing = await students.findOne({
      name,
      classId,
    });
  }

  if (existing) {
    await students.updateOne({ _id: existing._id }, { $set: setDoc });
    await ensureUser(db, { name, email });
    return { updated: true, name, email };
  }

  await students.insertOne({
    ...setDoc,
    finalScores: { l: '-', r: '-', w: '-', s: '-', o: '-' },
    cycles: [],
    focusSkills: [],
    registeredSlotIds: [],
    createdAt: new Date(),
  });
  await ensureUser(db, { name, email });
  return { created: true, name, email };
}

async function main() {
  loadEnv();
  const uri = getMongoUri();
  console.log('Connecting…');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  let classCount = 0;
  let studentCreated = 0;
  let studentUpdated = 0;

  for (const cls of CLASSES) {
    console.log(`\n=== ${cls.name}`);
    const classId = await upsertClass(db, cls);
    classCount += 1;
    const classDoc = await db.collection('aca_classes').findOne({
      _id: new mongoose.Types.ObjectId(classId),
    });
    const cohort = classDoc?.rlpCohortKey || '';

    for (const st of cls.students) {
      const res = await upsertStudent(db, classId, cohort, cls.classCode, st);
      if (res.skipped) continue;
      if (res.created) {
        studentCreated += 1;
        console.log(`  + HV ${st.name}${st.email ? ` <${fixEmail(st.email)}>` : ''}`);
      } else if (res.updated) {
        studentUpdated += 1;
        console.log(`  ~ HV ${st.name}`);
      }
    }
  }

  console.log('\n--- Done ---');
  console.log(`Classes upserted: ${classCount}`);
  console.log(`Students created: ${studentCreated}, updated: ${studentUpdated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
