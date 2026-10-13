/**
 * Lớp Ongoing theo Drive của từng GV.
 * Tên lớp / className theo quy tắc hệ thống (XLE RLP_… / 2026RLP_ONL 1:1 …),
 * không dùng tên folder Drive làm display name.
 */

export type OngoingGroupClassSeed = {
  classCode: string;
  name: string;
  month: number;
  type: string;
  openDate: string;
  teacher: string;
  currentPhase: string;
  phaseStartDate: string;
  phaseStudents: number;
  nextPhaseStartDate: string;
  nextPhase: string;
  slotsToEnroll: number;
  schedule: string;
  links: { id: string; label: string; value: string; url: string }[];
  /** Cập nhật mọi bản ghi cùng classCode (lớp theo tháng trùng mã). */
  syncAllByClassCode?: boolean;
};

export type Ongoing11ClassSeed = {
  status: 'Đang diễn ra' | 'Bảo lưu' | 'Đã kết thúc';
  className: string;
  studentName: string;
  teacher: string;
  schedule: string;
  startDate: string;
  endDate: string;
  progress: string;
  materials: string;
  /** className cũ trên DB cần rename về tên hệ thống */
  legacyClassNames?: string[];
};

function materialsLink(
  driveUrl: string,
  label: string,
): { id: string; label: string; value: string; url: string }[] {
  return [
    {
      id: 'lesson',
      label: 'THƯ MỤC BÀI GIẢNG',
      value: label,
      url: driveUrl,
    },
  ];
}

// ─── Nguyễn Thị Hoàng Sa ─────────────────────────────────────────────
const HOANG_SA = 'Nguyễn Thị Hoàng Sa';
const HOANG_SA_DRIVE =
  'https://drive.google.com/drive/folders/116R811fUeA4zhm_7qAw30y6DYUZUBXpv';

export const HOANG_SA_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    classCode: 'CORE2_246_18002000_160926',
    name: 'XLE RLP_CORE 2 - 246 - 18002000 - GV Nguyễn Thị Hoàng Sa',
    month: 9,
    type: 'Lớp đang diễn ra',
    openDate: '16/09/2026',
    teacher: HOANG_SA,
    currentPhase: 'CORE 2',
    phaseStartDate: '16/09/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 18h00 - 20h00',
    links: materialsLink(HOANG_SA_DRIVE, 'CORE 2 - 246 - 18002000 - 160926'),
  },
  {
    classCode: 'FOU_246_C2_170726',
    name: 'XLE RLP_Foundation - 246 - C2 - GV Nguyễn Thị Hoàng Sa',
    month: 7,
    type: 'Lớp đang diễn ra',
    openDate: '17/07/2026',
    teacher: HOANG_SA,
    currentPhase: 'Foundation',
    phaseStartDate: '17/07/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6 (C2)',
    links: materialsLink(HOANG_SA_DRIVE, 'FOUNDATION - 246 - C2 - 170726'),
  },
  {
    classCode: 'F357C1_190926',
    name: 'XLE RLP_Foundation - 357 - 18002000 - GV Nguyễn Thị Hoàng Sa',
    month: 9,
    type: 'Lớp đang diễn ra',
    openDate: '19/09/2026',
    teacher: HOANG_SA,
    currentPhase: 'Foundation',
    phaseStartDate: '19/09/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: 'Thứ 3, 5, 7: 18h00 - 20h00',
    links: materialsLink(HOANG_SA_DRIVE, 'FOUNDATION - 357 - 18002000 - 190926'),
  },
  {
    classCode: 'PC246C1_HS_150726',
    name: 'XLE RLP_PRE CORE - 246 - 18002000 - GV Nguyễn Thị Hoàng Sa',
    month: 7,
    type: 'Lớp đang diễn ra',
    openDate: '15/07/2026',
    teacher: HOANG_SA,
    currentPhase: 'Pre IELTS',
    phaseStartDate: '15/07/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: 'CORE 2',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 18h00 - 20h00',
    links: materialsLink(HOANG_SA_DRIVE, 'PRE CORE - 246 - 18002000 - 150726'),
  },
];

export const HOANG_SA_STALE_CLASS_CODES = [
  'FOU_357_18002000_190926',
  'PC_246_18002000_150726',
] as const;

export const HOANG_SA_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Nguyễn Lan Anh',
    studentName: 'Nguyễn Lan Anh',
    teacher: HOANG_SA,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Hoàng Sa',
    materials: HOANG_SA_DRIVE,
    legacyClassNames: ['1:1 Nguyễn Lan Anh'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Phan Ngọc Bảo Nghi',
    studentName: 'Phan Ngọc Bảo Nghi',
    teacher: HOANG_SA,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Hoàng Sa',
    materials: HOANG_SA_DRIVE,
    legacyClassNames: ['1:1 Phan Ngọc Bảo Nghi'],
  },
];

// ─── Lê Như Hải ──────────────────────────────────────────────────────
const NHU_HAI = 'Lê Như Hải';
const NHU_HAI_DRIVE =
  'https://drive.google.com/drive/folders/1flBoX_KgMSPDxIvD3pzkoSsQvHABIghF';

export const NHU_HAI_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    classCode: 'M246C1',
    name: 'XLE RLP_Momentum - 246 - C1 - GV Lê Như Hải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '26/08/2024',
    teacher: NHU_HAI,
    currentPhase: 'S-R',
    phaseStartDate: '04/05/2026',
    phaseStudents: 3,
    nextPhaseStartDate: '15/06/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 7,
    schedule: 'Thứ 2, 4, 6: 18h00 - 19h45',
    links: materialsLink(NHU_HAI_DRIVE, 'OFF - M M/W/F - 18001945 - 260824'),
    syncAllByClassCode: true,
  },
  {
    classCode: 'M246C2',
    name: 'XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '03/05/2024',
    teacher: NHU_HAI,
    currentPhase: 'W-L',
    phaseStartDate: '29/06/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '10/08/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 8,
    schedule: 'Thứ 2, 4, 6: 19h45 - 21h30',
    links: materialsLink(NHU_HAI_DRIVE, 'OFF - M M/W/F - 19452130 - 030524'),
    syncAllByClassCode: true,
  },
  {
    classCode: 'S357C2',
    name: 'XLE RLP_Soar - 357 - C2 - GV Lê Như Hải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '29/10/2024',
    teacher: NHU_HAI,
    currentPhase: 'W-L',
    phaseStartDate: '07/07/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '15/08/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 10,
    schedule: 'Thứ 3, 5, 7: 19h45 - 21h30',
    links: materialsLink(NHU_HAI_DRIVE, 'ONL - S T/T/S - 19452130 - 291024'),
    syncAllByClassCode: true,
  },
  {
    classCode: 'U357C1',
    name: 'XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '27/03/2025',
    teacher: NHU_HAI,
    currentPhase: 'S-R',
    phaseStartDate: '01/07/2026',
    phaseStudents: 3,
    nextPhaseStartDate: '12/08/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 9,
    schedule: 'Thứ 3, 5, 7: 18h00 - 19h45',
    links: materialsLink(NHU_HAI_DRIVE, 'ONL - U T/T/S - 18001945 - 270325'),
    syncAllByClassCode: true,
  },
  {
    classCode: '2025RLP-ONL-NHUHAI-U',
    name: '2025RLP-ONL-NHUHAI-U',
    month: 12,
    type: 'Lớp đang diễn ra',
    openDate: '20/12/2025',
    teacher: NHU_HAI,
    currentPhase: 'Chặng 1',
    phaseStartDate: '20/12/2025',
    phaseStudents: 1,
    nextPhaseStartDate: '24/02/2026',
    nextPhase: 'Chặng 2',
    slotsToEnroll: 10,
    schedule: 'Thứ 3: 18h00 - 19h45\nThứ 5: 18h00 - 19h45\nThứ 7: 18h00 - 19h45',
    links: materialsLink(NHU_HAI_DRIVE, '2025RLP-ONL-NHUHAI-U'),
    syncAllByClassCode: true,
  },
];

export const NHU_HAI_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Nguyễn Phương Yến',
    studentName: 'Nguyễn Phương Yến',
    teacher: NHU_HAI,
    schedule: 'K1: [36h] 1 buổi/1 tuần - 3h/buổi\nT7 14h-17h',
    startDate: '21/3/2026',
    endDate: '27/6/2026',
    progress: 'Ongoing — Drive GV Lê Như Hải',
    materials: NHU_HAI_DRIVE,
    legacyClassNames: ['1:1 Nguyễn Phương Yến'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Phan Nguyễn Song Thư',
    studentName: 'Phan Nguyễn Song Thư',
    teacher: NHU_HAI,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Lê Như Hải',
    materials: NHU_HAI_DRIVE,
    legacyClassNames: ['1:1 Phan Nguyễn Song Thư'],
  },
];

// ─── Nguyễn Văn Đăng Duy ─────────────────────────────────────────────
const DANG_DUY = 'Nguyễn Văn Đăng Duy';
const DANG_DUY_DRIVE =
  'https://drive.google.com/drive/folders/1sHraZJk43hkqonFyMiRdxfLOfQXCOYHM';

export const DANG_DUY_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    // Drive: OFF - A M/W/F - 18001945 - 250326
    classCode: 'A246C1',
    name: 'XLE RLP_Advanced - 246 - C1 - GV Nguyễn Văn Đăng Duy',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '25/03/2026',
    teacher: DANG_DUY,
    currentPhase: 'S-R',
    phaseStartDate: '22/06/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '03/08/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 8,
    schedule: 'Thứ 2, 4, 6: 18h00 - 19h45',
    links: materialsLink(DANG_DUY_DRIVE, 'OFF - A M/W/F - 18001945 - 250326'),
    syncAllByClassCode: true,
  },
  {
    // Drive: ONL - U S/S - 09001130 - 180426
    classCode: 'USSC1',
    name: 'XLE RLP_Upstream - S/S - C1 - GV Nguyễn Văn Đăng Duy',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '18/04/2026',
    teacher: DANG_DUY,
    currentPhase: 'S-R',
    phaseStartDate: '26/07/2026',
    phaseStudents: 4,
    nextPhaseStartDate: '12/09/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 8,
    schedule: 'Thứ 7, CN: 09h00 - 11h30',
    links: materialsLink(DANG_DUY_DRIVE, 'ONL - U S/S - 09001130 - 180426'),
    syncAllByClassCode: true,
  },
  {
    // Drive: ONL - U T/T/S - 18001945 - 061026
    classCode: 'U357_18001945_061026',
    name: 'XLE RLP_Upstream - 357 - 18001945 - GV Nguyễn Văn Đăng Duy',
    month: 10,
    type: 'Lớp đang diễn ra',
    openDate: '06/10/2026',
    teacher: DANG_DUY,
    currentPhase: 'S-R',
    phaseStartDate: '06/10/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: 'W-L',
    slotsToEnroll: 10,
    schedule: 'Thứ 3, 5, 7: 18h00 - 19h45',
    links: materialsLink(DANG_DUY_DRIVE, 'ONL - U T/T/S - 18001945 - 061026'),
  },
  {
    // Drive: THPTQG - Mastery 21002300 - 150126
    classCode: 'THPTQG_MASTERY_21002300_150126',
    name: 'XLE RLP_THPTQG - Mastery - 21002300 - GV Nguyễn Văn Đăng Duy',
    month: 1,
    type: 'Lớp đang diễn ra',
    openDate: '15/01/2026',
    teacher: DANG_DUY,
    currentPhase: 'Mastery',
    phaseStartDate: '15/01/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: '21h00 - 23h00',
    links: materialsLink(DANG_DUY_DRIVE, 'THPTQG - Mastery 21002300 - 150126'),
  },
  {
    // Drive: XLE Class_Foundation - T/T/S - 19452130 - 180626
    classCode: 'F357C2_180626',
    name: 'XLE RLP_Foundation - 357 - C2 - GV Nguyễn Văn Đăng Duy',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '18/06/2026',
    teacher: DANG_DUY,
    currentPhase: 'Foundation',
    phaseStartDate: '18/06/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: 'Thứ 3, 5, 7: 19h45 - 21h30',
    links: materialsLink(
      DANG_DUY_DRIVE,
      'XLE Class_Foundation - T/T/S - 19452130 - 180626',
    ),
    syncAllByClassCode: true,
  },
];

export const DANG_DUY_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Bùi Vũ Bảo Anh',
    studentName: 'Bùi Vũ Bảo Anh',
    teacher: DANG_DUY,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Đăng Duy',
    materials: DANG_DUY_DRIVE,
    legacyClassNames: ['1:1 Bùi Vũ Bảo Anh'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Dương Thùy Dung',
    studentName: 'Dương Thùy Dung',
    teacher: DANG_DUY,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Đăng Duy',
    materials: DANG_DUY_DRIVE,
    legacyClassNames: ['1:1 Dương Thùy Dung'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Lê Nguyễn Diệu Châu',
    studentName: 'Lê Nguyễn Diệu Châu',
    teacher: DANG_DUY,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Đăng Duy',
    materials: DANG_DUY_DRIVE,
    legacyClassNames: ['1:1 Lê Nguyễn Diệu Châu', '2025RLP_ONL 1:1 Lê Nguyễn Diệu Châu'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Thiều Thảo Chi',
    studentName: 'Thiều Thảo Chi',
    teacher: DANG_DUY,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Đăng Duy',
    materials: DANG_DUY_DRIVE,
    legacyClassNames: ['1:1 Thiếu Thảo Chi', '1:1 Thiều Thảo Chi', '2026RLP_ONL 1:1 Thiếu Thảo Chi'],
  },
];

// ─── Nguyễn Lưu Minh Tâm ─────────────────────────────────────────────
const MINH_TAM = 'Nguyễn Lưu Minh Tâm';
const MINH_TAM_DRIVE =
  'https://drive.google.com/drive/folders/1l02d8KAVsCSs14OqJ8j9bJsY9bv3aMhS';

export const MINH_TAM_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    // Drive: ONL - S S/S - 9001130 - 061225
    classCode: 'SSSC1',
    name: 'XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '06/12/2025',
    teacher: MINH_TAM,
    currentPhase: 'S-R',
    phaseStartDate: '05/07/2026',
    phaseStudents: 3,
    nextPhaseStartDate: '13/08/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 9,
    schedule: 'Thứ 7, CN: 09h00 - 11h30',
    links: materialsLink(MINH_TAM_DRIVE, 'ONL - S S/S - 9001130 - 061225'),
    syncAllByClassCode: true,
  },
  {
    // Drive: OFF - A M/W/F - 18001945 - 300926
    classCode: 'A246_18001945_300926',
    name: 'XLE RLP_Advanced - 246 - 18001945 - GV Nguyễn Lưu Minh Tâm',
    month: 9,
    type: 'Lớp đang diễn ra',
    openDate: '30/09/2026',
    teacher: MINH_TAM,
    currentPhase: 'S-R',
    phaseStartDate: '30/09/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: 'W-L',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 18h00 - 19h45',
    links: materialsLink(MINH_TAM_DRIVE, 'OFF - A M/W/F - 18001945 - 300926'),
  },
  {
    // Drive: XLE Class | LỚP LUYỆN ĐỀ
    classCode: 'PRACTICE_LD_MINHTAM',
    name: 'XLE RLP_Luyện đề - GV Nguyễn Lưu Minh Tâm',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '01/06/2026',
    teacher: MINH_TAM,
    currentPhase: 'Luyện đề',
    phaseStartDate: '01/06/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 20,
    schedule: 'Lớp luyện đề tuần',
    links: materialsLink(MINH_TAM_DRIVE, 'XLE Class | LỚP LUYỆN ĐỀ'),
  },
];

export const MINH_TAM_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Chu Kim Ngân',
    studentName: 'Chu Kim Ngân',
    teacher: MINH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Minh Tâm',
    materials: MINH_TAM_DRIVE,
    legacyClassNames: ['1:1 Chu Kim Ngân'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Đoàn Hà Anh',
    studentName: 'Đoàn Hà Anh',
    teacher: MINH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Minh Tâm',
    materials: MINH_TAM_DRIVE,
    legacyClassNames: ['1:1 Đoàn Hà Anh'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Nguyễn Anh Tuấn',
    studentName: 'Nguyễn Anh Tuấn',
    teacher: MINH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Minh Tâm',
    materials: MINH_TAM_DRIVE,
    legacyClassNames: ['1:1 Nguyễn Anh Tuấn'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Trần Minh Anh',
    studentName: 'Trần Minh Anh',
    teacher: MINH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Minh Tâm',
    materials: MINH_TAM_DRIVE,
    legacyClassNames: ['1:1 Trần Minh Anh'],
  },
];

// ─── Thanh Tâm ───────────────────────────────────────────────────────
const THANH_TAM = 'Thanh Tâm';
const THANH_TAM_DRIVE =
  'https://drive.google.com/drive/folders/1ibABaWtd8V57KzVjpLbycs4ojNE9LN0E';

export const THANH_TAM_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    // Drive: CORE 2 - 357 - 18002000 / 180726 - GV Thanh Tâm
    classCode: 'CORE2_357_18002000_180726',
    name: 'XLE RLP_CORE 2 - 357 - 18002000 - GV Thanh Tâm',
    month: 7,
    type: 'Lớp đang diễn ra',
    openDate: '18/07/2026',
    teacher: THANH_TAM,
    currentPhase: 'CORE 2',
    phaseStartDate: '18/07/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: '',
    slotsToEnroll: 10,
    schedule: 'Thứ 3, 5, 7: 18h00 - 20h00',
    links: materialsLink(THANH_TAM_DRIVE, 'CORE 2 - 357 - 18002000 / 180726'),
  },
  {
    // Drive: ONL - PRE CORE - 246 - 20002200 - 210826
    classCode: 'PC246_20002200_210826',
    name: 'XLE RLP_PRE CORE - 246 - 20002200 - GV Thanh Tâm',
    month: 8,
    type: 'Lớp đang diễn ra',
    openDate: '21/08/2026',
    teacher: THANH_TAM,
    currentPhase: 'Pre IELTS',
    phaseStartDate: '21/08/2026',
    phaseStudents: 0,
    nextPhaseStartDate: '',
    nextPhase: 'CORE 2',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 20h00 - 22h00',
    links: materialsLink(THANH_TAM_DRIVE, 'ONL - PRE CORE - 246 - 20002200 - 210826'),
  },
];

export const THANH_TAM_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Đoàn Nguyễn Tiến Phát',
    studentName: 'Đoàn Nguyễn Tiến Phát',
    teacher: THANH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Thanh Tâm',
    materials: THANH_TAM_DRIVE,
    legacyClassNames: ['1:1 Đoàn Nguyễn Tiến Phát', '1:1 Đoàn Nguyễn Tiến Phát - GV Thanh Tâm'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Phạm Ngân Hà',
    studentName: 'Phạm Ngân Hà',
    teacher: THANH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Thanh Tâm',
    materials: THANH_TAM_DRIVE,
    legacyClassNames: ['1:1 Phạm Ngân Hà', '1:1 Phạm Ngân Hà - GV Thanh Tâm'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Võ Thùy Dương',
    studentName: 'Võ Thùy Dương',
    teacher: THANH_TAM,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Thanh Tâm',
    materials: THANH_TAM_DRIVE,
    legacyClassNames: ['1:1 Võ Thùy Dương'],
  },
];

// ─── Tất Duy Khải ────────────────────────────────────────────────────
const DUY_KHAI = 'Tất Duy Khải';
const DUY_KHAI_DRIVE =
  'https://drive.google.com/drive/folders/14HItAI1d0D_4U4jkV3Zr6C37q4C2toPQ';

export const DUY_KHAI_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [
  {
    // Drive: ONL - U M/W/F - 18001945
    classCode: 'U246C1',
    name: 'XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '26/08/2024',
    teacher: DUY_KHAI,
    currentPhase: 'S-R',
    phaseStartDate: '29/04/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '12/06/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 18h00 - 19h45',
    links: materialsLink(DUY_KHAI_DRIVE, 'ONL - U M/W/F - 18001945'),
    syncAllByClassCode: true,
  },
  {
    // Drive: ONL - U M/W/F - 19452130
    classCode: 'U246C2.1',
    name: 'XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '10/02/2025',
    teacher: DUY_KHAI,
    currentPhase: 'W-L',
    phaseStartDate: '26/06/2026',
    phaseStudents: 2,
    nextPhaseStartDate: '07/08/2026',
    nextPhase: 'S-R',
    slotsToEnroll: 10,
    schedule: 'Thứ 2, 4, 6: 19h45 - 21h30',
    links: materialsLink(DUY_KHAI_DRIVE, 'ONL - U M/W/F - 19452130'),
    syncAllByClassCode: true,
  },
  {
    // Drive: ONL - U T/T/S - 19452130 - 270624
    classCode: 'U357C2',
    name: 'XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải',
    month: 6,
    type: 'Lớp đang diễn ra',
    openDate: '27/06/2024',
    teacher: DUY_KHAI,
    currentPhase: 'S-R',
    phaseStartDate: '10/07/2026',
    phaseStudents: 5,
    nextPhaseStartDate: '21/08/2026',
    nextPhase: 'W-L',
    slotsToEnroll: 7,
    schedule: 'Thứ 3, 5, 7: 19h45 - 21h30',
    links: materialsLink(DUY_KHAI_DRIVE, 'ONL - U T/T/S - 19452130 - 270624'),
    syncAllByClassCode: true,
  },
];

export const DUY_KHAI_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Hoàng Huệ Duyên',
    studentName: 'Hoàng Huệ Duyên',
    teacher: DUY_KHAI,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Tất Duy Khải',
    materials: DUY_KHAI_DRIVE,
    legacyClassNames: ['1:1 Hoàng Huệ Duyên'],
  },
];

// ─── Huỳnh Gia Phú ───────────────────────────────────────────────────
const GIA_PHU = 'Huỳnh Gia Phú';
const GIA_PHU_DRIVE =
  'https://drive.google.com/drive/folders/1C12vj34cgk7FE6bTyPdHdfPXXrN7U8RX';

/** Drive Ongoing chỉ có lớp 1:1 */
export const GIA_PHU_ONGOING_GROUP_CLASSES: OngoingGroupClassSeed[] = [];

export const GIA_PHU_ONGOING_11_CLASSES: Ongoing11ClassSeed[] = [
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Cao Thị Mai Trang',
    studentName: 'Cao Thị Mai Trang',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Cao Thị Mai Trang', '2025RLP_ONL 1:1 Cao Thị Mai Trang'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Châu Nguyễn Bảo Trân',
    studentName: 'Châu Nguyễn Bảo Trân',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Châu Nguyễn Bảo Trân'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Dương Bảo Ngọc',
    studentName: 'Dương Bảo Ngọc',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Dương Bảo Ngọc', '2025RLP_ONL 1:1 Dương Bảo Ngọc'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Ngô Vũ Bảo Trân',
    studentName: 'Ngô Vũ Bảo Trân',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Ngô Vũ Bảo Trân', '2025RLP_ONL 1:1 Ngô Vũ Bảo Trân'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Nguyễn Minh Thư',
    studentName: 'Nguyễn Minh Thư',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Nguyễn Minh Thư', '2026RLP_OFF 1:1 Nguyễn Minh Thư'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Trương Minh Thuận',
    studentName: 'Trương Minh Thuận',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Trương Minh Thuận', '2026RLP_OFF 1:1 Trương Minh Thuận'],
  },
  {
    status: 'Đang diễn ra',
    className: '2026RLP_ONL 1:1 Vũ Ngọc Uyên Nghi',
    studentName: 'Vũ Ngọc Uyên Nghi',
    teacher: GIA_PHU,
    schedule: '',
    startDate: '',
    endDate: '',
    progress: 'Ongoing — Drive GV Huỳnh Gia Phú',
    materials: GIA_PHU_DRIVE,
    legacyClassNames: ['1:1 Vũ Ngọc Uyên Nghi'],
  },
];
