import { Injectable, OnModuleInit, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { AcaClass, AcaClassDocument } from './schemas/aca-class.schema';
import { AcaStudent, AcaStudentDocument } from './schemas/aca-student.schema';
import {
  PracticeClassRegistration,
  PracticeClassRegistrationDocument,
} from '../practice-class/schemas/practice-class-registration.schema';
import { AcaPracticeWeek, AcaPracticeWeekDocument } from './schemas/aca-practice-week.schema';
import { AcaPracticeStudent, AcaPracticeStudentDocument } from './schemas/aca-practice-student.schema';
import { Aca11Class, Aca11ClassDocument } from './schemas/aca-11-class.schema';
import { AcaWeeklyDoc, AcaWeeklyDocDocument } from './schemas/aca-weekly-doc.schema';
import { AcaTeacherAssignment, AcaTeacherAssignmentDocument } from './schemas/aca-teacher-assignment.schema';
import { AcaFreeSlot, AcaFreeSlotDocument } from './schemas/aca-free-slot.schema';
import { AcaTeacherProfile, AcaTeacherProfileDocument } from './schemas/aca-teacher-profile.schema';
import { WritingSubmission, WritingSubmissionDocument } from '../writing-submission/schemas/writing-submission.schema';
import { computeWritingDueDateFromSubmitted } from '../writing-submission/writing-deadline.util';
import { RlpCourseStore, RlpCourseStoreDocument } from '../rlp/schemas/rlp-course-store.schema';
import { computeStudentRlpProgress, countClassSessionsCompleted, formatAttendanceCount, formatHomeworkPercent } from '../rlp/rlp-progress.util';
import {
  FIRST_STAGE_SESSIONS,
  FULL_COURSE_SESSIONS,
  hasCompletedFirstStage,
  hasCompletedFullCourse,
  requiredFullCourseSessions,
} from '../academic-warning/academic-warning.rules';
import {
  buildRlpStoreKey,
  normalizeOpenDate,
  resolveClassCohortKey,
  slugCohortDate,
} from '../rlp/rlp-cohort.util';
import { UsersService } from '../users/users.service';
import { MockTestService } from '../mock-test/mock-test.service';
import { PracticeClassService } from '../practice-class/practice-class.service';
import { getCurrentRealtimePracticeWeekRange, type PracticeWeekLean } from '../practice-class/practice-class-week.util';

import { DailyNote, DailyNoteDocument } from './schemas/daily-note.schema';
import { MockTestRequest, MockTestRequestDocument } from './schemas/mock-test-request.schema';
import { CourseSettings, CourseSettingsDocument } from './schemas/course-settings.schema';
import {
  GuestDiagnosisLead,
  GuestDiagnosisLeadDocument,
  type GuestDiagnosisLeadStatus,
} from './schemas/guest-diagnosis-lead.schema';
import {
  EntranceTestBooking,
  EntranceTestBookingDocument,
} from './schemas/entrance-test-booking.schema';
import {
  AcaKvStore,
  AcaKvStoreDocument,
} from './schemas/aca-kv-store.schema';
import {
  StudentProfileStore,
  StudentProfileStoreDocument,
} from '../student-profile/schemas/student-profile-store.schema';
import {
  VAN_THI_THANH_TRUC,
  vanThiThanhTrucDiagnosis,
  VAN_THI_THANH_TRUC_SUPPORT_SPEAKING,
  VAN_THI_THANH_TRUC_LUYEN_DE,
  VAN_THI_THANH_TRUC_SOAR_RLP,
} from './van-thi-thanh-truc.seed';
import {
  THIEU_THAO_CHI,
  thieuThaoChiDiagnosis,
  THIEU_THAO_CHI_ONL_11_RLP,
  THIEU_THAO_CHI_SUPPORT_SPEAKING,
} from './thieu-thao-chi.seed';
import { buildRlpSchedulePlan, formatViDate, parseViDate } from '../rlp/rlp-schedule.util';
import {
  FinalTest,
  FinalTestDocument,
  type FinalTestFormat,
  type FinalTestStatus,
  type FinalTestType,
} from './schemas/final-test.schema';

function normalizeClassification(cls: string): string {
  const c = (cls || '').trim().toLowerCase();
  if (c.includes('combo') || c.includes('-') || c.includes('_') || c.includes('2') || c.includes('premium')) return 'Combo';
  if (c.includes('học lại') || c.includes('hoc lai')) return 'Học lại';
  if (c.includes('chuyển lớp') || c.includes('chuyen lop')) return 'Chuyển lớp';
  return 'Lớp lẻ mới';
}

/** Cấp chương trình từ mã lớp: F/M/U/S/A → FOUND/MMNT/UPSTR/SOAR/ADV. */
function classLevelPrefix(classCode?: string | null): string {
  const raw = String(classCode || '').trim();
  if (!raw) return '';
  const p = raw.split(/[-_\s]/)[0].trim().toUpperCase();
  if (!p) return '';
  if (p.startsWith('FOU') || p.startsWith('FOUND') || (p.startsWith('F') && !p.startsWith('FOA'))) {
    return 'FOUND';
  }
  if (p.startsWith('M')) return 'MMNT';
  if (p.startsWith('U')) return 'UPSTR';
  if (p.startsWith('S')) return 'SOAR';
  if (p.startsWith('A')) return 'ADV';
  return p;
}

/** Học lại = gán vào cấp đã từng học (cycles / L1–L3 / lớp trước). */
function isHocLaiEnrollment(
  student: {
    l1?: string;
    l2?: string;
    l3?: string;
    cycles?: Array<{ classCode?: string }>;
  } | null | undefined,
  nextClassCode: string,
  prevClassCode?: string,
): boolean {
  const nextLevel = classLevelPrefix(nextClassCode);
  if (!nextLevel) return false;

  const priorCodes = new Set<string>();
  for (const code of [prevClassCode, student?.l1, student?.l2, student?.l3]) {
    if (String(code || '').trim()) priorCodes.add(String(code).trim());
  }
  for (const cyc of student?.cycles || []) {
    if (String(cyc?.classCode || '').trim()) {
      priorCodes.add(String(cyc.classCode).trim());
    }
  }

  for (const code of priorCodes) {
    const level = classLevelPrefix(code);
    if (level && level === nextLevel) return true;
  }
  return false;
}

@Injectable()
export class AcaManagementService implements OnModuleInit {
  constructor(
    @InjectModel(AcaClass.name) private readonly classModel: Model<AcaClassDocument>,
    @InjectModel(AcaStudent.name) private readonly studentModel: Model<AcaStudentDocument>,
    @InjectModel(PracticeClassRegistration.name)
    private readonly practiceRegistrationModel: Model<PracticeClassRegistrationDocument>,
    @InjectModel(AcaPracticeWeek.name) private readonly practiceWeekModel: Model<AcaPracticeWeekDocument>,
    @InjectModel(AcaPracticeStudent.name) private readonly practiceStudentModel: Model<AcaPracticeStudentDocument>,
    @InjectModel(Aca11Class.name) private readonly aca11Model: Model<Aca11ClassDocument>,
    @InjectModel(AcaWeeklyDoc.name) private readonly weeklyDocModel: Model<AcaWeeklyDocDocument>,
    @InjectModel(AcaTeacherAssignment.name) private readonly teacherAssignmentModel: Model<AcaTeacherAssignmentDocument>,
    @InjectModel(AcaFreeSlot.name) private readonly freeSlotModel: Model<AcaFreeSlotDocument>,
    @InjectModel(AcaTeacherProfile.name) private readonly teacherProfileModel: Model<AcaTeacherProfileDocument>,
    @InjectModel(WritingSubmission.name) private readonly writingSubmissionModel: Model<WritingSubmissionDocument>,
    @InjectModel(RlpCourseStore.name) private readonly rlpCourseStoreModel: Model<RlpCourseStoreDocument>,
    @InjectModel(DailyNote.name) private readonly dailyNoteModel: Model<DailyNoteDocument>,
    @InjectModel(MockTestRequest.name) private readonly mockTestRequestModel: Model<MockTestRequestDocument>,
    @InjectModel(CourseSettings.name) private readonly courseSettingsModel: Model<CourseSettingsDocument>,
    @InjectModel(GuestDiagnosisLead.name) private readonly guestLeadModel: Model<GuestDiagnosisLeadDocument>,
    @InjectModel(EntranceTestBooking.name) private readonly entranceBookingModel: Model<EntranceTestBookingDocument>,
    @InjectModel(FinalTest.name) private readonly finalTestModel: Model<FinalTestDocument>,
    @InjectModel(AcaKvStore.name) private readonly kvModel: Model<AcaKvStoreDocument>,
    @InjectModel(StudentProfileStore.name)
    private readonly profileStore: Model<StudentProfileStoreDocument>,
    private readonly usersService: UsersService,
    private readonly mockTests: MockTestService,
    private readonly practiceClassService: PracticeClassService,
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  private async seedInitialData() {
    // Seed Monthly Classes if DB is empty
    const classCount = await this.classModel.countDocuments().exec();
    if (classCount === 0) {
      const initialClasses = [
      // Month 5
      { classCode: "U246C2.2", name: "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", month: 5, type: "Lớp đang diễn ra", openDate: "17/09/2024", teacher: "Đăng Khoa", currentPhase: "S-R", phaseStartDate: "18/05/2026", phaseStudents: 7, nextPhaseStartDate: "29/06/2026", nextPhase: "W-L", slotsToEnroll: 5 },
      { classCode: "U246C2.1", name: "XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "10/02/2025", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "15/05/2026", phaseStudents: 4, nextPhaseStartDate: "26/06/2026", nextPhase: "W-L", slotsToEnroll: 8 },
      { classCode: "U357C1", name: "XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "27/03/2025", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "20/05/2026", phaseStudents: 3, nextPhaseStartDate: "01/07/2026", nextPhase: "S-R", slotsToEnroll: 9 },
      { classCode: "U357C2", name: "XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "27/06/2024", teacher: "Duy Khải", currentPhase: "W-L", phaseStartDate: "29/05/2026", phaseStudents: 5, nextPhaseStartDate: "10/07/2026", nextPhase: "S-R", slotsToEnroll: 7 },
      { classCode: "M357C1", name: "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng", month: 5, type: "Lớp đang diễn ra", openDate: "24/03/2026", teacher: "Trung Dũng", currentPhase: "W-L", phaseStartDate: "02/06/2026", phaseStudents: 5, nextPhaseStartDate: "14/07/2026", nextPhase: "S-R", slotsToEnroll: 5 },
      { classCode: "M246C2", name: "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "03/05/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "18/05/2026", phaseStudents: 3, nextPhaseStartDate: "29/06/2026", nextPhase: "W-L", slotsToEnroll: 7 },
      { classCode: "SSSC1", name: "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm", month: 5, type: "Lớp đang diễn ra", openDate: "06/12/2025", teacher: "Minh Tâm", currentPhase: "W-L", phaseStartDate: "21/05/2026", phaseStudents: 1, nextPhaseStartDate: "02/07/2026", nextPhase: "S-R", slotsToEnroll: 11 },
      { classCode: "S246C2", name: "XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh", month: 5, type: "Lớp đang diễn ra", openDate: "28/10/2024", teacher: "Quang Minh", currentPhase: "W-L", phaseStartDate: "20/05/2026", phaseStudents: 3, nextPhaseStartDate: "01/07/2026", nextPhase: "S-R", slotsToEnroll: 9 },
      { classCode: "S357C2", name: "XLE RLP_Soar - 357 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "29/10/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "23/05/2026", phaseStudents: 2, nextPhaseStartDate: "04/07/2026", nextPhase: "W-L", slotsToEnroll: 10 },
      // Month 6
      { classCode: "U246C1", name: "XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "26/08/2024", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "29/04/2026", phaseStudents: 2, nextPhaseStartDate: "12/06/2026", nextPhase: "W-L", slotsToEnroll: 10 },
      { classCode: "U246C2.1", name: "XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "10/02/2025", teacher: "Duy Khải", currentPhase: "W-L", phaseStartDate: "26/06/2026", phaseStudents: 2, nextPhaseStartDate: "07/08/2026", nextPhase: "S-R", slotsToEnroll: 10 },
      { classCode: "U246C2.2", name: "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", month: 6, type: "Lớp đang diễn ra", openDate: "17/09/2024", teacher: "Đăng Khoa", currentPhase: "W-L", phaseStartDate: "29/06/2026", phaseStudents: 7, nextPhaseStartDate: "10/08/2026", nextPhase: "S-R", slotsToEnroll: 5 },
      { classCode: "U357C1", name: "XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "27/03/2025", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "01/07/2026", phaseStudents: 3, nextPhaseStartDate: "12/08/2026", nextPhase: "W-L", slotsToEnroll: 9 },
      { classCode: "U357C2", name: "XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "27/06/2024", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "10/07/2026", phaseStudents: 5, nextPhaseStartDate: "21/08/2026", nextPhase: "W-L", slotsToEnroll: 7 },
      { classCode: "USSC1", name: "XLE RLP_Upstream - S/S - C1 - GV Nghiêm Doãn Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "18/04/2026", teacher: "Quỳnh Châu", currentPhase: "S-R", phaseStartDate: "26/07/2026", phaseStudents: 4, nextPhaseStartDate: "12/09/2026", nextPhase: "W-L", slotsToEnroll: 8 },
      { classCode: "M246C1", name: "XLE RLP_Momentum - 246 - C1 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "26/08/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "04/05/2026", phaseStudents: 3, nextPhaseStartDate: "15/06/2026", nextPhase: "W-L", slotsToEnroll: 7 },
      { classCode: "M246C2", name: "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "03/05/2024", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "29/06/2026", phaseStudents: 2, nextPhaseStartDate: "10/08/2026", nextPhase: "S-R", slotsToEnroll: 8 },
      { classCode: "M357C1", name: "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng", month: 6, type: "Lớp đang diễn ra", openDate: "24/03/2026", teacher: "Trung Dũng", currentPhase: "S-R", phaseStartDate: "25/08/2026", phaseStudents: 1, nextPhaseStartDate: "06/10/2026", nextPhase: "W-L", slotsToEnroll: 9 },
      { classCode: "M357C2", name: "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "21/04/2026", teacher: "Quỳnh Châu", currentPhase: "W-L", phaseStartDate: "21/04/2026", phaseStudents: 4, nextPhaseStartDate: "11/06/2026", nextPhase: "S-R", slotsToEnroll: 6 },
      { classCode: "S246C1", name: "XLE RLP_Soar - 246 - C1 - GV Trần Quang Minh", month: 6, type: "Lớp đang diễn ra", openDate: "28/06/2024", teacher: "Quang Minh", currentPhase: "W-L", phaseStartDate: "10/07/2026", phaseStudents: 2, nextPhaseStartDate: "21/08/2026", nextPhase: "S-R", slotsToEnroll: 10 },
      { classCode: "S246C2", name: "XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh", month: 6, type: "Lớp đang diễn ra", openDate: "28/10/2024", teacher: "Quang Minh", currentPhase: "S-R", phaseStartDate: "01/07/2026", phaseStudents: 2, nextPhaseStartDate: "12/08/2026", nextPhase: "W-L", slotsToEnroll: 10 },
      { classCode: "S357C2", name: "XLE RLP_Soar - 357 - C2 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "29/10/2024", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "07/07/2026", phaseStudents: 2, nextPhaseStartDate: "15/08/2026", nextPhase: "S-R", slotsToEnroll: 10 },
      { classCode: "SSSC1", name: "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "06/12/2025", teacher: "Minh Tâm", currentPhase: "S-R", phaseStartDate: "05/07/2026", phaseStudents: 3, nextPhaseStartDate: "13/08/2026", nextPhase: "W-L", slotsToEnroll: 9 },
      { classCode: "A246C1", name: "XLE RLP_Advanced - 246 - C1 - GV Nguyễn Lê Trung Dũng", month: 6, type: "Lớp đang diễn ra", openDate: "25/03/2026", teacher: "Đăng Duy", currentPhase: "S-R", phaseStartDate: "22/06/2026", phaseStudents: 2, nextPhaseStartDate: "03/08/2026", nextPhase: "W-L", slotsToEnroll: 8 },
      { classCode: "PC246C1_P13-42026", name: "XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "13/04/2026", teacher: "Minh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "13/04/2026", phaseStudents: 6, nextPhaseStartDate: "15/06/2026", nextPhase: "CORE 2", slotsToEnroll: 6 },
      { classCode: "PC357C2_P14-42026", name: "XLE RLP_PRE CORE - 357 - 20002200 - GV Thanh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "14/04/2026", teacher: "Thanh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "14/04/2026", phaseStudents: 3, nextPhaseStartDate: "11/06/2026", nextPhase: "CORE 2", slotsToEnroll: 9 },
      { classCode: "F357C2_180626", name: "XLE RLP_Foundation - 357 - C2 - GV Đăng Duy", month: 6, type: "Lớp mới", openDate: "18/06/2026", teacher: "Đăng Duy", currentPhase: "-", phaseStartDate: "-", phaseStudents: 0, nextPhaseStartDate: "18/06/2026", nextPhase: "-", slotsToEnroll: 10 },
      { classCode: "D246C1", name: "XLE RLP_Diagnostic - 246 - C1 - GV Lê Thị Diệu Linh", month: 6, type: "Lớp đang diễn ra", openDate: "15/01/2026", teacher: "Diệu Linh", currentPhase: "S-R", phaseStartDate: "15/01/2026", phaseStudents: 5, nextPhaseStartDate: "15/03/2026", nextPhase: "W-L", slotsToEnroll: 5 },
      { classCode: "T246C1", name: "XLE RLP_Task1 - 246 - C1 - GV Lê Minh Trang", month: 6, type: "Lớp đang diễn ra", openDate: "20/02/2026", teacher: "Minh Trang", currentPhase: "W-L", phaseStartDate: "20/02/2026", phaseStudents: 4, nextPhaseStartDate: "20/04/2026", nextPhase: "S-R", slotsToEnroll: 6 },
      { classCode: "A357C2", name: "XLE RLP_Speaking - 357 - C2 - GV Phạm Hoàng An", month: 6, type: "Lớp đang diễn ra", openDate: "05/03/2026", teacher: "Hoàng An", currentPhase: "S-R", phaseStartDate: "05/03/2026", phaseStudents: 6, nextPhaseStartDate: "05/05/2026", nextPhase: "W-L", slotsToEnroll: 4 },
      { classCode: "R246C2", name: "XLE RLP_Reading - 246 - C2 - GV Trần Thu Lan", month: 6, type: "Lớp đang diễn ra", openDate: "12/04/2026", teacher: "Thu Lan", currentPhase: "W-L", phaseStartDate: "12/04/2026", phaseStudents: 3, nextPhaseStartDate: "12/06/2026", nextPhase: "S-R", slotsToEnroll: 7 }
    ];
    await this.classModel.insertMany(initialClasses);
    }

    // Seed Students
    const studentCount = await this.studentModel.countDocuments().exec();
    if (studentCount === 0) {
      // Fetch classes to map class names to seeded IDs
      const seededClasses = await this.classModel.find().exec();
      const findClassIdByName = (name: string, month?: number): string => {
        return seededClasses.find(c => c.name.startsWith(name) && (month === undefined || c.month === month))?._id.toString() || 'cls_placeholder';
      };

      const jsonPath = path.join(process.cwd(), 'src/aca/mapped_students.json');
      let rawData: { name: string; combo: string; l1: string; f1: string; l2: string }[] = [];
      try {
        if (fs.existsSync(jsonPath)) {
          rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }
      } catch (err) {
        console.error('Failed to read mapped_students.json', err);
      }

      const initialStudents = rawData.map((d, index) => {
        const phone = index % 2 === 0 ? `0939${100000 + index}` : `0775${100000 + index}`;
        const email = `${d.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '')}@xalo.local`;
        
        const normalized = d.combo.toUpperCase();
        let classTarget = "";
        if (normalized.includes("U-S") || normalized.includes("U_S") || normalized.includes("US")) {
          const choices = [
            "XLE RLP_Upstream - S/S - C1 - GV Nghiêm Doãn Quỳnh Châu",
            "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa",
            "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm"
          ];
          classTarget = choices[index % choices.length];
        } else if (normalized.includes("M-A") || normalized.includes("M_A") || normalized.includes("MA") || normalized.includes("M-2A") || normalized.includes("2M-A")) {
          const choices = [
            "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu",
            "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải",
            "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng"
          ];
          classTarget = choices[index % choices.length];
        } else if (normalized.includes("C-") || normalized.includes("PC") || normalized.includes("P-")) {
          const choices = [
            "XLE RLP_PRE CORE - 246 - 20002200 / 220526 - GV Quỳnh Châu",
            "XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm",
            "XLE RLP_PRE CORE - 357 - 20002200 - GV Thanh Tâm"
          ];
          classTarget = choices[index % choices.length];
        } else {
          classTarget = "XLE RLP_Foundation - 357 - C2 - GV Đăng Duy";
        }

        const classId = findClassIdByName(classTarget, 6);

        return {
          name: d.name,
          phone,
          email,
          classification: "Combo",
          rawClassification: d.combo,
          scores: { l: "-", r: "-", w: "-", s: "-", o: "-" },
          bcbLink: `https://docs.google.com/spreadsheets/d/mock-${index}/edit`,
          note: "",
          classId,
          stt: index + 1,
          l1: d.l1 || "",
          f1: d.f1 || "",
          l2: d.l2 || "",
          f2: "",
          l3: "",
          f3: ""
        };
      });
      await this.studentModel.insertMany(initialStudents);
    }

    // Ensure default student Dương Ngọc Khôi Nguyên exists in ACA student list
    const studentUserEmail = "nguyenduong939705@gmail.com";
    const seededClasses = await this.classModel.find().exec();
    const quynhChauClass = seededClasses.find(c => c.name.includes("M357C2") || (c.teacher && c.teacher.includes("Quỳnh Châu"))) || seededClasses[0];

    const existingStudentUser = await this.studentModel.findOne({ email: studentUserEmail }).exec();
    if (!existingStudentUser) {
      await this.studentModel.create({
        name: "Dương Ngọc Khôi Nguyên",
        phone: "0939939705",
        email: studentUserEmail,
        classification: "Combo",
        rawClassification: "M-A",
        scores: { l: "6.5", r: "6.5", w: "6.0", s: "6.0", o: "6.5" },
        bcbLink: "https://docs.google.com/spreadsheets/d/mock-student-khoinguyen/edit",
        note: "Học viên chính hệ thống",
        classId: quynhChauClass?._id?.toString() || "cls_placeholder",
        stt: 0,
        l1: quynhChauClass?.name || "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu",
        f1: "Full",
        l2: "",
        f2: "",
        l3: "",
        f3: ""
      });
    } else {
      const sc = existingStudentUser.scores as
        | { l?: unknown; r?: unknown; w?: unknown; s?: unknown; o?: unknown }
        | undefined;
      const bandEmpty = (v: unknown) =>
        v === undefined || v === null || v === '' || v === '-';
      const scoresEmpty =
        !sc ||
        (bandEmpty(sc.l) &&
          bandEmpty(sc.r) &&
          bandEmpty(sc.w) &&
          bandEmpty(sc.s) &&
          bandEmpty(sc.o));
      const patch: Record<string, unknown> = {};
      if (scoresEmpty) {
        patch.scores = { l: '6.5', r: '6.5', w: '6.0', s: '6.0', o: '6.5' };
      }
      if (!String(existingStudentUser.aim || '').trim()) {
        patch.aim = '7.0';
      }
      if (existingStudentUser.l1?.includes('Lê Như Hải')) {
        patch.classId = quynhChauClass?._id?.toString() || existingStudentUser.classId;
        patch.l1 =
          quynhChauClass?.name ||
          'XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu';
      }
      if (Object.keys(patch).length > 0) {
        await this.studentModel.updateOne({ email: studentUserEmail }, { $set: patch }).exec();
      }
    }

    await this.ensureVanThiThanhTruc();
    await this.ensureThieuThaoChi();

    // Seed Practice Weeks
    const weekCount = await this.practiceWeekModel.countDocuments().exec();
    const defaultZoomLink = "https://zoom.us/j/84219634521?pwd=example-lrw";
    if (weekCount === 0) {
      const initialWeeks = [
        {
          weekRange: "20/04/2026 - 26/04/2026",
          examWeekNumber: 36,
          linkMeet: defaultZoomLink,
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-1",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 20/4:\n - Lớp có học Speaking vào 19h45-21h45 thứ 7 25/4\n - Lớp không có lịch test tập trung vào CN\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (26/4) lớp mình không có lịch test tập trung, các bạn tham gia học Speaking vào thứ 7 (25/4) lúc 19h45-21h45 nhé!"
        },
        {
          weekRange: "27/04/2026 - 03/05/2026",
          examWeekNumber: 37,
          linkMeet: defaultZoomLink,
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-2",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 27/4:\n - Lớp nghỉ, không có lịch học vào T3 và T7\n - Lớp có lịch test tập trung vào CN 3/5 9h-11h30\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (3/5) chị có lịch test lớp luyện đề lúc 9h00 - 11h30, em tham gia được thì phản hồi lại giúp chị nha!"
        },
        {
          weekRange: "08/06/2026 - 14/06/2026",
          examWeekNumber: 38,
          linkMeet: defaultZoomLink,
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-3",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 8/6:\n - Lớp học bình thường vào thứ 3 và thứ 7\n - Lớp có lịch test tập trung vào CN 14/6 9h-11h30\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (14/6) chị có lịch test lớp luyện đề lúc 9h00 - 11h30, em tham gia được thì phản hồi lại giúp chị nha!"
        }
      ];
      await this.practiceWeekModel.insertMany(initialWeeks);
    } else {
      // Migrate any legacy meet.google.com links in DB to Zoom link
      await this.practiceWeekModel.updateMany(
        { linkMeet: { $regex: /meet\.google\.com/i } },
        { $set: { linkMeet: defaultZoomLink } }
      ).exec();
    }

    // Seed Practice Students
    const practiceStudentCount = await this.practiceStudentModel.countDocuments().exec();
    if (practiceStudentCount === 0) {
      const initialPracStudents = [
        { stt: 1, name: "Trần Kiều My", phone: "397672066", rlp: "RLP Trần Kiều My - 09022501CC5", testScheduleSunday: "Có tham gia", scheduleTueSat: "có test, đang sắp xếp thời gian học", scheduleTue: "Không học", scheduleSat: "Không học", scheduleSun: "Có tham gia", participateLd28: false, note: "", weekRange: "08/06/2026 - 14/06/2026" },
        { stt: 2, name: "Bùi Phạm Diệu Linh", phone: "0343311238", rlp: "RLP Bùi Phạm Diệu Linh - 30092503CC2", testScheduleSunday: "Có tham gia", scheduleTueSat: "", scheduleTue: "Không học", scheduleSat: "Không học", scheduleSun: "Có tham gia", participateLd28: false, note: "", weekRange: "08/06/2026 - 14/06/2026" },
        { stt: 3, name: "Nguyễn Hoà Gia Liên", phone: "-", rlp: "RLP Nguyễn Hòa Gia Liên - 23082502CC4", testScheduleSunday: "Gửi đề vào CN", scheduleTueSat: "", scheduleTue: "Không học", scheduleSat: "Không học", scheduleSun: "Gửi đề vào CN", participateLd28: false, note: "", weekRange: "08/06/2026 - 14/06/2026" },
        { stt: 4, name: "Nguyễn Ngọc Mai", phone: "353514489", rlp: "RLP Nguyễn Ngọc Mai - 16092503CC4", testScheduleSunday: "Có tham gia", scheduleTueSat: "", scheduleTue: "Không học", scheduleSat: "Không học", scheduleSun: "Có tham gia", participateLd28: false, note: "12/3 hong tham gia", weekRange: "08/06/2026 - 14/06/2026" },
        { stt: 5, name: "Lê Trần Bảo Thy", phone: "948928401", rlp: "RLP Lê Trần Bảo Thy - 28062402CC4", testScheduleSunday: "Đăng ký lịch khác", scheduleTueSat: "", scheduleTue: "Không học", scheduleSat: "Không học", scheduleSun: "Đăng ký lịch khác", participateLd28: true, note: "", weekRange: "08/06/2026 - 14/06/2026" }
      ];
      await this.practiceStudentModel.insertMany(initialPracStudents);
    }

    // Seed 1:1 Classes
    const aca11Count = await this.aca11Model.countDocuments().exec();
    if (aca11Count === 0) {
      const initial11 = [
        { status: "Đã kết thúc", className: "2024RLP_ONL 1:1 Nguyễn Thị Khánh Hiền", inputNeed: "5.5/7.0", teacher: "Quỳnh Châu / Đăng Duy", schedule: "[36h] 3 buổi/tuần - 2h/buổi\nT3,5 14h-16h\nSáng thứ 5 9h-11h, CN 8h-10h", startDate: "18/8/2025 • 5/10/2025", endDate: "25/1?", progress: "Đang học khóa thứ 4 với GV Đăng Duy, buổi học gần nhất buổi số 16 ngày 23/1", output: "-", otherNote: "Có chuyển từ lớp soar chuyển qua lại lớp 1:1", zoomLink: "https://zoom.us/j/9876543210", successorLink: "https://docs.google.com/spreadsheets/d/1kh-successor", materials: "https://drive.google.com/drive/folders/kh-drive" },
        { status: "Bảo lưu", className: "2025RLP_ONL 1:1 Dương Bảo Ngọc", inputNeed: "5.5/7.5", teacher: "Khánh Thi / Gia Phú", schedule: "K1: [36h] 3 buổi/tuần\nK2: [18h] 9 buổi\nK3: [24h] 12 buổi", startDate: "4/9/2025 • 30/10/2025 • 25/11/2025", endDate: "23/10/2025 • 18/11/2025 (còn 10h học)", progress: "Bạn xin nghỉ liên tục, không duy trì lịch học đều, GV phải flexible lịch trình liên tục. Không thể hiện tiến độ phát triển đều", output: "Thi thật lần 1 ngày 19/11: L5.5 - R6.0 - W6.5 - S5.0. Chưa đăng kí thi lần 2", otherNote: "-", zoomLink: "https://zoom.us/j/1234567890", successorLink: "https://docs.google.com/spreadsheets/d/1bn-successor", materials: "https://drive.google.com/drive/folders/bn-drive" },
        { status: "Đang diễn ra", className: "2026RLP_ONL 1:1 Nguyễn Phương Yến", inputNeed: "5.5/7.0-7.5 (Mục tiêu Hè)", teacher: "Như Hải", schedule: "K1: [36h] 1 buổi/1 tuần - 3h/buổi\nT7 14h-17h", startDate: "21/3/2026", endDate: "27/6/2026", progress: "Lịch học tuần sau: T2 và T4 15h-16h30. Lịch học các tuần còn lại: T3 và T6 15h-16h30", output: "-", otherNote: "-", zoomLink: "https://zoom.us/j/111" }
      ];
      await this.aca11Model.insertMany(initial11 as any);
    }

    // Seed Weekly Docs
    const docCount = await this.weeklyDocModel.countDocuments().exec();
    if (docCount === 0) {
      const initialDocs = [
        { student: "Nguyễn Văn Anh", className: "Lớp Luyện Đề Room A", week: "Tuần 24", link: "https://docs.google.com/document-wd1", status: "Đã nhận" },
        { student: "Trần Thị Bình", className: "Lớp Luyện Đề Room A", week: "Tuần 24", link: "https://docs.google.com/document-wd2", status: "Đang chấm" },
        { student: "Phạm Minh Đức", className: "Lớp Luyện Đề Room B", week: "Tuần 25", link: "", status: "Chưa nộp" },
      ];
      await this.weeklyDocModel.insertMany(initialDocs);
    }

    // Seed Teacher Assignments
    const assignmentCount = await this.teacherAssignmentModel.countDocuments().exec();
    if (assignmentCount === 0) {
      const initialAssignments = [
        { teacher: "Ms. Hoa", className: "Lớp Luyện Đề Room A", assignedLevel: "IELTS 6.5" },
        { teacher: "Mr. Jay", className: "Lớp Luyện Đề Room B", assignedLevel: "IELTS 7.5" },
        { teacher: "Ms. Linh", className: "Lớp Luyện Đề Room C", assignedLevel: "IELTS 5.5" },
      ];
      await this.teacherAssignmentModel.insertMany(initialAssignments);
    }
  }

  // --- Classes CRUD ---
  async findAllClasses() {
    return this.classModel.find().lean().exec();
  }
  async createClass(data: any) {
    const openDate = String(data?.openDate || '').trim();
    const phaseStartDate = String(data?.phaseStartDate || '').trim();
    if (!String(data?.rlpCohortKey || '').trim()) {
      data.rlpCohortKey =
        slugCohortDate(openDate) ||
        slugCohortDate(phaseStartDate) ||
        'default';
    }
    return this.classModel.create(data);
  }
  async updateClass(id: string, data: any) {
    const prev = await this.classModel.findById(id).lean().exec();
    if (!prev) {
      return this.classModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    }

    const nextOpen =
      data.openDate !== undefined ? String(data.openDate || '').trim() : String(prev.openDate || '').trim();
    const prevOpen = String(prev.openDate || '').trim();
    const openDateChanged =
      data.openDate !== undefined &&
      normalizeOpenDate(prevOpen) !== normalizeOpenDate(nextOpen) &&
      Boolean(nextOpen);

    if (openDateChanged) {
      // Khai giảng mới → đợt RLP mới (HV cũ giữ rlpCohortKey cũ trên hồ sơ).
      data.rlpCohortKey = slugCohortDate(nextOpen) || `new_${Date.now()}`;
    } else if (!String(prev.rlpCohortKey || '').trim() && !data.rlpCohortKey) {
      data.rlpCohortKey = resolveClassCohortKey({
        openDate: nextOpen || prevOpen,
        phaseStartDate: String(
          data.phaseStartDate !== undefined ? data.phaseStartDate : prev.phaseStartDate || '',
        ),
      });
    }

    const updated = await this.classModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    if (updated && updated.classCode) {
      const codePrefix = updated.classCode.replace(/-\d+$/i, '');
      if (codePrefix && codePrefix !== updated.classCode) {
        const regex = new RegExp(`^${codePrefix}-\\d+$`, 'i');
        await this.classModel.updateMany(
          { classCode: { $regex: regex }, _id: { $ne: updated._id } },
          { 
            $set: { 
              openDate: updated.openDate,
              teacher: updated.teacher,
              endDate: updated.endDate,
              name: updated.name,
              currentPhase: updated.currentPhase,
              phaseStartDate: updated.phaseStartDate,
              nextPhase: updated.nextPhase,
              nextPhaseStartDate: updated.nextPhaseStartDate,
              slotsToEnroll: updated.slotsToEnroll,
              progressNote: updated.progressNote,
              room: (updated as any).room,
              zoomPassword: (updated as any).zoomPassword,
              zoomLink: (updated as any).zoomLink,
              schedule: (updated as any).schedule,
              links: (updated as any).links,
              // Không sync rlpCohortKey sang lớp tháng khác — mỗi bản ghi lớp tự quản đợt.
            } 
          }
        ).exec();
      }
    }
    return updated;
  }
  async deleteClass(id: string) {
    return this.classModel.findByIdAndDelete(id).exec();
  }

  // --- Students CRUD ---
  async findAllStudents() {
    const students = await this.studentModel
      .find()
      .sort({ createdAt: 1, name: 1 })
      .lean()
      .exec();

    // 1. Fetch writing submission emails / ids
    const writingSubmissions = await this.writingSubmissionModel
      .find({}, { studentGmail: 1, studentId: 1 })
      .lean()
      .exec();
    const writingEmailsSet = new Set<string>();
    const writingIdsSet = new Set<string>();
    for (const ws of writingSubmissions) {
      if (ws.studentGmail) writingEmailsSet.add(ws.studentGmail.trim().toLowerCase());
      if (ws.studentId) {
        writingIdsSet.add(String(ws.studentId).trim());
        if (ws.studentId.includes('@')) writingEmailsSet.add(ws.studentId.trim().toLowerCase());
      }
    }

    const emails = students
      .map((st) => String(st.email || '').trim().toLowerCase())
      .filter((e) => e.includes('@'));
    const emailToUserId = await this.usersService.findIdsByEmails(emails);

    const mockRows = await this.mockTestRequestModel
      .find(
        {
          status: { $ne: 'cancelled' },
          source: { $nin: ['entrance', 'final'] },
        },
        { studentId: 1, studentName: 1 },
      )
      .lean()
      .exec();
    const mockUserIds = new Set<string>();
    const mockNames = new Set<string>();
    for (const row of mockRows) {
      if (row.studentId) mockUserIds.add(String(row.studentId));
      const name = String(row.studentName || '').trim().toLowerCase();
      if (name) mockNames.add(name);
    }

    const practiceRegs = await this.practiceRegistrationModel
      .find({}, { userId: 1 })
      .lean()
      .exec();
    const practiceUserIds = new Set(
      practiceRegs.map((row) => String(row.userId)),
    );

    // 2. Fetch RLP course stores for RLP attendance and homework calculations
    const rlpStores = await this.rlpCourseStoreModel.find({}).lean().exec();
    const rlpStoreMap = new Map<string, any[]>();
    for (const store of rlpStores) {
      rlpStoreMap.set(store.key, store.sessions || []);
    }
    const classRows = await this.classModel
      .find({}, { openDate: 1, phaseStartDate: 1, rlpCohortKey: 1 })
      .lean()
      .exec();
    const classByIdForRlp = new Map(
      classRows.map((c) => [String(c._id), c as { openDate?: string; phaseStartDate?: string; rlpCohortKey?: string }]),
    );

    return students.map((st, index) => {
      const emailNorm = (st.email || '').trim().toLowerCase();
      const userId = emailToUserId.get(emailNorm) || '';
      const acaId = String(st._id);
      const hasSubmittedWriting =
        writingEmailsSet.has(emailNorm) ||
        writingIdsSet.has(userId) ||
        writingIdsSet.has(acaId);
      const hasMocktest =
        (userId && mockUserIds.has(userId)) ||
        mockUserIds.has(acaId) ||
        mockNames.has(String(st.name || '').trim().toLowerCase());
      const hasLuyenDe =
        Boolean(st.practiceJoined) ||
        (Array.isArray(st.registeredSlotIds) && st.registeredSlotIds.length > 0) ||
        (userId && practiceUserIds.has(userId)) ||
        practiceUserIds.has(acaId);

      // Get sessions for student's class + đợt RLP đã pin
      const classId = String(st.classId || '').trim();
      const cls = classId ? classByIdForRlp.get(classId) : null;
      const cohort =
        String((st as { rlpCohortKey?: string }).rlpCohortKey || '').trim() ||
        (cls ? resolveClassCohortKey(cls) : '');
      const storeKey = classId && cohort ? buildRlpStoreKey(classId, cohort) : '';
      const sessions =
        (storeKey && rlpStoreMap.get(storeKey)) ||
        (classId && rlpStoreMap.get(`rlp_store_${classId}`)) ||
        [];

      let computedHomeworkPercent = st.homeworkPercent || '';
      let computedAttendanceCount = st.attendanceCount || '';

      if (sessions.length > 0) {
        const progress = computeStudentRlpProgress(sessions, {
          id: String(st._id),
          email: st.email,
          name: st.name,
          phone: st.phone,
        });
        computedHomeworkPercent =
          formatHomeworkPercent(progress) || computedHomeworkPercent;
        computedAttendanceCount =
          formatAttendanceCount(progress) || computedAttendanceCount;
      }

      // Check if student has cycles
      const updatedCycles = (st.cycles || []).map((cyc: any) => ({
        ...cyc,
        registeredWriting: hasSubmittedWriting ? true : !!cyc.registeredWriting,
        registeredMocktest: hasMocktest ? true : !!cyc.registeredMocktest,
        registeredLuyenDe: hasLuyenDe ? true : !!cyc.registeredLuyenDe,
        homeworkPercent: computedHomeworkPercent || cyc.homeworkPercent || '',
        attendanceCount: computedAttendanceCount || cyc.attendanceCount || '',
      }));

      return {
        ...st,
        stt: index + 1,
        registeredWriting: hasSubmittedWriting ? true : !!st.registeredWriting,
        registeredMocktest: hasMocktest ? true : !!st.registeredMocktest,
        registeredLuyenDe: hasLuyenDe ? true : !!st.registeredLuyenDe,
        homeworkPercent: computedHomeworkPercent || st.homeworkPercent || '',
        attendanceCount: computedAttendanceCount || st.attendanceCount || '',
        cycles: updatedCycles.length > 0 ? updatedCycles : st.cycles,
        rawClassification: st.rawClassification || st.classification || '',
        classification: normalizeClassification(st.classification || ''),
      };
    });
  }
  private async ensureUserAccountForStudent(student: any) {
    if (!student || !student.email || !student.email.includes('@')) return;
    try {
      const existingUser = await this.usersService.findByEmail(student.email);
      if (!existingUser) {
        await this.usersService.createUser({
          name: student.name || 'Học viên',
          email: student.email,
          password: 'Student@123!',
          role: 'HS',
        });
        console.log(`Auto-created login account for student: ${student.email} / password: Student@123!`);
      }
    } catch (err) {
      console.warn(`Could not auto-create student user account for ${student.email}:`, err);
    }
  }

  /** Upsert học viên Văn Thị Thanh Trúc + BCB Entrance vào LMS. */
  private async ensureVanThiThanhTruc() {
    const email = VAN_THI_THANH_TRUC.email;
    const name = VAN_THI_THANH_TRUC.name;
    const diagnosis = vanThiThanhTrucDiagnosis();
    const scores = {
      l: String(diagnosis.scores.listening),
      r: String(diagnosis.scores.reading),
      w: String(diagnosis.scores.writing),
      s: String(diagnosis.scores.speaking),
      o: String(diagnosis.scores.overall),
    };

    const previousEmail = 'thanhtruc.van@xalo.local';
    const emailRe = (value: string) =>
      new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let student = await this.studentModel
      .findOne({
        $or: [
          { email: emailRe(email) },
          { email: emailRe(previousEmail) },
          { name: emailRe(name) },
        ],
      })
      .exec();

    if (!student) {
      const last = await this.studentModel
        .findOne()
        .sort({ stt: -1 })
        .select({ stt: 1 })
        .lean()
        .exec();
      student = await this.studentModel.create({
        name,
        email,
        phone: VAN_THI_THANH_TRUC.phone,
        classification: 'Lớp lẻ mới',
        scores,
        aim: VAN_THI_THANH_TRUC.aim,
        examDate: VAN_THI_THANH_TRUC.examDate,
        note: 'BCB Entrance — Văn Thị Thanh Trúc',
        classId: '',
        stt: Number((last as { stt?: number } | null)?.stt || 0) + 1,
      });
    } else {
      const existingAim = String(student.aim || '').trim();
      await this.studentModel
        .updateOne(
          { _id: student._id },
          {
            $set: {
              name,
              email,
              scores,
              aim: existingAim || VAN_THI_THANH_TRUC.aim,
              examDate: VAN_THI_THANH_TRUC.examDate,
            },
          },
        )
        .exec();
    }

    await this.usersService.renameLoginEmail(previousEmail, email);
    await this.ensureUserAccountForStudent({ name, email });

    const persistIds: Types.ObjectId[] = [student._id as Types.ObjectId];
    const user = await this.usersService.findByEmail(email);
    if (user?._id && String(user._id) !== String(student._id)) {
      persistIds.push(user._id as Types.ObjectId);
    }

    for (const userId of persistIds) {
      const existing = await this.profileStore.findOne({ userId }).lean().exec();
      const prev =
        (existing as { diagnosisData?: Record<string, unknown> } | null)
          ?.diagnosisData || {};
      const diagnosisData: Record<string, unknown> = { ...prev, ...diagnosis };
      const prevAim = String(prev.aim || '').trim();
      if (prevAim) diagnosisData.aim = prevAim;
      if (prev.finalScores) diagnosisData.finalScores = prev.finalScores;
      if (prev.finalBcb) diagnosisData.finalBcb = prev.finalBcb;
      if (prev.finalReleasedAt) diagnosisData.finalReleasedAt = prev.finalReleasedAt;
      await this.profileStore
        .findOneAndUpdate(
          { userId },
          {
            $set: {
              diagnosisData,
              'profileData.examDate': VAN_THI_THANH_TRUC.examDate,
            },
            $setOnInsert: { userId },
          },
          { upsert: true },
        )
        .exec();
    }

    if (user?._id) {
      await this.seedVanThiThanhTrucSupportSpeaking(user._id as Types.ObjectId, name);
      await this.seedVanThiThanhTrucLuyenDe(user._id as Types.ObjectId);
      await this.studentModel
        .updateOne({ _id: student._id }, { $set: { registeredLuyenDe: true } })
        .exec();
    }
    await this.seedVanThiThanhTrucSoar246(student._id as Types.ObjectId);
  }

  /** Upsert học viên Thiều Thảo Chi + BCB Entrance + lớp ONL 1:1. */
  private async ensureThieuThaoChi() {
    const email = THIEU_THAO_CHI.email;
    const name = THIEU_THAO_CHI.name;
    const diagnosis = thieuThaoChiDiagnosis();
    const scores = {
      l: String(diagnosis.scores.listening),
      r: String(diagnosis.scores.reading),
      w: String(diagnosis.scores.writing),
      s: String(diagnosis.scores.speaking),
      o: String(diagnosis.scores.overall),
    };
    const emailRe = (value: string) =>
      new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let student = await this.studentModel
      .findOne({
        $or: [{ email: emailRe(email) }, { name: emailRe(name) }],
      })
      .exec();

    const identityPatch = {
      name,
      email,
      phone: THIEU_THAO_CHI.phone,
      dob: THIEU_THAO_CHI.dob,
      zodiac: THIEU_THAO_CHI.zodiac,
      scores,
      note: 'BCB Entrance — Thiều Thảo Chi · ONL 1:1',
    };

    if (!student) {
      const last = await this.studentModel
        .findOne()
        .sort({ stt: -1 })
        .select({ stt: 1 })
        .lean()
        .exec();
      student = await this.studentModel.create({
        ...identityPatch,
        classification: 'Lớp lẻ mới',
        aim: THIEU_THAO_CHI.aim,
        classId: '',
        stt: Number((last as { stt?: number } | null)?.stt || 0) + 1,
      });
    } else {
      const existingAim = String(student.aim || '').trim();
      await this.studentModel
        .updateOne(
          { _id: student._id },
          {
            $set: {
              ...identityPatch,
              aim: existingAim || THIEU_THAO_CHI.aim,
            },
          },
        )
        .exec();
    }

    await this.ensureUserAccountForStudent({ name, email });

    const persistIds: Types.ObjectId[] = [student._id as Types.ObjectId];
    const user = await this.usersService.findByEmail(email);
    if (user?._id && String(user._id) !== String(student._id)) {
      persistIds.push(user._id as Types.ObjectId);
    }

    for (const userId of persistIds) {
      const existing = await this.profileStore.findOne({ userId }).lean().exec();
      const prev =
        (existing as { diagnosisData?: Record<string, unknown> } | null)
          ?.diagnosisData || {};
      const prevProfile =
        (existing as { profileData?: Record<string, unknown> } | null)
          ?.profileData || {};
      const diagnosisData: Record<string, unknown> = { ...prev, ...diagnosis };
      const prevAim = String(prev.aim || '').trim();
      if (prevAim) diagnosisData.aim = prevAim;
      if (prev.finalScores) diagnosisData.finalScores = prev.finalScores;
      if (prev.finalBcb) diagnosisData.finalBcb = prev.finalBcb;
      if (prev.finalReleasedAt) diagnosisData.finalReleasedAt = prev.finalReleasedAt;
      await this.profileStore
        .findOneAndUpdate(
          { userId },
          {
            $set: {
              diagnosisData,
              profileData: {
                ...prevProfile,
                name,
                email,
                phone: THIEU_THAO_CHI.phone,
                dob: THIEU_THAO_CHI.dob,
                zodiac: THIEU_THAO_CHI.zodiac,
              },
            },
            $setOnInsert: { userId },
          },
          { upsert: true },
        )
        .exec();
    }

    await this.seedThieuThaoChiOnl11(student._id as Types.ObjectId);

    const speakingSeedId = (user?._id || student._id) as Types.ObjectId;
    await this.seedThieuThaoChiSupportSpeaking(speakingSeedId, name);
  }

  private async seedThieuThaoChiSupportSpeaking(
    studentId: Types.ObjectId,
    studentName: string,
  ) {
    // Xóa seed Q2 cũ (note khác) để không trùng dòng trên bảng kết quả.
    await this.mockTests.deleteSeededByNotePattern(
      studentId.toString(),
      /^seed:thieu-thao-chi-q2-/,
    );
    for (const row of THIEU_THAO_CHI_SUPPORT_SPEAKING) {
      const note = `seed:thieu-thao-chi-st-${row.n}`;
      await this.mockTests.upsertSeededSupportSpeaking({
        studentId: studentId.toString(),
        studentName,
        note,
        skill: 'Support Speaking',
        day: row.day,
        month: row.month,
        year: row.year,
        score: row.score,
        examTime: THIEU_THAO_CHI.supportSpeakingExamTime,
        examTeacher: 'Mock test Speaking',
        examLink: THIEU_THAO_CHI.supportSpeakingMeet,
      });
    }
  }

  private async seedThieuThaoChiOnl11(studentObjectId: Types.ObjectId) {
    const className = '2026RLP_ONL 1:1 Thiều Thảo Chi';
    const classCode = 'ONL11TTC';
    const schedule = [
      'Thứ 4: 19:00 - 21:00',
      'Thứ 6: 19:00 - 21:00',
      'Thứ 7: 16:00 - 18:00',
    ].join('\n');
    const startDate = '02/05/2026';
    const endDate = '27/06/2026';

    let cls = await this.classModel.findOne({ classCode: /^ONL11TTC$/i }).exec();
    if (!cls) {
      cls = await this.classModel.create({
        classCode,
        name: className,
        month: 5,
        type: 'Lớp đang diễn ra',
        teacher: THIEU_THAO_CHI.teacher,
        currentPhase: 'ONL 1:1',
        nextPhase: '',
        phaseStudents: 1,
        slotsToEnroll: 1,
      });
    }
    await this.classModel
      .updateOne(
        { _id: cls._id },
        {
          $set: {
            name: className,
            teacher: THIEU_THAO_CHI.teacher,
            openDate: startDate,
            endDate,
            phaseStartDate: startDate,
            currentPhase: 'ONL 1:1',
            schedule,
            room: 'Zoom 1:1',
            type: 'Lớp đang diễn ra',
          },
        },
      )
      .exec();

    const classId = String(cls._id);
    await this.studentModel
      .updateOne(
        { _id: studentObjectId },
        {
          $set: {
            classId,
            l1: className,
            f1: '1:1',
            classification: 'Lớp lẻ mới',
          },
        },
      )
      .exec();

    const emailRe = new RegExp(
      `^${THIEU_THAO_CHI.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    await this.aca11Model
      .findOneAndUpdate(
        {
          $or: [
            { studentEmail: emailRe },
            { className },
            { studentId: String(studentObjectId) },
          ],
        },
        {
          $set: {
            status: 'Đang diễn ra',
            className,
            studentEmail: THIEU_THAO_CHI.email,
            studentName: THIEU_THAO_CHI.name,
            studentId: String(studentObjectId),
            inputNeed: '6.0/7.0',
            teacher: THIEU_THAO_CHI.teacher,
            schedule: `[36h] ONL 1:1 · 18 buổi · 2h/buổi\nT4 19:00–21:00 · T6 19:00–21:00 · T7 16:00–18:00`,
            startDate,
            endDate,
            progress: '18 buổi từ 02/05/2026 đến 27/06/2026',
            output: '-',
            otherNote: 'Lớp 1:1 online',
            scores: {
              l: '6.0',
              r: '7.0',
              w: '6.0',
              s: '5.0',
              o: '6.0',
            },
          },
        },
        { upsert: true },
      )
      .exec();

    const sessions = THIEU_THAO_CHI_ONL_11_RLP.map((lesson, idx) => {
      let deadline = '';
      const parsed = parseViDate(lesson.date);
      if (parsed) {
        const due = new Date(parsed);
        due.setDate(due.getDate() + 7);
        deadline = formatViDate(due);
      }
      return {
        no: idx + 1,
        date: lesson.date,
        skill: lesson.skill,
        contents: lesson.contents,
        responsibleTeacher: THIEU_THAO_CHI.teacher,
        teacherNote: '—',
        deadline,
        homeworkStatus: 'not_assigned' as const,
        attendance: 'present' as const,
        lessonFileUrl: '',
        homeworkFileUrl: '',
        recordingUrl: '',
      };
    });

    // Ghi đè toàn bộ RLP 1:1 theo đợt (cohort) khai giảng.
    const cohort = slugCohortDate(startDate) || 'default';
    await this.classModel.updateOne({ _id: cls._id }, { $set: { rlpCohortKey: cohort } }).exec();
    await this.studentModel
      .updateOne(
        { _id: studentObjectId },
        { $set: { rlpCohortKey: cohort } },
      )
      .exec();
    await this.rlpCourseStoreModel
      .findOneAndUpdate(
        { key: buildRlpStoreKey(classId, cohort) },
        { $set: { sessions, classId, cohortKey: cohort } },
        { upsert: true },
      )
      .exec();
  }

  private async seedVanThiThanhTrucSupportSpeaking(
    studentId: Types.ObjectId,
    studentName: string,
  ) {
    for (const row of VAN_THI_THANH_TRUC_SUPPORT_SPEAKING) {
      const note = `seed:van-thi-thanh-truc-st-${row.n}`;
      await this.mockTests.upsertSeededSupportSpeaking({
        studentId: studentId.toString(),
        studentName,
        note,
        skill: 'Support Speaking',
        day: row.day,
        month: row.month,
        year: row.year,
        score: row.score,
        examTime: '19:00',
        examTeacher: row.n % 2 === 1 ? 'Gia Phú' : 'Diệu Linh',
      });
    }
  }

  private async seedVanThiThanhTrucLuyenDe(userId: Types.ObjectId) {
    for (const row of VAN_THI_THANH_TRUC_LUYEN_DE) {
      await this.practiceWeekModel
        .findOneAndUpdate(
          { examWeekNumber: row.examWeekNumber },
          {
            $setOnInsert: {
              weekRange: row.weekRange,
              examWeekNumber: row.examWeekNumber,
              linkMeet: '',
              announcement: `Lớp luyện đề LĐ ${row.examWeekNumber}`,
            },
          },
          { upsert: true },
        )
        .exec();
      await this.practiceClassService.upsertWeeklyScoreForUser(userId.toString(), {
        weekRange: row.weekRange,
        examWeekNumber: row.examWeekNumber,
        scoreL: row.scoreL,
        scoreR: row.scoreR,
        scoreW: row.scoreW,
      });
    }
  }

  private async seedVanThiThanhTrucSoar246(studentObjectId: Types.ObjectId) {
    let cls = await this.classModel.findOne({ classCode: /^S246C1$/i }).exec();
    if (!cls) {
      cls = await this.classModel
        .findOne({ name: /Soar\s*-\s*246/i })
        .exec();
    }
    if (!cls) {
      cls = await this.classModel.create({
        classCode: 'S246C1',
        name: 'XLE RLP_Soar - 246 - C1 - GV Trần Quang Minh',
        month: 8,
        type: 'Lớp đang diễn ra',
        teacher: 'Trần Quang Minh',
        currentPhase: 'W-L',
        nextPhase: 'S-R',
        phaseStudents: 1,
        slotsToEnroll: 10,
      });
    }

    const classId = String(cls._id);
    const schedule = [
      'Thứ 2: 19h45 - 21h30',
      'Thứ 4: 19h45 - 21h30',
      'Thứ 6: 19h45 - 21h30',
    ].join('\n');

    await this.classModel
      .updateOne(
        { _id: cls._id },
        {
          $set: {
            openDate: '16/08/2026',
            phaseStartDate: '16/08/2026',
            currentPhase: 'W-L',
            nextPhase: 'S-R',
            nextPhaseStartDate: '04/09/2026',
            schedule,
            room: cls.room?.trim() || 'Zoom Online',
            rlpCohortKey: slugCohortDate('16/08/2026'),
          },
        },
      )
      .exec();

    const cohort = slugCohortDate('16/08/2026') || 'default';
    await this.studentModel
      .updateOne(
        { _id: studentObjectId },
        {
          $set: {
            classId,
            l1: cls.name,
            f1: 'Full',
            classification: 'Lớp lẻ mới',
            rlpCohortKey: cohort,
          },
        },
      )
      .exec();

    const plan = buildRlpSchedulePlan({
      className: cls.name,
      classCode: cls.classCode || 'S246C1',
      phaseStartDate: '16/08/2026',
      openDate: '16/08/2026',
      nextPhaseStartDate: '04/09/2026',
    });

    const sessions = VAN_THI_THANH_TRUC_SOAR_RLP.map((lesson, idx) => {
      const date = plan.dates[idx] || '';
      let deadline = '';
      const parsed = parseViDate(date);
      if (parsed) {
        const due = new Date(parsed);
        due.setDate(due.getDate() + 7);
        deadline = formatViDate(due);
      }
      return {
        no: idx + 1,
        date,
        skill: lesson.skill,
        contents: lesson.contents,
        teacherNote: '—',
        deadline,
        homeworkStatus: 'not_assigned' as const,
        attendance: 'present' as const,
        lessonFileUrl: '',
        homeworkFileUrl: '',
        recordingUrl: '',
      };
    });

    await this.rlpCourseStoreModel
      .findOneAndUpdate(
        { key: buildRlpStoreKey(classId, cohort) },
        { $set: { sessions, classId, cohortKey: cohort } },
        { upsert: true },
      )
      .exec();
  }

  private async resolveActiveCohortForClassId(classId?: string): Promise<string> {
    const id = String(classId || '').trim();
    if (!id || id === 'cls_placeholder') return '';
    const cls = await this.classModel.findById(id).lean().exec();
    if (!cls) return '';
    const cohort = resolveClassCohortKey(cls);
    if (!String(cls.rlpCohortKey || '').trim()) {
      await this.classModel.updateOne({ _id: id }, { $set: { rlpCohortKey: cohort } }).exec();
    }
    return cohort;
  }

  async createStudent(data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    if (data.classId === undefined) {
      data.classId = '';
    }
    if (!data.stt) {
      const last = await this.studentModel
        .findOne()
        .sort({ stt: -1 })
        .select({ stt: 1 })
        .lean()
        .exec();
      data.stt = Number((last as { stt?: number } | null)?.stt || 0) + 1;
    }
    if (data.classId && !String(data.rlpCohortKey || '').trim()) {
      data.rlpCohortKey = await this.resolveActiveCohortForClassId(data.classId);
    }
    const created = await this.studentModel.create(data);
    if (created && created.email) {
      await this.ensureUserAccountForStudent(created);
    }
    return created;
  }

  async findStudentById(id: string) {
    if (!id) return null;
    return this.studentModel.findById(id).lean().exec();
  }

  async updateStudent(id: string, data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    const prev = await this.studentModel.findById(id).lean().exec();
    const nextClassId =
      data.classId !== undefined ? String(data.classId || '').trim() : String(prev?.classId || '').trim();
    const prevClassId = String(prev?.classId || '').trim();
    const classChanged = data.classId !== undefined && nextClassId !== prevClassId;

    if (classChanged && nextClassId) {
      // Gán lớp mới → pin đợt RLP đang active của lớp đó.
      data.rlpCohortKey = await this.resolveActiveCohortForClassId(nextClassId);
    } else if (
      nextClassId &&
      !String(prev?.rlpCohortKey || '').trim() &&
      data.rlpCohortKey === undefined
    ) {
      data.rlpCohortKey = await this.resolveActiveCohortForClassId(nextClassId);
    }

    // Đổi/gán lớp: tự phân loại Học lại / Chuyển lớp (giữ Combo).
    if (classChanged && nextClassId && nextClassId !== 'cls_placeholder') {
      const currentType = normalizeClassification(
        String(data.classification || prev?.classification || ''),
      );
      if (currentType !== 'Combo') {
        const nextCls = await this.classModel.findById(nextClassId).lean().exec();
        const prevCls =
          prevClassId && prevClassId !== 'cls_placeholder'
            ? await this.classModel.findById(prevClassId).lean().exec()
            : null;
        const nextCode = String(nextCls?.classCode || nextCls?.name || '').trim();
        const prevCode = String(prevCls?.classCode || prevCls?.name || '').trim();
        const retake = isHocLaiEnrollment(prev, nextCode, prevCode);

        if (retake) {
          data.classification = 'Học lại';
        } else if (
          prevClassId &&
          prevClassId !== 'cls_placeholder'
        ) {
          data.classification = 'Chuyển lớp';
        }
      }
    }

    const updated = await this.studentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    if (updated && updated.email) {
      await this.ensureUserAccountForStudent(updated);
    }
    if (updated) {
      await this.syncStudentPortalIdentity(updated);
      const aim = String((data as { aim?: string })?.aim ?? updated.aim ?? '').trim();
      if (aim) {
        await this.syncRosterAimToDiagnosis(updated, aim);
      }
    }
    return updated;
  }

  private async syncRosterAimToDiagnosis(
    student: { _id?: Types.ObjectId; email?: string },
    aim: string,
  ) {
    const ids: Types.ObjectId[] = [];
    if (student._id) ids.push(student._id as Types.ObjectId);
    const email = String(student.email || '').trim();
    if (email) {
      const user = await this.usersService.findByEmail(email);
      if (user?._id && String(user._id) !== String(student._id)) {
        ids.push(user._id as Types.ObjectId);
      }
    }
    for (const userId of ids) {
      const existing = await this.profileStore.findOne({ userId }).lean().exec();
      const prev =
        (existing as { diagnosisData?: Record<string, unknown> } | null)
          ?.diagnosisData || {};
      await this.profileStore
        .findOneAndUpdate(
          { userId },
          {
            $set: { diagnosisData: { ...prev, aim } },
            $setOnInsert: { userId, profileData: {} },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  async saveStudentPortalIdentity(data: {
    studentId?: string;
    email?: string;
    name?: string;
    phone?: string;
    dob?: string;
    zodiac?: string;
    avatarUrl?: string;
    examDate?: string;
  }) {
    const email = String(data.email || '').trim().toLowerCase();
    const studentId = String(data.studentId || '').trim();
    let student = studentId
      ? await this.studentModel.findById(studentId).exec()
      : null;
    if (!student && email) {
      student = await this.studentModel
        .findOne({
          email: new RegExp(
            `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i',
          ),
        })
        .exec();
    }
    if (!student) return { ok: false, error: 'Không tìm thấy học viên' };
    const patch: Record<string, string> = {};
    if (email) patch.email = email;
    if (data.name !== undefined) patch.name = String(data.name || '').trim();
    if (data.phone !== undefined) patch.phone = String(data.phone || '').trim();
    if (data.dob !== undefined) patch.dob = String(data.dob || '').trim();
    if (data.zodiac !== undefined) patch.zodiac = String(data.zodiac || '').trim();
    if (data.avatarUrl !== undefined) patch.avatarUrl = String(data.avatarUrl || '').trim();
    if (data.examDate !== undefined) patch.examDate = String(data.examDate || '').trim();
    const updated = await this.studentModel
      .findByIdAndUpdate(student._id, { $set: patch }, { returnDocument: 'after' })
      .exec();
    if (updated) {
      await this.ensureUserAccountForStudent(updated);
      await this.syncStudentPortalIdentity(updated);
    }
    return { ok: true };
  }

  private async syncStudentPortalIdentity(student: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    zodiac?: string;
    avatarUrl?: string;
    examDate?: string;
    method?: string;
    weeklyHours?: string;
    classEnvironment?: string;
    ieltsMeaning?: string;
    previousBand?: string;
    focusSkills?: string[];
  }) {
    const email = String(student.email || '').trim();
    if (!email) return;
    const user = await this.usersService.findByEmail(email);
    if (!user?._id) return;
    const userId = user._id as Types.ObjectId;
    const doc = await this.profileStore.findOne({ userId }).lean().exec();
    const current =
      (doc as { profileData?: Record<string, unknown> } | null)?.profileData || {};
    await this.profileStore
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            profileData: {
              ...current,
              name: student.name || current.name || '',
              email,
              phone: student.phone ?? current.phone ?? '',
              dob: student.dob ?? current.dob ?? '',
              zodiac: student.zodiac ?? current.zodiac ?? '',
              avatarUrl: student.avatarUrl || current.avatarUrl || '',
              examDate: student.examDate ?? current.examDate ?? '',
              method: student.method || current.method || '',
              weeklyHours: student.weeklyHours || current.weeklyHours || '',
              classEnvironment:
                student.classEnvironment || current.classEnvironment || '',
              ieltsMeaning: student.ieltsMeaning || current.ieltsMeaning || '',
              previousBand: student.previousBand || current.previousBand || '',
              focusSkills: student.focusSkills?.length
                ? student.focusSkills
                : current.focusSkills || [],
            },
          },
          $setOnInsert: { userId },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }
  async deleteStudent(id: string) {
    return this.studentModel.findByIdAndDelete(id).exec();
  }

  // --- Practice Weeks CRUD ---
  async findAllWeeks() {
    const weeks = await this.practiceWeekModel.find().lean().exec();

    // Helper to calculate current realtime Saturday-Friday week range
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    const diffToSat = (day + 1) % 7;
    const startDate = new Date(d);
    startDate.setDate(startDate.getDate() - diffToSat);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentRange = `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} - ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()}`;

    const exists = weeks.some((w) => w.weekRange === currentRange);
    if (!exists) {
      try {
        const defaultZoomLink = "https://zoom.us/j/84219634521?pwd=example-lrw";
        const created = await this.practiceWeekModel.create({
          weekRange: currentRange,
          examWeekNumber: await this.nextExamWeekNumber(),
          linkMeet: defaultZoomLink,
          linkTab: "",
          announcement: `[Thông báo về lịch học lớp LĐ]\n\nTuần ${currentRange}:\n - Lớp học bình thường vào thứ 3, thứ 5 và thứ 7\n - Lớp có lịch test tập trung vào CN`,
          templateMessage: `Em ơi, tuần này (${currentRange}) chị gửi lịch lớp Luyện Đề T3, T5, T7 và test tập trung CN nhé!`,
          zoomId: "842 1963 4521",
          zoomPassword: "XaloLrw26",
          scheduleTueTitle: "Luyện tập Speaking theo chuyên đề",
          scheduleTueTime: "19h45 – 21h45",
          scheduleTueInfo: "Tham gia bằng Zoom, học với Giáo viên, phân tích bộ đề Speaking 3 part, được cung cấp từ vựng/phương pháp tiếp cận và luyện tập trực tiếp với Giáo viên.",
          scheduleThuTitle: "Chữa đề L-R-W",
          scheduleThuTime: "19h45 – 21h45",
          scheduleThuInfo: "Tham gia bằng Zoom, học với Giáo viên, tập trung chữa đề Writing và các thắc mắc về Listening – Reading.",
          scheduleSatTitle: "Làm đề L-R-W tập trung",
          scheduleSatTime: "19h – 21h30",
          scheduleSatInfo: "Tham gia bằng Zoom, làm bài trên Google Docs, có nhân viên canh thời gian làm bài và các bạn học viên khác tham gia.",
        });
        weeks.push(created.toObject ? created.toObject() : (created as any));
        try {
          await this.practiceClassService.applyPracticeWeekToSchedule(
            (created.toObject ? created.toObject() : created) as PracticeWeekLean,
          );
        } catch (err) {
          console.warn('Could not sync new practice week to student schedule:', err);
        }
      } catch (err) {
        // ignore race condition
      }
    }
    return weeks;
  }
  private async nextExamWeekNumber(): Promise<number> {
    const latest = await this.practiceWeekModel
      .findOne({ examWeekNumber: { $gt: 0 } })
      .sort({ examWeekNumber: -1 })
      .lean()
      .exec();
    return (latest?.examWeekNumber ?? 0) + 1;
  }

  private async syncPracticeWeekToStudentSchedule(week: PracticeWeekLean) {
    try {
      await this.practiceClassService.applyPracticeWeekToSchedule(week);
    } catch (err) {
      console.warn('Could not sync practice week to student schedule:', err);
    }
  }

  async createWeek(data: any) {
    const payload = { ...data };
    if (!payload.examWeekNumber) {
      payload.examWeekNumber = await this.nextExamWeekNumber();
    }
    const created = await this.practiceWeekModel.create(payload);
    const plain = created.toObject ? created.toObject() : created;
    const currentRange = getCurrentRealtimePracticeWeekRange();
    if (plain.weekRange === currentRange) {
      await this.syncPracticeWeekToStudentSchedule(plain as PracticeWeekLean);
    }
    return created;
  }
  async updateWeek(id: string, data: any) {
    const updated = await this.practiceWeekModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .exec();
    if (updated) {
      const plain = updated.toObject ? updated.toObject() : updated;
      const currentRange = getCurrentRealtimePracticeWeekRange();
      if (plain.weekRange === currentRange) {
        await this.syncPracticeWeekToStudentSchedule(plain as PracticeWeekLean);
      }
    }
    return updated;
  }
  async deleteWeek(id: string) {
    return this.practiceWeekModel.findByIdAndDelete(id).exec();
  }

  // --- Practice Students CRUD ---
  async findAllPracticeStudents() {
    return this.practiceStudentModel.find().lean().exec();
  }
  async createPracticeStudent(data: any) {
    return this.practiceStudentModel.create(data);
  }
  async updatePracticeStudent(id: string, data: any) {
    return this.practiceStudentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async deletePracticeStudent(id: string) {
    return this.practiceStudentModel.findByIdAndDelete(id).exec();
  }

  // --- 1:1 Classes CRUD ---
  async findAll11Classes() {
    return this.aca11Model.find().lean().exec();
  }
  async create11Class(data: any) {
    return this.aca11Model.create(data);
  }
  async update11Class(id: string, data: any) {
    return this.aca11Model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async delete11Class(id: string) {
    return this.aca11Model.findByIdAndDelete(id).exec();
  }

  private extractNameFrom11ClassName(className: string): string {
    const raw = String(className || '');
    const m =
      raw.match(/1\s*:\s*1\s+(.+)$/i) ||
      raw.match(/1-1\s+(.+)$/i) ||
      raw.match(/1\/1\s+(.+)$/i);
    return (m?.[1] || '').trim();
  }

  private normalizePersonName(value?: string | null): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private toPublic11Class(doc: any) {
    return {
      id: String(doc._id),
      status: doc.status || '',
      className: doc.className || '',
      studentEmail: doc.studentEmail || '',
      studentName: doc.studentName || this.extractNameFrom11ClassName(doc.className || ''),
      studentId: doc.studentId || '',
      inputNeed: doc.inputNeed || '',
      teacher: doc.teacher || '',
      schedule: doc.schedule || '',
      startDate: doc.startDate || '',
      endDate: doc.endDate || '',
      progress: doc.progress || '',
      output: doc.output || '',
      otherNote: doc.otherNote || '',
      zoomLink: doc.zoomLink || '',
      successorLink: doc.successorLink || '',
      materials: doc.materials || '',
      scores: doc.scores || null,
      finalScores: doc.finalScores || null,
    };
  }

  /** Học viên: lớp 1:1 đang gắn (ưu tiên Đang diễn ra) */
  async findOneToOneForStudent(identity: { email?: string; name?: string; userId?: string }) {
    const email = String(identity.email || '').trim().toLowerCase();
    const name = this.normalizePersonName(identity.name);
    const userId = String(identity.userId || '').trim();

    const or: Record<string, unknown>[] = [];
    if (email) {
      or.push({ studentEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    if (userId) {
      or.push({ studentId: userId });
    }
    if (name) {
      or.push({ studentName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      or.push({ className: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
    }
    if (or.length === 0) return null;

    const rows = await this.aca11Model.find({ $or: or }).lean().exec();
    if (!rows.length) return null;

    const scored = rows.map((row: any) => {
      const status = String(row.status || '');
      const statusScore =
        status === 'Đang diễn ra' ? 3 : status === 'Bảo lưu' ? 2 : 1;
      const emailHit =
        email &&
        String(row.studentEmail || '')
          .trim()
          .toLowerCase() === email
          ? 10
          : 0;
      return { row, score: statusScore + emailHit };
    });
    scored.sort((a, b) => b.score - a.score);
    return this.toPublic11Class(scored[0].row);
  }

  // --- Weekly Docs CRUD ---
  async findAllWeeklyDocs(query?: { student?: string; studentEmail?: string; className?: string; week?: string }) {
    const filter: Record<string, unknown> = {};
    if (query?.studentEmail) {
      filter.studentEmail = new RegExp(`^${String(query.studentEmail).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    if (query?.student) {
      filter.student = new RegExp(String(query.student).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (query?.className) {
      filter.className = new RegExp(String(query.className).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (query?.week) {
      filter.week = String(query.week).trim();
    }
    return this.weeklyDocModel.find(filter).sort({ updatedAt: -1 }).lean().exec();
  }
  async createWeeklyDoc(data: any) {
    return this.weeklyDocModel.create(data);
  }
  async updateWeeklyDoc(id: string, data: any) {
    return this.weeklyDocModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async deleteWeeklyDoc(id: string) {
    return this.weeklyDocModel.findByIdAndDelete(id).exec();
  }

  /** Học viên: danh sách weekly docs của mình */
  async findWeeklyDocsForStudent(identity: { email?: string; name?: string; userId?: string }) {
    const email = String(identity.email || '').trim().toLowerCase();
    const name = String(identity.name || '').trim();
    const userId = String(identity.userId || '').trim();
    const or: Record<string, unknown>[] = [];
    if (email) {
      or.push({ studentEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    if (userId) {
      or.push({ studentId: userId });
    }
    if (name) {
      or.push({ student: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    if (or.length === 0) return [];
    return this.weeklyDocModel.find({ $or: or }).sort({ week: -1, updatedAt: -1 }).lean().exec();
  }

  async studentSubmitWeeklyDoc(
    id: string,
    identity: { email?: string; name?: string; userId?: string },
    link: string,
  ) {
    const docs = await this.findWeeklyDocsForStudent(identity);
    const owned = docs.find((d: any) => String(d._id) === String(id));
    if (!owned) {
      throw new ForbiddenException('Không tìm thấy tài liệu tuần của bạn.');
    }
    const nextStatus =
      owned.status === 'Đã nhận' || owned.status === 'Đang chấm' ? owned.status : 'Đã nhận';
    return this.weeklyDocModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            link: String(link || '').trim(),
            status: nextStatus,
            ...(identity.email && !owned.studentEmail
              ? { studentEmail: String(identity.email).trim().toLowerCase() }
              : {}),
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  // --- Teacher Assignments CRUD ---
  async findAllTeacherAssignments() {
    return this.teacherAssignmentModel.find().lean().exec();
  }
  async createTeacherAssignment(data: any) {
    return this.teacherAssignmentModel.create(data);
  }
  async updateTeacherAssignment(id: string, data: any) {
    return this.teacherAssignmentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async deleteTeacherAssignment(id: string) {
    return this.teacherAssignmentModel.findByIdAndDelete(id).exec();
  }

  // --- Free Slots CRUD ---
  async findAllFreeSlots() {
    return this.freeSlotModel.find().lean().exec();
  }
  async createFreeSlot(data: any) {
    const day = Number(data.day);
    const month = Number(data.month);
    const year = Number(data.year);
    const time = String(data.time || '').trim();
    const teacherName = String(data.teacherName || '').trim();
    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year) && time && teacherName) {
      const existing = await this.freeSlotModel.findOne({
        day,
        month,
        year,
        time,
        teacherName: new RegExp(`^${this.escapeRegex(teacherName)}$`, 'i'),
      }).exec();
      if (existing) {
        Object.assign(existing, data);
        return existing.save();
      }
    }
    return this.freeSlotModel.create(data);
  }
  async updateFreeSlot(id: string, data: any) {
    return this.freeSlotModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async deleteFreeSlot(id: string) {
    return this.freeSlotModel.findByIdAndDelete(id).exec();
  }

  // --- Teacher Profiles CRUD ---
  async findAllTeacherProfiles() {
    const list = await this.teacherProfileModel.find().lean().exec();
    if (list.length === 0) {
      const seeded = await this.teacherProfileModel.insertMany([
        {
          id: "tch-1",
          name: "Lê Nguyễn Khánh Thi",
          email: "khanhthi.le@xalo.edu.vn",
          phone: "0901 234 567",
          skills: ["Writing", "Speaking"],
          status: "active",
          joinDate: "15/01/2024",
          notes: "Chuyên sâu giảng dạy IELTS Writing Task 2 & Speaking Part 3",
        },
        {
          id: "tch-2",
          name: "Lê Thị Diệu Linh",
          email: "dieulinh.le@xalo.edu.vn",
          phone: "0912 345 678",
          skills: ["Reading", "Listening"],
          status: "active",
          joinDate: "01/03/2024",
          notes: "Phụ trách các lớp nâng band Reading chiến thuật",
        },
        {
          id: "tch-3",
          name: "Nghiêm Doãn Quỳnh Châu",
          email: "quynhchau.nghiem@xalo.edu.vn",
          phone: "0987 654 321",
          skills: ["Writing", "Speaking", "Reading"],
          status: "active",
          joinDate: "10/09/2023",
          notes: "Giảng viên chủ nhiệm lớp Chuyên sâu & Luyện đề",
        },
        {
          id: "tch-4",
          name: "Lê Minh Trang",
          email: "minhtrang.le@xalo.edu.vn",
          phone: "0934 567 890",
          skills: ["Writing", "Reading"],
          status: "active",
          joinDate: "20/02/2024",
          notes: "Chấm bài và feedback chi tiết Writing Task 1",
        },
        {
          id: "tch-5",
          name: "Phạm Hoàng An",
          email: "hoangan.pham@xalo.edu.vn",
          phone: "0945 678 901",
          skills: ["Speaking", "Listening"],
          status: "active",
          joinDate: "05/05/2024",
          notes: "Huấn luyện phát âm và giao tiếp tự nhiên",
        },
        {
          id: "tch-6",
          name: "Trần Thu Lan",
          email: "thulan.tran@xalo.edu.vn",
          phone: "0956 789 012",
          skills: ["Reading", "Writing"],
          status: "inactive",
          joinDate: "12/08/2023",
          notes: "Đang tạm nghỉ thai sản",
        },
        {
          id: "tch-7",
          name: "Lê Thanh Tâm",
          email: "thanhtam.le@xalo.edu.vn",
          phone: "0923 456 789",
          skills: ["Listening", "Reading"],
          status: "active",
          joinDate: "15/01/2024",
          notes: "Giảng viên lớp PRE CORE & Lớp luyện đề tuần",
        },
        {
          id: "tch-8",
          name: "Thái Đỗ Đăng Khoa",
          email: "dangkhoa.thai@xalo.edu.vn",
          phone: "0967 890 123",
          skills: ["Writing", "Speaking"],
          status: "active",
          joinDate: "10/02/2024",
          notes: "Giảng viên Upstream & IELTS Advanced",
        },
        {
          id: "tch-9",
          name: "Tất Duy Khải",
          email: "duykhai.tat@xalo.edu.vn",
          phone: "0978 901 234",
          skills: ["Reading", "Listening"],
          status: "active",
          joinDate: "05/03/2024",
          notes: "Giảng viên Upstream & Cụm lớp 2-4-6",
        },
        {
          id: "tch-10",
          name: "Lê Như Hải",
          email: "nhuhai.le@xalo.edu.vn",
          phone: "0989 012 345",
          skills: ["Writing", "Reading"],
          status: "active",
          joinDate: "12/04/2024",
          notes: "Giảng viên Momentum, Soar & Upstream",
        },
        {
          id: "tch-11",
          name: "Nguyễn Lê Trung Dũng",
          email: "trungdung.nguyen@xalo.edu.vn",
          phone: "0990 123 456",
          skills: ["Speaking", "Writing"],
          status: "active",
          joinDate: "20/04/2024",
          notes: "Giảng viên Momentum & Advanced",
        },
        {
          id: "tch-12",
          name: "Nguyễn Lưu Minh Tâm",
          email: "minhtam.nguyen@xalo.edu.vn",
          phone: "0901 234 567",
          skills: ["Listening", "Speaking"],
          status: "active",
          joinDate: "01/05/2024",
          notes: "Giảng viên Soar & PRE CORE",
        },
        {
          id: "tch-13",
          name: "Trần Quang Minh",
          email: "quangminh.tran@xalo.edu.vn",
          phone: "0912 345 679",
          skills: ["Writing", "Reading"],
          status: "active",
          joinDate: "10/05/2024",
          notes: "Giảng viên Soar & Luyện đề tập trung",
        },
        {
          id: "tch-14",
          name: "Đặng Duy",
          email: "dangduy@xalo.edu.vn",
          phone: "0934 567 891",
          skills: ["Foundation", "Grammar"],
          status: "active",
          joinDate: "01/06/2024",
          notes: "Giảng viên Foundation & Khóa bổ trợ",
        },
        {
          id: "tch-15",
          name: "ACA",
          email: "aca@xalo.edu.vn",
          phone: "024 777 999",
          skills: ["Quản lý", "Chăm sóc học viên"],
          status: "active",
          joinDate: "01/01/2023",
          notes: "Bộ phận Học vụ & Giám sát chất lượng giảng dạy",
        },
      ]);
      return seeded;
    }
    return list;
  }

  async createTeacherProfile(data: any) {
    if (!data.id) {
      data.id = `tch-${Date.now()}`;
    }
    const created = await this.teacherProfileModel.create(data);

    // Automatically ensure a login user account exists for this teacher
    if (data.email) {
      try {
        const existingUser = await this.usersService.findByEmail(data.email);
        if (!existingUser) {
          await this.usersService.createUser({
            name: data.name || 'Giáo viên',
            email: data.email,
            password: 'Teacher@123!',
            role: 'GV',
          });
        }
      } catch (err) {
        console.warn(`Could not auto-create user account for teacher ${data.email}:`, err);
      }
    }

    return created;
  }

  async updateTeacherProfile(id: string, data: any) {
    return this.teacherProfileModel
      .findOneAndUpdate({ id }, { $set: data }, { returnDocument: 'after', upsert: true })
      .exec();
  }

  async deleteTeacherProfile(id: string) {
    return this.teacherProfileModel.findOneAndDelete({ id }).exec();
  }

  // --- Daily Note & Quotes CRUD ---
  async getDailyNote() {
    let doc = await this.dailyNoteModel.findOne().exec();
    if (!doc) {
      doc = await this.dailyNoteModel.create({
        mode: 'random',
        pinnedWord: 'Clouds.',
        pinnedMeaning: "there's divinity in the clouds.",
        quotes: [
          {
            id: 'quote-1',
            word: 'Clouds.',
            meaning: "there's divinity in the clouds.",
            author: 'Xa Lộ English',
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'quote-2',
            word: 'Stay Hungry, Stay Foolish',
            meaning: 'Hãy luôn khao khát, hãy luôn dại khờ. Đừng bao giờ ngừng học hỏi!',
            author: 'Steve Jobs',
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'quote-3',
            word: 'Never Give Up',
            meaning: 'Con đường vạn dặm bắt đầu bằng một bước chân nhỏ. Hãy cố gắng 1% mỗi ngày!',
            author: 'Xa Lộ English',
            active: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
    return doc;
  }

  async updateDailyNote(data: any) {
    let doc = await this.dailyNoteModel.findOne().exec();
    if (!doc) {
      return this.dailyNoteModel.create(data);
    }
    return this.dailyNoteModel.findByIdAndUpdate(doc._id, { $set: data }, { returnDocument: 'after' }).exec();
  }

  // --- Mock Test Requests CRUD ---
  async findAllMockTestRequests() {
    return this.mockTestRequestModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async createMockTestRequest(data: any) {
    return this.mockTestRequestModel.create(data);
  }

  async updateMockTestRequest(id: string, data: any) {
    return this.mockTestRequestModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }

  async deleteMockTestRequest(id: string) {
    return this.mockTestRequestModel.findByIdAndDelete(id).exec();
  }

  // --- Course Settings & Important Links CRUD ---
  private defaultCourseSettingsPayload(classId = '') {
    return {
      classId: classId || '',
      course: 'Momentum - 357 - C2',
      room: 'Zoom Online',
      instructor: 'Nghiêm Doãn Quỳnh Châu',
      zoomPassword: 'xalo2026',
      schedule: ['T3: 19h45 - 21h45', 'T5: 19h45 - 21h45', 'T7: 19h45 - 21h45'],
      openDate: '21/04/2026',
      endDate: '09/07/2026',
      phases: [
        { name: 'Chặng 1: Speaking - Reading', date: '21/04/2026' },
        { name: 'Chặng 2: Writing - Listening', date: '11/06/2026' },
      ],
      links: [
        { id: 'rlp', label: 'RLP', value: 'Chặng 1: Speaking - Reading', url: '#rlp-section' },
        { id: 'lesson', label: 'THƯ MỤC BÀI GIẢNG', value: 'Writing - Listening (21/04/2026)', url: '' },
        { id: 'homework', label: 'THƯ MỤC BÀI TẬP', value: 'HW Học viên', url: '' },
        { id: 'survey', label: 'KHẢO SÁT HỌC VIÊN', value: '—', url: '' },
      ],
    };
  }

  private courseSettingsFromClass(cls: any) {
    const scheduleText = String(cls.schedule || '').trim();
    const schedule = scheduleText
      ? scheduleText
          .split(/\n+/)
          .map((line: string) => line.trim())
          .filter(Boolean)
      : [];
    const phases: { name: string; date: string }[] = [];
    if (cls.currentPhase || cls.phaseStartDate || cls.openDate) {
      phases.push({
        name: cls.currentPhase || 'Chặng 1',
        date: cls.phaseStartDate || cls.openDate || '',
      });
    }
    if (cls.nextPhase || cls.nextPhaseStartDate) {
      phases.push({
        name: cls.nextPhase || 'Chặng 2',
        date: cls.nextPhaseStartDate || '',
      });
    }
    return {
      classId: String(cls._id || ''),
      course: cls.classCode || cls.name || '',
      room: cls.room || '',
      instructor: cls.teacher || '',
      zoomPassword: cls.zoomPassword || '—',
      zoomLink: cls.zoomLink || '',
      schedule,
      openDate: cls.openDate || '',
      endDate: cls.endDate || '',
      phases,
      links: Array.isArray(cls.links) ? cls.links : [],
    };
  }

  async getCourseSettings(classId?: string) {
    const cid = String(classId || '').trim();
    if (cid && Types.ObjectId.isValid(cid)) {
      const cls = await this.classModel.findById(cid).lean().exec();
      if (cls) {
        const fromClass = this.courseSettingsFromClass(cls);
        // Nếu lớp chưa có links/room/pass → merge template global làm nền
        const global = await this.courseSettingsModel
          .findOne({ $or: [{ classId: '' }, { classId: { $exists: false } }] })
          .lean()
          .exec();
        return {
          ...this.defaultCourseSettingsPayload(cid),
          ...(global || {}),
          ...fromClass,
          links:
            fromClass.links.length > 0
              ? fromClass.links
              : Array.isArray((global as any)?.links)
                ? (global as any).links
                : this.defaultCourseSettingsPayload(cid).links,
          room: fromClass.room || (global as any)?.room || '',
          zoomPassword:
            fromClass.zoomPassword && fromClass.zoomPassword !== '—'
              ? fromClass.zoomPassword
              : (global as any)?.zoomPassword || '—',
        };
      }
      const byClassId = await this.courseSettingsModel.findOne({ classId: cid }).exec();
      if (byClassId) return byClassId;
    }

    let doc = await this.courseSettingsModel
      .findOne({ $or: [{ classId: '' }, { classId: { $exists: false } }] })
      .exec();
    if (!doc) {
      doc = await this.courseSettingsModel.create(this.defaultCourseSettingsPayload(''));
    }
    return doc;
  }

  async updateCourseSettings(data: any) {
    const cid = String(data?.classId || '').trim();
    const { classId: _classId, ...rest } = data || {};

    // Ghi settings lên aca_classes khi có classId
    if (cid && Types.ObjectId.isValid(cid)) {
      const scheduleArr = Array.isArray(rest.schedule) ? rest.schedule : [];
      const scheduleText =
        typeof rest.schedule === 'string'
          ? rest.schedule
          : scheduleArr.map((s: string) => String(s).trim()).filter(Boolean).join('\n');
      const patch: Record<string, unknown> = {};
      if (rest.room !== undefined) patch.room = rest.room;
      if (rest.zoomPassword !== undefined) patch.zoomPassword = rest.zoomPassword;
      if (rest.zoomLink !== undefined) patch.zoomLink = rest.zoomLink;
      if (rest.schedule !== undefined) patch.schedule = scheduleText;
      if (rest.links !== undefined) patch.links = rest.links;
      if (rest.instructor !== undefined) patch.teacher = rest.instructor;
      if (rest.openDate !== undefined) patch.openDate = rest.openDate;
      if (rest.endDate !== undefined) patch.endDate = rest.endDate;
      if (Object.keys(patch).length > 0) {
        await this.classModel.findByIdAndUpdate(cid, { $set: patch }).exec();
      }
      // Đồng thời lưu bản CourseSettings theo classId (ACA editor / teacher)
      let perClass = await this.courseSettingsModel.findOne({ classId: cid }).exec();
      if (!perClass) {
        perClass = await this.courseSettingsModel.create({
          ...this.defaultCourseSettingsPayload(cid),
          ...rest,
          classId: cid,
        });
      } else {
        perClass = await this.courseSettingsModel
          .findByIdAndUpdate(perClass._id, { $set: { ...rest, classId: cid } }, { returnDocument: 'after' })
          .exec();
      }
      return this.getCourseSettings(cid);
    }

    let doc = await this.courseSettingsModel
      .findOne({ $or: [{ classId: '' }, { classId: { $exists: false } }] })
      .exec();
    if (!doc) {
      return this.courseSettingsModel.create({ ...rest, classId: '' });
    }
    return this.courseSettingsModel
      .findByIdAndUpdate(doc._id, { $set: { ...rest, classId: '' } }, { returnDocument: 'after' })
      .exec();
  }

  // --- Guest Diagnosis Leads ---
  private toLeadPublic(doc: any) {
    return {
      id: doc._id.toString(),
      name: doc.name ?? '',
      phone: doc.phone ?? '',
      email: doc.email ?? '',
      aim: doc.aim ?? '',
      submittedAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
      status: doc.status ?? 'new',
      note: doc.note ?? '',
      assignedClassId: doc.assignedClassId ?? '',
      assignedClassName: doc.assignedClassName ?? '',
      hasDiagnosis: Boolean(doc.diagnosis && Object.keys(doc.diagnosis).length > 0),
    };
  }

  async listGuestLeads() {
    const rows = await this.guestLeadModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.toLeadPublic(r));
  }

  async createGuestLead(input: { name: string; phone?: string; email?: string; aim?: string }) {
    const doc = await this.guestLeadModel.create({
      name: input.name.trim(),
      phone: (input.phone ?? '').trim(),
      email: (input.email ?? '').trim(),
      aim: (input.aim ?? '').trim(),
      status: 'new',
      note: '',
    });
    return this.toLeadPublic(doc);
  }

  async updateGuestLead(
    id: string,
    patch: {
      status?: GuestDiagnosisLeadStatus;
      note?: string;
      assignedClassId?: string;
      assignedClassName?: string;
    },
  ) {
    const update: Record<string, unknown> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.note !== undefined) update.note = patch.note.trim();
    if (patch.assignedClassId !== undefined) update.assignedClassId = patch.assignedClassId.trim();
    if (patch.assignedClassName !== undefined) update.assignedClassName = patch.assignedClassName.trim();
    const doc = await this.guestLeadModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy lead');
    return this.toLeadPublic(doc);
  }

  async getGuestLead(id: string) {
    const doc = await this.guestLeadModel.findById(id).lean().exec();
    if (!doc) throw new Error('Không tìm thấy lead');
    return {
      ...this.toLeadPublic(doc),
      diagnosis: (doc as any).diagnosis ?? null,
    };
  }

  async getGuestLeadPublic(id: string) {
    const doc = await this.guestLeadModel.findById(id).lean().exec();
    if (!doc) throw new Error('Không tìm thấy lead');
    const diagnosis = (doc as any).diagnosis ?? null;
    return {
      id: doc._id.toString(),
      name: doc.name ?? '',
      aim: doc.aim ?? '',
      hasDiagnosis: Boolean(diagnosis && Object.keys(diagnosis).length > 0),
      diagnosis,
    };
  }

  async saveGuestLeadDiagnosis(id: string, diagnosis: Record<string, unknown>) {
    const existing = await this.guestLeadModel.findById(id).lean().exec();
    if (!existing) throw new Error('Không tìm thấy lead');
    const prev =
      ((existing as { diagnosis?: Record<string, unknown> | null }).diagnosis as
        | Record<string, unknown>
        | null) || {};
    const prevScores =
      (prev.scores as Record<string, unknown> | undefined) || {};
    const nextScores =
      (diagnosis.scores as Record<string, unknown> | undefined) || {};
    const prevSummaries =
      (prev.skillSummaries as Record<string, unknown> | undefined) || {};
    const nextSummaries =
      (diagnosis.skillSummaries as Record<string, unknown> | undefined) || {};

    const merged: Record<string, unknown> = {
      ...prev,
      ...diagnosis,
      scores: { ...prevScores, ...nextScores },
      skillSummaries: { ...prevSummaries, ...nextSummaries },
    };
    // Sale lr-only: giữ W/S criteria nếu payload không gửi
    if (diagnosis.writingCriteria === undefined && prev.writingCriteria) {
      merged.writingCriteria = prev.writingCriteria;
    }
    if (diagnosis.writingSummary === undefined && prev.writingSummary) {
      merged.writingSummary = prev.writingSummary;
    }
    if (diagnosis.writingLinks === undefined && prev.writingLinks) {
      merged.writingLinks = prev.writingLinks;
    }
    if (diagnosis.speakingCriteria === undefined && prev.speakingCriteria) {
      merged.speakingCriteria = prev.speakingCriteria;
    }

    const doc = await this.guestLeadModel
      .findByIdAndUpdate(
        id,
        { $set: { diagnosis: merged } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy lead');
    return {
      ...this.toLeadPublic(doc),
      diagnosis: (doc as any).diagnosis ?? merged,
    };
  }

  async deleteGuestLead(id: string) {
    await this.guestLeadModel.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  // --- Entrance Test Bookings ---
  private toBookingPublic(doc: any) {
    return {
      id: doc._id.toString(),
      candidateName: doc.candidateName ?? '',
      candidatePhone: doc.candidatePhone ?? '',
      candidateEmail: doc.candidateEmail ?? '',
      leadId: doc.leadId ?? '',
      type: doc.type ?? 'speaking',
      format: doc.format ?? 'online',
      graderName: doc.graderName ?? '',
      date: doc.date ?? '',
      time: doc.time ?? '',
      day: doc.day ?? 0,
      month: doc.month ?? 0,
      year: doc.year ?? 0,
      meetLink: doc.meetLink ?? '',
      examLink: doc.examLink ?? '',
      submissionLink: doc.submissionLink ?? '',
      note: doc.note ?? '',
      status: doc.status ?? 'scheduled',
      scoreSpeaking: doc.scoreSpeaking ?? '',
      scoreWriting: doc.scoreWriting ?? '',
      feedback: doc.feedback ?? '',
      speakingCriteria: doc.speakingCriteria ?? null,
      writingCriteria: doc.writingCriteria ?? null,
      bcbData: doc.bcbData ?? null,
      slotId: doc.slotId ?? '',
      mockTestId: doc.mockTestId ?? '',
      writingSubmissionId: doc.writingSubmissionId ?? '',
      createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async listEntranceBookings() {
    const rows = await this.entranceBookingModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.toBookingPublic(r));
  }

  async createEntranceBooking(input: Record<string, unknown>) {
    const dateStr = (input.date as string) ?? '';
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const doc = await this.entranceBookingModel.create({
      candidateName: ((input.candidateName as string) ?? '').trim(),
      candidatePhone: ((input.candidatePhone as string) ?? '').trim(),
      candidateEmail: ((input.candidateEmail as string) ?? '').trim(),
      leadId: ((input.leadId as string) ?? '').trim(),
      type: ((input.type as string) ?? 'speaking') as any,
      format: ((input.format as string) ?? 'online') as any,
      graderName: ((input.graderName as string) ?? '').trim(),
      date: dateStr,
      time: ((input.time as string) ?? '').trim(),
      day: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: dateObj.getFullYear(),
      meetLink: ((input.meetLink as string) ?? '').trim(),
      examLink: ((input.examLink as string) ?? '').trim(),
      submissionLink: ((input.submissionLink as string) ?? '').trim(),
      note: ((input.note as string) ?? '').trim(),
      status: 'scheduled',
      slotId: ((input.slotId as string) ?? '').trim(),
    });

    const format = ((input.format as string) ?? 'online') as string;
    const type = ((input.type as string) ?? 'speaking') as string;
    const examTime = `${doc.time}${format === 'offline' ? ' (Offline)' : ' (Online)'}`;

    if (type !== 'writing') {
      const skill = 'Speaking Entrance';
      try {
        const mockTest = await this.mockTests.createForStaff({
          studentName: doc.candidateName,
          skill,
          day: doc.day,
          month: doc.month,
          year: doc.year,
          examTime,
          examTeacher: doc.graderName,
          examLink: doc.meetLink || doc.examLink || undefined,
          note: doc.note || `Entrance Test — ${doc.candidatePhone}`,
          status: 'approved',
          guestPhone: doc.candidatePhone,
          leadId: doc.leadId || undefined,
          source: 'entrance',
          entranceBookingId: doc._id.toString(),
        });
        doc.mockTestId = mockTest.id;
        await this.entranceBookingModel
          .findByIdAndUpdate(doc._id, { $set: { mockTestId: mockTest.id } })
          .exec();
      } catch (err) {
        console.warn('Could not create mock test for entrance booking:', err);
      }
    }

    if (type === 'writing' || type === 'both') {
      try {
        const autoGrader = await this.selectNextWritingGrader();
        const writingId = await this.createLinkedWritingSubmission({
          studentId: doc.leadId || `guest:${doc.candidatePhone || doc._id.toString()}`,
          studentName: doc.candidateName,
          examLink: doc.submissionLink || doc.examLink || doc.meetLink || 'pending://writing',
          testDateTime: `${doc.date}T${doc.time || '00:00'}`,
          type: 'Entrance',
          source: 'entrance',
          assignedGrader: autoGrader,
          note: doc.note || `Entrance Writing — ${doc.candidatePhone}`,
          entranceBookingId: doc._id.toString(),
        });
        doc.writingSubmissionId = writingId;
        await this.entranceBookingModel
          .findByIdAndUpdate(doc._id, {
            $set: {
              writingSubmissionId: writingId,
              graderName: autoGrader,
            },
          })
          .exec();
        doc.graderName = autoGrader;
      } catch (err) {
        console.warn('Could not create writing submission for entrance booking:', err);
      }
    }

    return this.toBookingPublic(doc);
  }

  async updateEntranceBooking(id: string, patch: Record<string, unknown>) {
    const allowed = [
      'status', 'scoreSpeaking', 'scoreWriting', 'feedback',
      'note', 'meetLink', 'examLink', 'submissionLink',
      'speakingCriteria', 'writingCriteria', 'bcbData',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[key] = patch[key];
    }

    const existing = await this.entranceBookingModel.findById(id).lean().exec();
    if (!existing) throw new Error('Không tìm thấy lịch thi');

    const speakingCriteria = update.speakingCriteria as
      | Record<string, unknown>
      | undefined;
    const writingCriteria = update.writingCriteria as
      | Record<string, unknown>
      | undefined;

    // Đồng bộ criteria → bcbData slices (giống Final), trừ khi caller gửi bcbData đầy đủ.
    if (update.bcbData === undefined && (speakingCriteria || writingCriteria)) {
      let nextBcb =
        ((existing as { bcbData?: Record<string, unknown> | null }).bcbData as Record<
          string,
          unknown
        > | null) || {};

      if (speakingCriteria) {
        const prevSpeaking =
          (nextBcb.speaking as Record<string, unknown> | undefined) || {};
        nextBcb = {
          ...nextBcb,
          speaking: {
            ...prevSpeaking,
            fc: String(speakingCriteria.fluencyCoherence ?? prevSpeaking.fc ?? ''),
            lr: String(speakingCriteria.lexicalResource ?? prevSpeaking.lr ?? ''),
            gra: String(
              speakingCriteria.grammaticalRangeAccuracy ?? prevSpeaking.gra ?? '',
            ),
            pr: String(speakingCriteria.pronunciation ?? prevSpeaking.pr ?? ''),
          },
        };
      }

      if (writingCriteria) {
        const prevWriting =
          (nextBcb.writing as Record<string, unknown> | undefined) || {};
        const t1 =
          (writingCriteria.task1 as Record<string, unknown> | undefined) || {};
        const t2 =
          (writingCriteria.task2 as Record<string, unknown> | undefined) || {};
        nextBcb = {
          ...nextBcb,
          writing: {
            ...prevWriting,
            task1: {
              ta: String(t1.taskAchievement ?? ''),
              cc: String(t1.coherenceCohesion ?? ''),
              lr: String(t1.lexicalResource ?? ''),
              gra: String(t1.grammaticalRange ?? ''),
              notes: (prevWriting.task1 as { notes?: string } | undefined)?.notes,
            },
            task2: {
              tr: String(t2.taskResponse ?? ''),
              cc: String(t2.coherenceCohesion ?? ''),
              lr: String(t2.lexicalResource ?? ''),
              gra: String(t2.grammaticalRange ?? ''),
              notes: (prevWriting.task2 as { notes?: string } | undefined)?.notes,
            },
          },
        };
      }

      update.bcbData = nextBcb;
    }

    const doc = await this.entranceBookingModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy lịch thi');

    if (update.status === 'cancelled' && doc.mockTestId) {
      try {
        await this.mockTests.cancelByStaff(doc.mockTestId);
      } catch (err) {
        console.warn('Could not cancel linked mock test:', err);
      }
    }
    if (update.status === 'cancelled' && doc.writingSubmissionId) {
      await this.cancelLinkedWritingSubmission(doc.writingSubmissionId);
    }

    return this.toBookingPublic(doc);
  }

  async deleteEntranceBooking(id: string) {
    const existing = await this.entranceBookingModel.findById(id).lean().exec();
    if (existing?.mockTestId) {
      try {
        await this.mockTests.cancelByStaff(existing.mockTestId);
      } catch (err) {
        console.warn('Could not cancel linked mock test:', err);
      }
    }
    if (existing?.writingSubmissionId) {
      await this.cancelLinkedWritingSubmission(existing.writingSubmissionId);
    }
    await this.entranceBookingModel.findByIdAndDelete(id).exec();
    return { ok: true };
  }

  // --- KV Store (Grader Meet Links, Guest Diagnosis, etc.) ---
  async getKv(namespace: string): Promise<Record<string, unknown>> {
    const doc = await this.kvModel.findOne({ namespace }).lean().exec();
    return (doc?.data as Record<string, unknown>) ?? {};
  }

  async setKv(namespace: string, data: Record<string, unknown>) {
    await this.kvModel.findOneAndUpdate(
      { namespace },
      { $set: { data } },
      { returnDocument: 'after', upsert: true },
    ).exec();
    return { ok: true };
  }

  async mergeKv(namespace: string, patch: Record<string, unknown>) {
    const existing = await this.getKv(namespace);
    const merged = { ...existing, ...patch };
    await this.setKv(namespace, merged);
    return merged;
  }

  // --- Final Tests ---
  private toFinalTestPublic(doc: any, opts?: { redactUnreleased?: boolean }) {
    const isChecked = Boolean(doc.isChecked);
    const isDone = Boolean(doc.isDone);
    const isGraded = doc.status === 'graded';
    const hideScores = Boolean(opts?.redactUnreleased) && !isChecked && !isDone && !isGraded;
    return {
      id: doc._id.toString(),
      candidateName: doc.candidateName ?? '',
      candidatePhone: doc.candidatePhone ?? '',
      candidateEmail: doc.candidateEmail ?? '',
      studentId: doc.studentId ?? '',
      classCode: doc.classCode ?? '',
      className: doc.className ?? '',
      classification: doc.classification ?? '',
      targetBand: doc.targetBand ?? '',
      testType: (doc.testType ?? 'full_4_skills') as FinalTestType,
      format: (doc.format ?? 'online') as FinalTestFormat,
      examinerName: doc.examinerName ?? '',
      date: doc.date ?? '',
      time: doc.time ?? '',
      examDate: doc.examDate || doc.date || '',
      speakingDate: doc.speakingDate ?? '',
      speakingTime: doc.speakingTime ?? '',
      day: doc.day ?? 0,
      month: doc.month ?? 0,
      year: doc.year ?? 0,
      status: (doc.status ?? 'scheduled') as FinalTestStatus,
      meetLink: doc.meetLink ?? '',
      examLink: doc.examLink ?? '',
      submissionLink: doc.submissionLink ?? '',
      submissionFolderLink: doc.submissionFolderLink ?? '',
      examFolderLink: doc.examFolderLink ?? '',
      scoreOverall: hideScores ? '' : (doc.scoreOverall ?? ''),
      scoreListening: hideScores ? '' : (doc.scoreListening ?? ''),
      scoreReading: hideScores ? '' : (doc.scoreReading ?? ''),
      scoreWriting: hideScores ? '' : (doc.scoreWriting ?? ''),
      scoreSpeaking: hideScores ? '' : (doc.scoreSpeaking ?? ''),
      bcbSpreadsheetLink: hideScores ? '' : (doc.bcbSpreadsheetLink ?? ''),
      graderWTask1: doc.graderWTask1 ?? '',
      graderWTask2: doc.graderWTask2 ?? '',
      graderSpeaking: doc.graderSpeaking ?? '',
      feedback: hideScores ? '' : (doc.feedback ?? ''),
      bcbData: hideScores ? null : (doc.bcbData ?? null),
      note: doc.note ?? '',
      mockTestId: doc.mockTestId ?? '',
      writingSubmissionId: doc.writingSubmissionId ?? '',
      hasTakenTest: Boolean(doc.hasTakenTest),
      isChecked,
      resultStatus: hideScores ? '' : (doc.resultStatus ?? ''),
      isDone: Boolean(doc.isDone),
      releasedAt: doc.releasedAt ?? '',
      releasedBy: doc.releasedBy ?? '',
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() ?? undefined,
    };
  }

  private parseFinalTestDate(dateStr: string) {
    const parts = (dateStr || '').split('-').map((p) => parseInt(p, 10));
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
    const d = dateStr ? new Date(dateStr) : new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizePhone(value: string) {
    return (value || '').replace(/\D/g, '');
  }

  async listFinalTests() {
    const rows = await this.finalTestModel
      .find()
      .sort({ date: -1, time: -1, createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.toFinalTestPublic(r));
  }

  async listFinalTestsForExaminer(examinerName: string) {
    const name = (examinerName || '').trim();
    if (!name) return [];
    const rows = await this.finalTestModel
      .find({
        status: { $ne: 'cancelled' },
        examinerName: new RegExp(`^${this.escapeRegex(name)}$`, 'i'),
      })
      .sort({ date: -1, time: -1, createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.toFinalTestPublic(r));
  }

  async listFinalTestsForStudent(identity: {
    studentId?: string;
    email?: string;
    name?: string;
  }) {
    const studentId = (identity.studentId || '').trim();
    const email = (identity.email || '').trim().toLowerCase();
    const name = (identity.name || '').trim();

    const acaQuery: Record<string, unknown>[] = [];
    if (email) {
      acaQuery.push({
        email: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
      });
    }
    if (name) {
      acaQuery.push({
        name: new RegExp(`^${this.escapeRegex(name)}$`, 'i'),
      });
    }
    const acaStudents = acaQuery.length
      ? await this.studentModel.find({ $or: acaQuery }).lean().exec()
      : [];

    const or: Record<string, unknown>[] = [];
    if (studentId) or.push({ studentId });
    if (email) {
      or.push({
        candidateEmail: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
      });
    }
    if (name) {
      or.push({
        candidateName: new RegExp(`^${this.escapeRegex(name)}$`, 'i'),
      });
    }
    for (const st of acaStudents) {
      or.push({ studentId: st._id.toString() });
      const phone = this.normalizePhone(st.phone || '');
      if (phone.length >= 8) {
        or.push({
          candidatePhone: new RegExp(`${this.escapeRegex(phone.slice(-9))}`),
        });
      }
    }

    if (or.length === 0) return [];

    const rows = await this.finalTestModel
      .find({ $or: or })
      .sort({ date: -1, time: -1, createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.toFinalTestPublic(r, { redactUnreleased: true }));
  }

  async getFinalTestEligibilityForStudent(input: {
    studentId?: string;
    email?: string;
  }): Promise<{
    eligible: boolean;
    reason?: string;
    totalSessionsElapsed: number;
    requiredSessions: number;
    firstStageCompleted: boolean;
    fullCourseCompleted: boolean;
    classCode?: string;
    className?: string;
  }> {
    const studentId = (input.studentId || '').trim();
    const email = (input.email || '').trim().toLowerCase();
    const query: Record<string, unknown>[] = [];
    if (studentId && Types.ObjectId.isValid(studentId)) {
      query.push({ _id: new Types.ObjectId(studentId) });
    }
    if (email) {
      query.push({ email: new RegExp(`^${this.escapeRegex(email)}$`, 'i') });
    }

    const student =
      query.length > 0
        ? await this.studentModel.findOne({ $or: query }).lean().exec()
        : null;

    if (!student) {
      return {
        eligible: false,
        reason: 'Không tìm thấy hồ sơ học viên.',
        totalSessionsElapsed: 0,
        requiredSessions: FULL_COURSE_SESSIONS,
        firstStageCompleted: false,
        fullCourseCompleted: false,
      };
    }

    const classId = String(student.classId || '').trim();
    let cls: AcaClass | null = null;
    if (classId && classId !== 'cls_placeholder') {
      cls = await this.classModel.findById(classId).lean().exec();
    }

    const classCode = cls?.classCode || cls?.name || '';
    const requiredSessions = requiredFullCourseSessions(classCode);

    const studentCohort = String((student as { rlpCohortKey?: string }).rlpCohortKey || '').trim();
    const cohort =
      studentCohort ||
      (cls ? resolveClassCohortKey(cls) : '') ||
      'default';
    const storeKey =
      classId && classId !== 'cls_placeholder'
        ? buildRlpStoreKey(classId, cohort)
        : '';
    let sessions: any[] = [];
    if (storeKey) {
      const classStore = await this.rlpCourseStoreModel.findOne({ key: storeKey }).lean().exec();
      sessions = (classStore?.sessions as any[]) || [];
      // Fallback legacy key nếu chưa migrate.
      if (!sessions.length) {
        const legacy = await this.rlpCourseStoreModel
          .findOne({ key: `rlp_store_${classId}` })
          .lean()
          .exec();
        sessions = (legacy?.sessions as any[]) || [];
      }
    }
    // Không fallback sang RLP `main` dùng chung — mỗi lớp/đợt chỉ tính store của mình.

    const progress = computeStudentRlpProgress(sessions, {
      id: String(student._id),
      email: student.email,
      name: student.name,
      phone: student.phone,
    });

    // Final Test: theo tiến độ buổi LỚP đã hoàn thành (điểm danh / ngày buổi đã qua),
    // không trừ khi HV vắng — lớp xong buổi 36 thì được đăng ký.
    const classSessionsCompleted = countClassSessionsCompleted(sessions);
    const totalSessionsElapsed =
      sessions.length > 0 ? classSessionsCompleted : progress.totalSessionsElapsed;

    // Check if student already has completed/graded Final Test results
    const finalTestQuery: Record<string, unknown>[] = [];
    if (studentId) finalTestQuery.push({ studentId });
    if (email) finalTestQuery.push({ candidateEmail: new RegExp(`^${this.escapeRegex(email)}$`, 'i') });
    if (student?.name) finalTestQuery.push({ candidateName: new RegExp(`^${this.escapeRegex(student.name)}$`, 'i') });

    if (finalTestQuery.length > 0) {
      const existingGraded = await this.finalTestModel
        .findOne({
          $and: [
            { $or: finalTestQuery },
            { status: { $ne: 'cancelled' } },
            {
              $or: [
                { status: 'graded' },
                { isDone: true },
                { isChecked: true },
                { scoreOverall: { $nin: ['', null] } },
                { scoreSpeaking: { $nin: ['', null] } },
                { scoreWriting: { $nin: ['', null] } },
              ],
            },
          ],
        })
        .lean()
        .exec();

      if (existingGraded) {
        return {
          eligible: false,
          reason: 'Học viên đã có kết quả thi Final Test, không thể đăng ký thi lại.',
          totalSessionsElapsed,
          requiredSessions,
          firstStageCompleted: true,
          fullCourseCompleted: true,
          classCode,
          className: cls?.name || '',
        };
      }
    }

    const firstStageRequired = FIRST_STAGE_SESSIONS;
    if (totalSessionsElapsed >= requiredSessions) {
      return {
        eligible: true,
        totalSessionsElapsed,
        requiredSessions,
        firstStageCompleted: true,
        fullCourseCompleted: true,
        classCode,
        className: cls?.name || '',
      };
    }

    if (totalSessionsElapsed >= firstStageRequired) {
      return {
        eligible: false,
        reason: `Lớp đã hoàn thành Chặng 1 (${totalSessionsElapsed}/${requiredSessions} buổi). Cần hoàn thành đủ 2 chặng (${requiredSessions} buổi) để thi Final.`,
        totalSessionsElapsed,
        requiredSessions,
        firstStageCompleted: true,
        fullCourseCompleted: false,
        classCode,
        className: cls?.name || '',
      };
    }

    return {
      eligible: false,
      reason: `Lớp chưa hoàn thành đủ 2 chặng (${totalSessionsElapsed}/${requiredSessions} buổi). Cần hoàn thành đủ ${requiredSessions} buổi để thi Final.`,
      totalSessionsElapsed,
      requiredSessions,
      firstStageCompleted: false,
      fullCourseCompleted: false,
      classCode,
      className: cls?.name || '',
    };
  }

  async assertStudentCanRegisterFinalTest(input: {
    studentId?: string;
    email?: string;
  }): Promise<void> {
    const result = await this.getFinalTestEligibilityForStudent(input);
    if (!result.eligible) {
      throw new ForbiddenException(
        result.reason ||
          'Chưa hoàn thành đủ 2 chặng (36 buổi lớp đã hoàn thành) để đăng ký Final Test.',
      );
    }
  }

  async createFinalTest(input: Record<string, unknown>): Promise<any> {
    const dateStr = ((input.date as string) ?? '').trim();
    const speakingDateStr = (((input.speakingDate as string) ?? dateStr) ?? '').trim();
    const speakingTimeStr = (((input.speakingTime as string) ?? (input.time as string)) ?? '').trim();
    const parsed = this.parseFinalTestDate(dateStr);
    const format = ((input.format as string) || 'online') as FinalTestFormat;
    const testType = ((input.testType as string) || 'full_4_skills') as FinalTestType;
    const studentId = ((input.studentId as string) ?? '').trim();
    const candidateEmail = ((input.candidateEmail as string) ?? '').trim().toLowerCase();
    const candidateName = ((input.candidateName as string) ?? '').trim();
    const candidatePhone = ((input.candidatePhone as string) ?? '').trim();
    const graderSpeaking = ((input.graderSpeaking as string) ?? ((input.examinerName as string) ?? '')).trim();

    // Find any existing active or graded Final Test record for this student
    let existingActive: any = null;
    if (studentId || candidateEmail || candidateName) {
      const orClauses: Record<string, unknown>[] = [];
      if (studentId) orClauses.push({ studentId });
      if (candidateEmail) orClauses.push({ candidateEmail: new RegExp(`^${this.escapeRegex(candidateEmail)}$`, 'i') });
      if (candidateName && candidatePhone) {
        orClauses.push({
          candidateName: new RegExp(`^${this.escapeRegex(candidateName)}$`, 'i'),
          candidatePhone: new RegExp(`${this.escapeRegex(this.normalizePhone(candidatePhone).slice(-9))}`),
        });
      } else if (candidateName) {
        orClauses.push({ candidateName: new RegExp(`^${this.escapeRegex(candidateName)}$`, 'i') });
      }

      if (orClauses.length > 0) {
        // 1. Block if student already has a completed/graded Final Test
        const existingGraded = await this.finalTestModel
          .findOne({
            $and: [
              { $or: orClauses },
              { status: { $ne: 'cancelled' } },
              {
                $or: [
                  { status: 'graded' },
                  { isDone: true },
                  { isChecked: true },
                  { scoreOverall: { $nin: ['', null] } },
                  { scoreSpeaking: { $nin: ['', null] } },
                  { scoreWriting: { $nin: ['', null] } },
                ],
              },
            ],
          })
          .exec();

        if (existingGraded) {
          throw new BadRequestException(
            'Học viên đã có kết quả thi Final Test, không thể đăng ký thi lại.',
          );
        }

        // 2. Find any active (scheduled / in_progress) Final Test record
        const activeFilter: Record<string, unknown> = {
          $and: [
            { $or: orClauses },
            { status: { $nin: ['graded', 'cancelled'] } },
          ],
        };
        existingActive = await this.finalTestModel.findOne(activeFilter).exec();
      }
    }

    // Branch A: Student books Speaking
    if (testType === 'speaking') {
      if (existingActive) {
        // If the student already has an active Speaking registration
        const hasActiveSpeaking =
          Boolean(existingActive.speakingDate && existingActive.speakingTime) ||
          existingActive.testType === 'speaking';
        if (hasActiveSpeaking && existingActive.speakingDate) {
          throw new BadRequestException(
            `Bạn đang có 1 ca Final Test Speaking chưa hoàn thành hoặc chưa hủy (Ngày ${existingActive.speakingDate || existingActive.date} • ${existingActive.speakingTime || existingActive.time}). Vui lòng hủy ca hiện tại trước khi đăng ký ca mới.`,
          );
        }

        // Merge speaking into the existing LR / Final Test record
        existingActive.speakingDate = speakingDateStr || dateStr;
        existingActive.speakingTime = speakingTimeStr;
        existingActive.graderSpeaking = graderSpeaking || existingActive.graderSpeaking;
        if (graderSpeaking) existingActive.examinerName = graderSpeaking;
        if (input.meetLink) existingActive.meetLink = ((input.meetLink as string) ?? '').trim();
        if (input.format) existingActive.format = format;
        existingActive.testType = 'full_4_skills';
        if (candidateEmail && !existingActive.candidateEmail) existingActive.candidateEmail = candidateEmail;
        if (candidatePhone && !existingActive.candidatePhone) existingActive.candidatePhone = candidatePhone;
        if (studentId && !existingActive.studentId) existingActive.studentId = studentId;

        await existingActive.save();
        await this.attachFinalTestGraderTasks(existingActive);
        return this.toFinalTestPublic(existingActive);
      }

      // No existing record -> create a new speaking record
      const doc = await this.finalTestModel.create({
        candidateName,
        candidatePhone,
        candidateEmail,
        studentId,
        classCode: ((input.classCode as string) ?? '').trim(),
        className: ((input.className as string) ?? '').trim(),
        targetBand: ((input.targetBand as string) ?? '').trim(),
        testType: 'speaking',
        format,
        examinerName: graderSpeaking,
        date: dateStr,
        time: ((input.time as string) ?? '').trim(),
        examDate: '',
        speakingDate: speakingDateStr || dateStr,
        speakingTime: speakingTimeStr,
        day: parsed.day,
        month: parsed.month,
        year: parsed.year,
        status: ((input.status as string) || 'scheduled') as FinalTestStatus,
        meetLink: ((input.meetLink as string) ?? '').trim(),
        examLink: ((input.examLink as string) ?? '').trim(),
        submissionLink: ((input.submissionLink as string) ?? '').trim(),
        graderSpeaking,
        graderWTask1: ((input.graderWTask1 as string) ?? '').trim(),
        graderWTask2: ((input.graderWTask2 as string) ?? '').trim(),
        hasTakenTest: Boolean(input.hasTakenTest),
        isChecked: Boolean(input.isChecked),
        isDone: Boolean(input.isDone),
      });

      await this.attachFinalTestGraderTasks(doc);
      return this.toFinalTestPublic(doc);
    }

    // Branch B: Student books LR / Writing
    if (testType === 'lr' || testType === 'writing') {
      if (existingActive) {
        // If student already has an active LR date
        if (existingActive.date && (existingActive.testType === 'lr' || existingActive.testType === 'full_4_skills')) {
          throw new BadRequestException(
            `Bạn đang có 1 ca Final Test Listening/Reading/Writing chưa hoàn thành hoặc chưa hủy (Ngày ${existingActive.date}). Vui lòng hủy ca hiện tại trước khi đăng ký ca mới.`,
          );
        }

        // Merge LR date into existing Speaking record
        existingActive.date = dateStr;
        existingActive.time = ((input.time as string) ?? '').trim();
        existingActive.examDate = dateStr;
        existingActive.day = parsed.day;
        existingActive.month = parsed.month;
        existingActive.year = parsed.year;
        existingActive.testType = 'full_4_skills';
        if (candidateEmail && !existingActive.candidateEmail) existingActive.candidateEmail = candidateEmail;
        if (candidatePhone && !existingActive.candidatePhone) existingActive.candidatePhone = candidatePhone;
        if (studentId && !existingActive.studentId) existingActive.studentId = studentId;

        await existingActive.save();
        await this.attachFinalTestGraderTasks(existingActive);
        return this.toFinalTestPublic(existingActive);
      }
    }

    // Branch C: Standard creation (full_4_skills or new standalone)
    if (existingActive) {
      throw new BadRequestException(
        `Bạn đang có 1 ca Final Test chưa hoàn thành hoặc chưa hủy (Ngày ${existingActive.date || existingActive.speakingDate}). Vui lòng hủy ca hiện tại trước khi đăng ký ca mới.`,
      );
    }

    const doc = await this.finalTestModel.create({
      candidateName,
      candidatePhone,
      candidateEmail,
      studentId,
      classCode: ((input.classCode as string) ?? '').trim(),
      className: ((input.className as string) ?? '').trim(),
      targetBand: ((input.targetBand as string) ?? '').trim(),
      testType,
      format,
      examinerName: ((input.examinerName as string) ?? '').trim(),
      date: dateStr,
      time: ((input.time as string) ?? '').trim(),
      examDate: dateStr,
      speakingDate: speakingDateStr,
      speakingTime: speakingTimeStr,
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      status: ((input.status as string) || 'scheduled') as FinalTestStatus,
      meetLink: ((input.meetLink as string) ?? '').trim(),
      examLink: ((input.examLink as string) ?? '').trim(),
      submissionLink: ((input.submissionLink as string) ?? '').trim(),
      scoreOverall: ((input.scoreOverall as string) ?? '').trim(),
      scoreListening: ((input.scoreListening as string) ?? '').trim(),
      scoreReading: ((input.scoreReading as string) ?? '').trim(),
      scoreWriting: ((input.scoreWriting as string) ?? '').trim(),
      scoreSpeaking: ((input.scoreSpeaking as string) ?? '').trim(),
      feedback: ((input.feedback as string) ?? '').trim(),
      bcbData: (input.bcbData as Record<string, unknown>) ?? null,
      note: ((input.note as string) ?? '').trim(),
      hasTakenTest: Boolean(input.hasTakenTest),
      classification: ((input.classification as string) ?? '').trim(),
      submissionFolderLink: ((input.submissionFolderLink as string) ?? '').trim(),
      examFolderLink: ((input.examFolderLink as string) ?? '').trim(),
      bcbSpreadsheetLink: ((input.bcbSpreadsheetLink as string) ?? '').trim(),
      graderWTask1: ((input.graderWTask1 as string) ?? '').trim(),
      graderWTask2: ((input.graderWTask2 as string) ?? '').trim(),
      graderSpeaking,
      isChecked: Boolean(input.isChecked),
      resultStatus: ((input.resultStatus as string) ?? '').trim(),
      isDone: Boolean(input.isDone),
    });

    await this.attachFinalTestGraderTasks(doc);

    try {
      await this.syncReleasedFinalToStudent(doc);
    } catch (err) {
      console.warn('Could not sync created Final Test to student profile:', err);
    }

    const fresh = await this.finalTestModel.findById(doc._id).exec();
    return this.toFinalTestPublic(fresh ?? doc);
  }

  private pickRosterBand(next: unknown, fallback: unknown) {
    const raw = String(next ?? '').trim();
    if (raw && raw !== '-' && raw !== '') return raw;
    const prev = String(fallback ?? '').trim();
    return prev || '-';
  }

  private async resolveAcaStudentForFinal(doc: {
    studentId?: string;
    candidateEmail?: string;
    candidateName?: string;
    candidatePhone?: string;
  }) {
    const studentId = String(doc.studentId || '').trim();
    if (studentId && Types.ObjectId.isValid(studentId)) {
      const byId = await this.studentModel.findById(studentId).exec();
      if (byId) return byId;
      try {
        const user = await this.usersService.findPublicById(studentId);
        const email = String(user?.email || '').trim();
        if (email) {
          const byUserEmail = await this.studentModel
            .findOne({
              email: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
            })
            .exec();
          if (byUserEmail) return byUserEmail;
        }
      } catch {
        // ignore
      }
    }
    const email = String(doc.candidateEmail || '').trim();
    if (email) {
      const byEmail = await this.studentModel
        .findOne({
          email: new RegExp(`^${this.escapeRegex(email)}$`, 'i'),
        })
        .exec();
      if (byEmail) return byEmail;
    }
    const name = String(doc.candidateName || '').trim();
    const phone = this.normalizePhone(String(doc.candidatePhone || ''));
    if (name && phone) {
      const byNamePhone = await this.studentModel
        .findOne({
          name: new RegExp(`^${this.escapeRegex(name)}$`, 'i'),
          phone: new RegExp(this.escapeRegex(phone)),
        })
        .exec();
      if (byNamePhone) return byNamePhone;
    }
    if (name) {
      return this.studentModel
        .findOne({ name: new RegExp(`^${this.escapeRegex(name)}$`, 'i') })
        .exec();
    }
    return null;
  }

  private async syncReleasedFinalToStudent(doc: {
    studentId?: string;
    candidateEmail?: string;
    candidateName?: string;
    candidatePhone?: string;
    scoreListening?: string;
    scoreReading?: string;
    scoreWriting?: string;
    scoreSpeaking?: string;
    scoreOverall?: string;
    bcbData?: Record<string, unknown> | null;
    releasedAt?: string;
  }) {
    const student = await this.resolveAcaStudentForFinal(doc);

    const existingFinal = ((student?.finalScores || {}) as {
      l?: string | number;
      r?: string | number;
      w?: string | number;
      s?: string | number;
      o?: string | number;
    });
    const finalScores = {
      l: this.pickRosterBand(doc.scoreListening, existingFinal.l),
      r: this.pickRosterBand(doc.scoreReading, existingFinal.r),
      w: this.pickRosterBand(doc.scoreWriting, existingFinal.w),
      s: this.pickRosterBand(doc.scoreSpeaking, existingFinal.s),
      o: this.pickRosterBand(doc.scoreOverall, existingFinal.o),
    };

    if (student) {
      const cycles = Array.isArray(student.cycles) ? [...student.cycles] : [];
      if (cycles.length > 0) {
        const last = { ...(cycles[cycles.length - 1] as object), finalScores };
        cycles[cycles.length - 1] = last as (typeof cycles)[number];
      }

      await this.studentModel
        .updateOne(
          { _id: student._id },
          {
            $set: {
              finalScores,
              ...(cycles.length > 0 ? { cycles } : {}),
            },
          },
        )
        .exec();
    }

    const email = String(student?.email || doc.candidateEmail || '').trim();
    const studentIdStr = String(doc.studentId || '').trim();
    const persistIds: Types.ObjectId[] = [];
    if (student?._id) persistIds.push(student._id as Types.ObjectId);
    if (studentIdStr && Types.ObjectId.isValid(studentIdStr)) {
      if (!persistIds.some((id) => id.toString() === studentIdStr)) {
        persistIds.push(new Types.ObjectId(studentIdStr));
      }
    }
    if (email) {
      const user = await this.usersService.findByEmail(email);
      if (user?._id && !persistIds.some((id) => id.toString() === user._id.toString())) {
        persistIds.push(user._id as Types.ObjectId);
      }
    }

    const finalScoresNamed = {
      listening: finalScores.l,
      reading: finalScores.r,
      writing: finalScores.w,
      speaking: finalScores.s,
      overall: finalScores.o,
    };

    for (const userId of persistIds) {
      const existing = await this.profileStore.findOne({ userId }).lean().exec();
      const diagnosis =
        (existing as { diagnosisData?: Record<string, unknown> } | null)
          ?.diagnosisData || {};
      await this.profileStore.findOneAndUpdate(
        { userId },
        {
          $set: {
            diagnosisData: {
              ...diagnosis,
              finalScores: finalScoresNamed,
              finalBcb: doc.bcbData || (diagnosis as { finalBcb?: unknown }).finalBcb || null,
              finalReleasedAt: doc.releasedAt || new Date().toISOString(),
            },
          },
          $setOnInsert: { userId },
        },
        { returnDocument: 'after', upsert: true },
      );
    }
  }

  async updateFinalTest(id: string, patch: Record<string, unknown>) {
    const allowed = [
      'candidateName',
      'candidatePhone',
      'candidateEmail',
      'studentId',
      'classCode',
      'className',
      'targetBand',
      'testType',
      'format',
      'examinerName',
      'date',
      'time',
      'status',
      'meetLink',
      'examLink',
      'submissionLink',
      'scoreOverall',
      'scoreListening',
      'scoreReading',
      'scoreWriting',
      'scoreSpeaking',
      'feedback',
      'bcbData',
      'note',
      'hasTakenTest',
      'classification',
      'submissionFolderLink',
      'examFolderLink',
      'bcbSpreadsheetLink',
      'graderWTask1',
      'graderWTask2',
      'graderSpeaking',
      'isChecked',
      'resultStatus',
      'isDone',
      'releasedAt',
      'releasedBy',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[key] = patch[key];
    }
    if (typeof update.date === 'string' && update.date) {
      const parsed = this.parseFinalTestDate(update.date as string);
      update.day = parsed.day;
      update.month = parsed.month;
      update.year = parsed.year;
    }
    const doc = await this.finalTestModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy ca Final Test');
    if (doc.isChecked) {
      try {
        await this.syncReleasedFinalToStudent(doc);
      } catch (err) {
        console.warn('Could not sync released Final Test to student profile:', err);
      }
    }
    return this.toFinalTestPublic(doc);
  }

  async confirmFinalTest(id: string, confirmed = true, releasedBy = '') {
    return this.updateFinalTest(id, {
      isChecked: confirmed,
      isDone: confirmed,
      releasedAt: confirmed ? new Date().toISOString() : '',
      releasedBy: confirmed ? releasedBy : '',
    });
  }

  async cancelFinalTest(id: string) {
    const existing = await this.finalTestModel.findById(id).lean().exec();
    const updated = await this.updateFinalTest(id, { status: 'cancelled' });
    if (existing?.mockTestId) {
      try {
        await this.mockTests.cancelByStaff(existing.mockTestId);
      } catch (err) {
        console.warn('Could not cancel linked final mock test:', err);
      }
    }
    if (existing?.writingSubmissionId) {
      await this.cancelLinkedWritingSubmission(existing.writingSubmissionId);
    }
    if (
      existing?.day !== undefined &&
      existing?.month !== undefined &&
      existing?.year !== undefined &&
      existing?.time &&
      existing?.examinerName
    ) {
      try {
        await this.freeSlotModel.updateMany(
          {
            day: existing.day,
            month: existing.month,
            year: existing.year,
            time: existing.time,
            teacherName: new RegExp(`^${this.escapeRegex(existing.examinerName)}$`, 'i'),
            status: 'booked',
          },
          { $set: { status: 'available' } },
        ).exec();
      } catch (err) {
        console.warn('Could not release free slot on cancel:', err);
      }
    }

    if (existing?.speakingDate && existing?.speakingTime) {
      const spkParsed = this.parseFinalTestDate(existing.speakingDate);
      const spkTeacher = existing.graderSpeaking || existing.examinerName;
      if (spkTeacher) {
        try {
          await this.freeSlotModel.updateMany(
            {
              day: spkParsed.day,
              month: spkParsed.month,
              year: spkParsed.year,
              time: existing.speakingTime,
              teacherName: new RegExp(`^${this.escapeRegex(spkTeacher)}$`, 'i'),
              status: 'booked',
            },
            { $set: { status: 'available' } },
          ).exec();
        } catch (err) {
          console.warn('Could not release speaking free slot on cancel:', err);
        }
      }
    }
    return updated;
  }

  async submitStudentFinalWriting(id: string, submissionLink: string) {
    const doc = await this.finalTestModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy ca Final Test');

    const cleanLink = submissionLink.trim();
    doc.submissionLink = cleanLink;
    if (!doc.examLink || doc.examLink.startsWith('pending://')) {
      doc.examLink = cleanLink;
    }
    if (doc.status === 'scheduled') {
      doc.status = 'in_progress';
    }
    await doc.save();

    if (doc.writingSubmissionId) {
      await this.writingSubmissionModel
        .findByIdAndUpdate(doc.writingSubmissionId, {
          $set: {
            examLink: cleanLink,
            status: 'in_progress',
          },
        })
        .exec();
    } else {
      await this.attachFinalTestGraderTasks(doc);
    }

    return this.toFinalTestPublic(doc);
  }

  async deleteFinalTest(id: string) {
    const existing = await this.finalTestModel.findById(id).lean().exec();
    if (!existing) return { ok: true };
    await this.finalTestModel.findByIdAndDelete(id).exec();
    if (existing?.mockTestId) {
      try {
        await this.mockTests.cancelByStaff(existing.mockTestId);
      } catch (err) {
        console.warn('Could not cancel linked mock test on delete:', err);
      }
    }
    if (
      existing?.day !== undefined &&
      existing?.month !== undefined &&
      existing?.year !== undefined &&
      existing?.time &&
      existing?.examinerName
    ) {
      try {
        await this.freeSlotModel.updateMany(
          {
            day: existing.day,
            month: existing.month,
            year: existing.year,
            time: existing.time,
            teacherName: new RegExp(`^${this.escapeRegex(existing.examinerName)}$`, 'i'),
            status: 'booked',
          },
          { $set: { status: 'available' } },
        ).exec();
      } catch (err) {
        console.warn('Could not release free slot on delete:', err);
      }
    }
    return { ok: true };
  }

  async getFinalTest(id: string) {
    const doc = await this.finalTestModel.findById(id).lean().exec();
    if (!doc) throw new Error('Không tìm thấy ca Final Test');
    return this.toFinalTestPublic(doc);
  }

  private async attachFinalTestGraderTasks(doc: {
    _id: { toString(): string };
    testType: string;
    candidateName: string;
    candidatePhone?: string;
    studentId?: string;
    examinerName?: string;
    date?: string;
    time?: string;
    day?: number;
    month?: number;
    year?: number;
    meetLink?: string;
    examLink?: string;
    submissionLink?: string;
    note?: string;
    format?: string;
  }) {
    const id = doc._id.toString();
    const examTime = `${doc.time || ''}${doc.format === 'offline' ? ' (Offline)' : ' (Online)'}`;
    const patch: Record<string, string> = {};

    if (doc.testType === 'speaking' || doc.testType === 'full_4_skills') {
      try {
        const mockTest = await this.mockTests.createForStaff({
          studentId: doc.studentId,
          studentName: doc.candidateName,
          skill: 'Speaking Final',
          day: doc.day,
          month: doc.month,
          year: doc.year,
          examTime,
          examTeacher: doc.examinerName,
          examLink: doc.meetLink || doc.examLink || undefined,
          note: doc.note || `Final Test — ${doc.candidatePhone || doc.candidateName}`,
          status: 'approved',
          source: 'final',
          finalTestId: id,
        });
        patch.mockTestId = mockTest.id;
      } catch (err) {
        console.warn('Could not create mock test for final test:', err);
      }
    }

    if (doc.testType === 'writing' || doc.testType === 'full_4_skills') {
      try {
        const autoGrader =
          (doc.examinerName || '').trim() || (await this.selectNextWritingGrader());
        const writingId = await this.createLinkedWritingSubmission({
          studentId: doc.studentId || `final:${id}`,
          studentName: doc.candidateName,
          examLink: doc.submissionLink || doc.examLink || doc.meetLink || 'pending://writing',
          testDateTime: `${doc.date || ''}T${doc.time || '00:00'}`,
          type: 'Final',
          source: 'final',
          assignedGrader: autoGrader,
          note: doc.note || `Final Writing — ${doc.candidateName}`,
          finalTestId: id,
        });
        patch.writingSubmissionId = writingId;
      } catch (err) {
        console.warn('Could not create writing submission for final test:', err);
      }
    }

    if (Object.keys(patch).length) {
      await this.finalTestModel.findByIdAndUpdate(id, { $set: patch }).exec();
    }
  }

  private async createLinkedWritingSubmission(input: {
    studentId: string;
    studentName: string;
    examLink: string;
    testDateTime: string;
    type: string;
    source: string;
    assignedGrader: string;
    note?: string;
    entranceBookingId?: string;
    finalTestId?: string;
  }): Promise<string> {
    const submittedByRole =
      input.source === 'entrance'
        ? 'sale'
        : input.source === 'final'
          ? 'student'
          : 'staff';
    const created = await this.writingSubmissionModel.create({
      studentId: input.studentId,
      studentName: input.studentName,
      examLink: input.examLink,
      testDateTime: input.testDateTime,
      status: 'pending',
      type: input.type,
      source: input.source,
      submittedByRole,
      assignedGrader: input.assignedGrader,
      note: input.note || '',
      entranceBookingId: input.entranceBookingId || '',
      finalTestId: input.finalTestId || '',
      dueDate: computeWritingDueDateFromSubmitted(new Date()),
    });
    return created._id.toString();
  }

  /** Phân chia đều Grader 1/2/3 giống luồng nộp Writing của học viên. */
  private async selectNextWritingGrader(): Promise<string> {
    const graders = ['Grader 1', 'Grader 2', 'Grader 3'] as const;
    const counts = await Promise.all(
      graders.map(async (g) => ({
        g,
        n: await this.writingSubmissionModel.countDocuments({ assignedGrader: g }).exec(),
      })),
    );
    counts.sort((a, b) => a.n - b.n);
    return counts[0]?.g || graders[0];
  }

  private async cancelLinkedWritingSubmission(id: string) {
    if (!id) return;
    try {
      const existing = await this.writingSubmissionModel.findById(id).lean().exec();
      if (!existing || existing.status === 'graded') return;
      await this.writingSubmissionModel.findByIdAndDelete(id).exec();
    } catch (err) {
      console.warn('Could not cancel linked writing submission:', err);
    }
  }

  // --- ACA Dashboard KPI ---
  async getDashboardKpi() {
    const [
      totalStudents,
      activeClasses,
      active11Classes,
      totalWriting,
      pendingWriting,
      gradedWriting,
      pendingMockTest,
      approvedMockTest,
      testedMockTest,
      totalLeads,
      newLeads,
      practiceStudents,
      weeklyDocsPending,
      finalTestsOpen,
    ] = await Promise.all([
      this.studentModel.countDocuments().exec(),
      this.classModel
        .countDocuments({
          type: { $nin: ['Lớp đã kết thúc'] },
        })
        .exec(),
      this.aca11Model.countDocuments({ status: 'Đang diễn ra' }).exec(),
      this.writingSubmissionModel.countDocuments().exec(),
      this.writingSubmissionModel.countDocuments({ status: 'pending' }).exec(),
      this.writingSubmissionModel.countDocuments({ status: 'graded' }).exec(),
      this.mockTestRequestModel.countDocuments({ status: 'pending' }).exec(),
      this.mockTestRequestModel.countDocuments({ status: 'approved' }).exec(),
      this.mockTestRequestModel
        .countDocuments({ status: { $in: ['tested', 'done', 'completed'] } })
        .exec(),
      this.guestLeadModel.countDocuments().exec(),
      this.guestLeadModel.countDocuments({ status: 'new' }).exec(),
      this.practiceStudentModel.countDocuments().exec(),
      this.weeklyDocModel.countDocuments({ status: 'Chưa nộp' }).exec(),
      this.finalTestModel
        .countDocuments({
          $or: [{ isChecked: { $ne: true } }, { isDone: { $ne: true } }],
        })
        .exec()
        .catch(() => 0),
    ]);

    return {
      totalUsers: 0,
      totalStudents,
      activeClasses,
      active11Classes,
      totalWriting,
      pendingWriting,
      gradedWriting,
      pendingMockTest,
      approvedMockTest,
      testedMockTest,
      totalLeads,
      newLeads,
      practiceStudents,
      weeklyDocsPending,
      finalTestsOpen,
    };
  }
}
