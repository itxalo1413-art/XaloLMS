import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcaClass, AcaClassDocument } from './schemas/aca-class.schema';
import { AcaStudent, AcaStudentDocument } from './schemas/aca-student.schema';
import { AcaPracticeWeek, AcaPracticeWeekDocument } from './schemas/aca-practice-week.schema';
import { AcaPracticeStudent, AcaPracticeStudentDocument } from './schemas/aca-practice-student.schema';
import { Aca11Class, Aca11ClassDocument } from './schemas/aca-11-class.schema';
import { AcaWeeklyDoc, AcaWeeklyDocDocument } from './schemas/aca-weekly-doc.schema';
import { AcaTeacherAssignment, AcaTeacherAssignmentDocument } from './schemas/aca-teacher-assignment.schema';
import { AcaFreeSlot, AcaFreeSlotDocument } from './schemas/aca-free-slot.schema';

function normalizeClassification(cls: string): string {
  const c = (cls || '').trim().toLowerCase();
  if (c.includes('combo')) return 'Combo';
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
  ) {}

  async onModuleInit() {
    await this.seedInitialData();
  }

  private async seedInitialData() {
    // Unconditionally clear and re-seed classes & students to apply new class codes
    await this.classModel.deleteMany({});
    await this.studentModel.deleteMany({});

    // Seed Monthly Classes
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
      { classCode: "PC246C2_P22-52026", name: "XLE RLP_PRE CORE - 246 - 20002200 / 220526 - GV Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "22/05/2026", teacher: "Quỳnh Châu", currentPhase: "Pre IELTS", phaseStartDate: "22/05/2026", phaseStudents: 3, nextPhaseStartDate: "17/07/2026", nextPhase: "CORE 2", slotsToEnroll: 9 },
      { classCode: "PC357C1_P23-52026", name: "XLE RLP_PRE CORE - 357 - 18002000 / 230526 - GV Thanh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "23/05/2026", teacher: "Thanh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "23/05/2026", phaseStudents: 4, nextPhaseStartDate: "18/07/2026", nextPhase: "CORE 2", slotsToEnroll: 8 },
      { classCode: "F357C2_180626", name: "XLE RLP_Foundation - 357 - C2 - GV Đăng Duy", month: 6, type: "Lớp mới", openDate: "18/06/2026", teacher: "Đăng Duy", currentPhase: "-", phaseStartDate: "-", phaseStudents: 0, nextPhaseStartDate: "18/06/2026", nextPhase: "-", slotsToEnroll: 10 }
    ];
    await this.classModel.insertMany(initialClasses);

    // Seed Students
    const studentCount = await this.studentModel.countDocuments().exec();
    if (studentCount === 0) {
      // Fetch classes to map class names to seeded IDs
      const seededClasses = await this.classModel.find().exec();
      const findClassIdByName = (name: string, month?: number): string => {
        return seededClasses.find(c => c.name.startsWith(name) && (month === undefined || c.month === month))?._id.toString() || 'cls_placeholder';
      };

      const initialStudents = [
        // Month 5
        { name: "Nguyễn Thị Ngọc Hân", phone: "0775399613", email: "ngochan279a@gmail.com", classification: "Học viên cũ học lại", scores: { l: 6.0, r: 6.0, w: 5.5, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1pkBwIMZI3nVaZjHpMbK-PLztc5jgs8G3hxlKVOcffNA/edit", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 5), stt: 1 },
        { name: "Trần Tuệ Linh", phone: "352796806", email: "alexandradiamond009@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 5.5, w: 5.5, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/14ISNNxxfyJqMF4wiV71Am-hLzQUtyoAgxBOMPvdexR0/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 5), stt: 2 },
        { name: "Phạm Lê Thảo Nhi", phone: "848142696", email: "missthaonhi2003@gmail.com", classification: "Học viên lớp C 19/1 tái đóng", scores: { l: 5.0, r: 5.5, w: 5.5, s: 4.5, o: 5.0 }, bcbLink: "https://docs.google.com/spreadsheets/d/1RqeuqpdTHVcv8RuE_D6Fu5l64mZZnyvU7EfC11zJHu0/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 5), stt: 3 },
        { name: "Cao Thanh Lâm", phone: "365756145", email: "thanhlamcao210@gmail.com", classification: "Học viên lớp C 14/10", scores: { l: 5.0, r: 5.0, w: 1.0, s: 4.0, o: "4.0/4.5" }, bcbLink: "https://docs.google.com/spreadsheets/d/1hNKxO28r4lt3H0lRko16rEZl4go4RxrWthztXE0ZaHM/edit", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 5), stt: 4 },
        
        // Month 6
        { name: "Vũ Thị Thùy", phone: "976664376", email: "tvt8489@gmail.com", classification: "Học viên cũ học lại", scores: { l: 5.5, r: 5.5, w: 6.5, s: 5.0, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1dlzuLPaixPm1XttFwCvvn13-va2xjYvXXJajiiz3qgA/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", 6), stt: 1 },
        { name: "Lê Phạm Huyền My", phone: "837725134", email: "phammy08029@gmail.com", classification: "Học viên combo học tiếp", scores: { l: "-", r: "-", w: 5.0, s: 4.0, o: "-" }, bcbLink: "https://drive.google.com/open?id=1FSvfkBbsQQNNPzxeGRJuuqW8dPiCdLMCVEKA9Jb6URs", note: "11/6 mới làm final L-R", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", 6), stt: 2 },
        { name: "Hồ Thị Thu", phone: "0344398257", email: "hothu736@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 6.5, w: 5.0, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1GZMK7RiadZKl6Ki6nC56-rvQ4Hx_X-uVFrEXYI6cwiI/edit?gid=1425079543#gid=1425079543", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", 6), stt: 3 },
        { name: "Dương Quang Đức Minh", phone: "336863109", email: "fbchinhcuaminh@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 6.0, w: 4.5, s: 3.5, o: 5.0 }, bcbLink: "https://drive.google.com/open?id=1oN1n1kQHecgpHgcBpO3ZQzF2zBMOkS4APseEGGWsWEo", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", 6), stt: 4 },
        { name: "Phạm Hà Linh", phone: "-", email: "-", classification: "Học viên C 1/4", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", 6), stt: 1 },
        { name: "Vũ Trúc Linh", phone: "-", email: "-", classification: "Học viên C 1/4", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", 6), stt: 2 },
        { name: "Bùi Minh Đăng", phone: "567255266", email: "buiminhdang261@gmail.com", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 6), stt: 1 },
        { name: "Lê Phương Hà", phone: "0848992009", email: "lephuongha209@gmail.com", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 6), stt: 2 },
        { name: "Trần Võ Mai Hương", phone: "0832150576", email: "maihuongtran1209@gmail.com", classification: "Học bổng Hè 20%", scores: { l: 5.5, r: 5.5, w: 2.5, s: 4.5, o: 4.5 }, bcbLink: "Trần Võ Mai Hương", note: "Học bổng Hè 20%", classId: findClassIdByName("XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", 6), stt: 1 },
        { name: "Trần Thanh Vũ", phone: "0816866472", email: "tranthanhvudeptrai369@gmail.com", classification: "Học viên mới", scores: { l: 3.0, r: 3.5, w: 2.5, s: 4.0, o: 3.5 }, bcbLink: "", note: "Trần Thanh Vũ", classId: findClassIdByName("XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm", 6), stt: 1 },
        { name: "Dương Ngọc Khôi Nguyên", phone: "0939705937", email: "student.demo@xalo.local", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "Tài khoản demo", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 6), stt: 3 },
        { name: "Dương Ngọc Khôi Nguyên", phone: "0939705937", email: "nguyenduong939705@gmail.com", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "Tài khoản chính", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", 6), stt: 4 }
      ];
      await this.studentModel.insertMany(initialStudents);
    }

    // Seed Practice Weeks
    const weekCount = await this.practiceWeekModel.countDocuments().exec();
    if (weekCount === 0) {
      const initialWeeks = [
        {
          weekRange: "20/04/2026 - 26/04/2026",
          linkMeet: "https://meet.google.com/abc-defg-hij",
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-1",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 20/4:\n - Lớp có học Speaking vào 19h45-21h45 thứ 7 25/4\n - Lớp không có lịch test tập trung vào CN\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (26/4) lớp mình không có lịch test tập trung, các bạn tham gia học Speaking vào thứ 7 (25/4) lúc 19h45-21h45 nhé!"
        },
        {
          weekRange: "27/04/2026 - 03/05/2026",
          linkMeet: "https://meet.google.com/abc-defg-hij",
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-2",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 27/4:\n - Lớp nghỉ, không có lịch học vào T3 và T7\n - Lớp có lịch test tập trung vào CN 3/5 9h-11h30\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (3/5) chị có lịch test lớp luyện đề lúc 9h00 - 11h30, em tham gia được thì phản hồi lại giúp chị nha!"
        },
        {
          weekRange: "08/06/2026 - 14/06/2026",
          linkMeet: "https://meet.google.com/xyz-uvwx-yza",
          linkTab: "https://docs.google.com/spreadsheets/d/1track-practice-test-3",
          announcement: "[Thông báo về lịch học lớp LĐ]\n\nTuần 8/6:\n - Lớp học bình thường vào thứ 3 và thứ 7\n - Lớp có lịch test tập trung vào CN 14/6 9h-11h30\n\nNhận được tin thì em react/confirm giúp chị nhé",
          templateMessage: "Em ơi, chủ nhật tuần này (14/6) chị có lịch test lớp luyện đề lúc 9h00 - 11h30, em tham gia được thì phản hồi lại giúp chị nha!"
        }
      ];
      await this.practiceWeekModel.insertMany(initialWeeks);
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
    return students.map(st => ({
      ...st,
      classification: normalizeClassification(st.classification || '')
    }));
  }
  async createStudent(data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    return this.studentModel.create(data);
  }
  async updateStudent(id: string, data: any) {
    if (data.classification) {
      data.classification = normalizeClassification(data.classification);
    }
    return this.studentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
  }
  async deleteStudent(id: string) {
    return this.studentModel.findByIdAndDelete(id).exec();
  }

  // --- Practice Weeks CRUD ---
  async findAllWeeks() {
    return this.practiceWeekModel.find().lean().exec();
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
}
