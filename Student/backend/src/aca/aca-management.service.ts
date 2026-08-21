import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { AcaClass, AcaClassDocument } from './schemas/aca-class.schema';
import { AcaStudent, AcaStudentDocument } from './schemas/aca-student.schema';
import { AcaPracticeWeek, AcaPracticeWeekDocument } from './schemas/aca-practice-week.schema';
import { AcaPracticeStudent, AcaPracticeStudentDocument } from './schemas/aca-practice-student.schema';
import { Aca11Class, Aca11ClassDocument } from './schemas/aca-11-class.schema';
import { AcaWeeklyDoc, AcaWeeklyDocDocument } from './schemas/aca-weekly-doc.schema';
import { AcaTeacherAssignment, AcaTeacherAssignmentDocument } from './schemas/aca-teacher-assignment.schema';
import { AcaFreeSlot, AcaFreeSlotDocument } from './schemas/aca-free-slot.schema';
import { AcaTeacherProfile, AcaTeacherProfileDocument } from './schemas/aca-teacher-profile.schema';
import { WritingSubmission, WritingSubmissionDocument } from '../writing-submission/schemas/writing-submission.schema';
import { RlpCourseStore, RlpCourseStoreDocument } from '../rlp/schemas/rlp-course-store.schema';
import { computeStudentRlpProgress, formatAttendanceCount, formatHomeworkPercent } from '../rlp/rlp-progress.util';
import {
  FULL_COURSE_SESSIONS,
  hasCompletedFirstStage,
  hasCompletedFullCourse,
  requiredFullCourseSessions,
} from '../academic-warning/academic-warning.rules';
import { UsersService } from '../users/users.service';
import { MockTestService } from '../mock-test/mock-test.service';

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

@Injectable()
export class AcaManagementService implements OnModuleInit {
  constructor(
    @InjectModel(AcaClass.name) private readonly classModel: Model<AcaClassDocument>,
    @InjectModel(AcaStudent.name) private readonly studentModel: Model<AcaStudentDocument>,
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
    private readonly usersService: UsersService,
    private readonly mockTests: MockTestService,
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
    } else if (existingStudentUser.l1?.includes("Lê Như Hải")) {
      await this.studentModel.updateOne(
        { email: studentUserEmail },
        {
          $set: {
            classId: quynhChauClass?._id?.toString() || existingStudentUser.classId,
            l1: quynhChauClass?.name || "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu",
          },
        }
      );
    }

    // Seed Practice Weeks
    const weekCount = await this.practiceWeekModel.countDocuments().exec();
    const defaultZoomLink = "https://zoom.us/j/84219634521?pwd=example-lrw";
    if (weekCount === 0) {
      const initialWeeks = [
        {
          weekRange: "20/04/2026 - 26/04/2026",
          linkMeet: defaultZoomLink,
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-1",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 20/4:\n - Lớp có học Speaking vào 19h45-21h45 thứ 7 25/4\n - Lớp không có lịch test tập trung vào CN\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (26/4) lớp mình không có lịch test tập trung, các bạn tham gia học Speaking vào thứ 7 (25/4) lúc 19h45-21h45 nhé!"
        },
        {
          weekRange: "27/04/2026 - 03/05/2026",
          linkMeet: defaultZoomLink,
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-2",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 27/4:\n - Lớp nghỉ, không có lịch học vào T3 và T7\n - Lớp có lịch test tập trung vào CN 3/5 9h-11h30\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (3/5) chị có lịch test lớp luyện đề lúc 9h00 - 11h30, em tham gia được thì phản hồi lại giúp chị nha!"
        },
        {
          weekRange: "08/06/2026 - 14/06/2026",
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
    return this.classModel.create(data);
  }
  async updateClass(id: string, data: any) {
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
              progressNote: updated.progressNote
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
    const students = await this.studentModel.find().lean().exec();

    // 1. Fetch writing submission emails
    const writingSubmissions = await this.writingSubmissionModel.find({}, { studentGmail: 1, studentId: 1 }).lean().exec();
    const writingEmailsSet = new Set<string>();
    for (const ws of writingSubmissions) {
      if (ws.studentGmail) writingEmailsSet.add(ws.studentGmail.trim().toLowerCase());
      if (ws.studentId && ws.studentId.includes('@')) writingEmailsSet.add(ws.studentId.trim().toLowerCase());
    }

    // 2. Fetch RLP course stores for RLP attendance and homework calculations
    const rlpStores = await this.rlpCourseStoreModel.find({}).lean().exec();
    const rlpStoreMap = new Map<string, any[]>();
    for (const store of rlpStores) {
      rlpStoreMap.set(store.key, store.sessions || []);
    }

    return students.map(st => {
      const emailNorm = (st.email || '').trim().toLowerCase();
      const hasSubmittedWriting = writingEmailsSet.has(emailNorm);

      // Get sessions for student's class
      const storeKey = st.classId ? `rlp_store_${st.classId}` : '';
      const sessions = (storeKey && rlpStoreMap.get(storeKey)) || [];

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
        homeworkPercent: computedHomeworkPercent || cyc.homeworkPercent || '',
        attendanceCount: computedAttendanceCount || cyc.attendanceCount || '',
      }));

      return {
        ...st,
        registeredWriting: hasSubmittedWriting ? true : !!st.registeredWriting,
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

  async createStudent(data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    if (data.classId === undefined) {
      data.classId = '';
    }
    if (!data.stt) {
      data.stt = (await this.studentModel.countDocuments().exec()) + 1;
    }
    const created = await this.studentModel.create(data);
    if (created && created.email) {
      await this.ensureUserAccountForStudent(created);
    }
    return created;
  }
  async updateStudent(id: string, data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    const updated = await this.studentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    if (updated && updated.email) {
      await this.ensureUserAccountForStudent(updated);
    }
    return updated;
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
      } catch (err) {
        // ignore race condition
      }
    }
    return weeks;
  }
  async createWeek(data: any) {
    return this.practiceWeekModel.create(data);
  }
  async updateWeek(id: string, data: any) {
    return this.practiceWeekModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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

  // --- Weekly Docs CRUD ---
  async findAllWeeklyDocs() {
    return this.weeklyDocModel.find().lean().exec();
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
      .findOneAndUpdate({ id }, { $set: data }, { new: true, upsert: true })
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
    return this.dailyNoteModel.findByIdAndUpdate(doc._id, { $set: data }, { new: true }).exec();
  }

  // --- Mock Test Requests CRUD ---
  async findAllMockTestRequests() {
    return this.mockTestRequestModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async createMockTestRequest(data: any) {
    return this.mockTestRequestModel.create(data);
  }

  async updateMockTestRequest(id: string, data: any) {
    return this.mockTestRequestModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async deleteMockTestRequest(id: string) {
    return this.mockTestRequestModel.findByIdAndDelete(id).exec();
  }

  // --- Course Settings & Important Links CRUD ---
  async getCourseSettings() {
    let doc = await this.courseSettingsModel.findOne().exec();
    if (!doc) {
      doc = await this.courseSettingsModel.create({
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
      });
    }
    return doc;
  }

  async updateCourseSettings(data: any) {
    let doc = await this.courseSettingsModel.findOne().exec();
    if (!doc) {
      return this.courseSettingsModel.create(data);
    }
    return this.courseSettingsModel.findByIdAndUpdate(doc._id, { $set: data }, { new: true }).exec();
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
      .findByIdAndUpdate(id, { $set: update }, { new: true })
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

  async saveGuestLeadDiagnosis(id: string, diagnosis: Record<string, unknown>) {
    const doc = await this.guestLeadModel
      .findByIdAndUpdate(
        id,
        { $set: { diagnosis } },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy lead');
    return {
      ...this.toLeadPublic(doc),
      diagnosis: (doc as any).diagnosis ?? diagnosis,
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
        const writingId = await this.createLinkedWritingSubmission({
          studentId: doc.leadId || `guest:${doc.candidatePhone || doc._id.toString()}`,
          studentName: doc.candidateName,
          examLink: doc.submissionLink || doc.examLink || doc.meetLink || 'pending://writing',
          testDateTime: `${doc.date}T${doc.time || '00:00'}`,
          type: 'Entrance',
          source: 'entrance',
          assignedGrader: doc.graderName,
          note: doc.note || `Entrance Writing — ${doc.candidatePhone}`,
          entranceBookingId: doc._id.toString(),
        });
        doc.writingSubmissionId = writingId;
        await this.entranceBookingModel
          .findByIdAndUpdate(doc._id, { $set: { writingSubmissionId: writingId } })
          .exec();
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
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[key] = patch[key];
    }
    const doc = await this.entranceBookingModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
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
      { upsert: true, new: true },
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
    const hideScores = Boolean(opts?.redactUnreleased) && !isChecked;
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

    const storeKey = classId && classId !== 'cls_placeholder' ? `rlp_store_${classId}` : '';
    let sessions: any[] = [];
    if (storeKey) {
      const classStore = await this.rlpCourseStoreModel.findOne({ key: storeKey }).lean().exec();
      sessions = (classStore?.sessions as any[]) || [];
    }
    if (sessions.length === 0) {
      const mainStore = await this.rlpCourseStoreModel.findOne({ key: 'main' }).lean().exec();
      sessions = (mainStore?.sessions as any[]) || [];
    }

    const progress = computeStudentRlpProgress(sessions, {
      id: String(student._id),
      email: student.email,
      name: student.name,
      phone: student.phone,
    });

    const eligibilityInput = {
      totalSessionsElapsed: progress.totalSessionsElapsed,
      classOpenDate: cls?.openDate || '',
      phaseStartDate: cls?.phaseStartDate || '',
      nextPhaseStartDate: cls?.nextPhaseStartDate || '',
      endDate: cls?.endDate || '',
      phaseDurationDays: cls?.phaseDurationDays,
      requiredSessions,
    };

    const firstStageCompleted = hasCompletedFirstStage(eligibilityInput);
    const fullCourseCompleted = hasCompletedFullCourse(eligibilityInput);

    if (fullCourseCompleted) {
      return {
        eligible: true,
        totalSessionsElapsed: progress.totalSessionsElapsed,
        requiredSessions,
        firstStageCompleted: true,
        fullCourseCompleted: true,
        classCode,
        className: cls?.name || '',
      };
    }

    const remaining = Math.max(0, requiredSessions - progress.totalSessionsElapsed);
    const isFoundation = requiredSessions <= 12;
    return {
      eligible: false,
      reason: isFoundation
        ? 'Chưa hoàn thành chương trình Foundation. Bạn cần học đủ 1 chặng trước khi đăng ký Final Test.'
        : `Chưa hoàn thành đủ 2 chặng (1 khóa học). Bạn cần học xong cả Chặng 1 và Chặng 2 trước khi đăng ký Final Test.${remaining > 0 ? ` (Còn ~${remaining} buổi)` : ''}`,
      totalSessionsElapsed: progress.totalSessionsElapsed,
      requiredSessions,
      firstStageCompleted,
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
          'Chưa hoàn thành đủ 2 chặng (1 khóa học) để đăng ký Final Test.',
      );
    }
  }

  async createFinalTest(input: Record<string, unknown>) {
    const dateStr = ((input.date as string) ?? '').trim();
    const parsed = this.parseFinalTestDate(dateStr);
    const format = ((input.format as string) || 'online') as FinalTestFormat;
    const testType = ((input.testType as string) || 'full_4_skills') as FinalTestType;

    const doc = await this.finalTestModel.create({
      candidateName: ((input.candidateName as string) ?? '').trim(),
      candidatePhone: ((input.candidatePhone as string) ?? '').trim(),
      candidateEmail: ((input.candidateEmail as string) ?? '').trim(),
      studentId: ((input.studentId as string) ?? '').trim(),
      classCode: ((input.classCode as string) ?? '').trim(),
      className: ((input.className as string) ?? '').trim(),
      targetBand: ((input.targetBand as string) ?? '6.5').trim(),
      testType,
      format,
      examinerName: ((input.examinerName as string) ?? '').trim(),
      date: dateStr,
      time: ((input.time as string) ?? '').trim(),
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
      graderSpeaking: ((input.graderSpeaking as string) ?? ((input.examinerName as string) ?? '')).trim(),
      isChecked: Boolean(input.isChecked),
      resultStatus: ((input.resultStatus as string) ?? 'Không đạt').trim(),
      isDone: Boolean(input.isDone),
    });

    await this.attachFinalTestGraderTasks(doc);
    const fresh = await this.finalTestModel.findById(doc._id).exec();
    return this.toFinalTestPublic(fresh ?? doc);
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
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .lean()
      .exec();
    if (!doc) throw new Error('Không tìm thấy ca Final Test');
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
    return updated;
  }

  async deleteFinalTest(id: string) {
    const existing = await this.finalTestModel.findById(id).lean().exec();
    if (!existing) throw new Error('Không tìm thấy ca Final Test');
    await this.finalTestModel.findByIdAndDelete(id).exec();
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
        const writingId = await this.createLinkedWritingSubmission({
          studentId: doc.studentId || `final:${id}`,
          studentName: doc.candidateName,
          examLink: doc.submissionLink || doc.examLink || doc.meetLink || 'pending://writing',
          testDateTime: `${doc.date || ''}T${doc.time || '00:00'}`,
          type: 'Final',
          source: 'final',
          assignedGrader: doc.examinerName || '',
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
    const created = await this.writingSubmissionModel.create({
      studentId: input.studentId,
      studentName: input.studentName,
      examLink: input.examLink,
      testDateTime: input.testDateTime,
      status: 'pending',
      type: input.type,
      source: input.source,
      assignedGrader: input.assignedGrader,
      note: input.note || '',
      entranceBookingId: input.entranceBookingId || '',
      finalTestId: input.finalTestId || '',
    });
    return created._id.toString();
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
      totalUsers,
      totalStudents,
      totalWriting,
      pendingWriting,
      pendingMockTest,
      totalLeads,
      newLeads,
    ] = await Promise.all([
      Promise.resolve(0),
      this.studentModel.countDocuments().exec(),
      this.writingSubmissionModel.countDocuments().exec(),
      this.writingSubmissionModel.countDocuments({ status: 'pending' }).exec(),
      this.mockTestRequestModel.countDocuments({ status: 'pending' }).exec(),
      this.guestLeadModel.countDocuments().exec(),
      this.guestLeadModel.countDocuments({ status: 'new' }).exec(),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalWriting,
      pendingWriting,
      pendingMockTest,
      totalLeads,
      newLeads,
    };
  }
}
