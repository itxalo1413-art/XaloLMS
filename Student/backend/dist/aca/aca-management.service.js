"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcaManagementService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const aca_class_schema_1 = require("./schemas/aca-class.schema");
const aca_student_schema_1 = require("./schemas/aca-student.schema");
const aca_practice_week_schema_1 = require("./schemas/aca-practice-week.schema");
const aca_practice_student_schema_1 = require("./schemas/aca-practice-student.schema");
const aca_11_class_schema_1 = require("./schemas/aca-11-class.schema");
const aca_weekly_doc_schema_1 = require("./schemas/aca-weekly-doc.schema");
const aca_teacher_assignment_schema_1 = require("./schemas/aca-teacher-assignment.schema");
const aca_free_slot_schema_1 = require("./schemas/aca-free-slot.schema");
function normalizeClassification(cls) {
    const c = (cls || '').trim().toLowerCase();
    if (c.includes('combo'))
        return 'Combo';
    if (c.includes('học lại') || c.includes('hoc lai'))
        return 'Học lại';
    if (c.includes('chuyển lớp') || c.includes('chuyen lop'))
        return 'Chuyển lớp';
    return 'Lớp lẻ mới';
}
let AcaManagementService = class AcaManagementService {
    classModel;
    studentModel;
    practiceWeekModel;
    practiceStudentModel;
    aca11Model;
    weeklyDocModel;
    teacherAssignmentModel;
    freeSlotModel;
    constructor(classModel, studentModel, practiceWeekModel, practiceStudentModel, aca11Model, weeklyDocModel, teacherAssignmentModel, freeSlotModel) {
        this.classModel = classModel;
        this.studentModel = studentModel;
        this.practiceWeekModel = practiceWeekModel;
        this.practiceStudentModel = practiceStudentModel;
        this.aca11Model = aca11Model;
        this.weeklyDocModel = weeklyDocModel;
        this.teacherAssignmentModel = teacherAssignmentModel;
        this.freeSlotModel = freeSlotModel;
    }
    async onModuleInit() {
        await this.seedInitialData();
    }
    async seedInitialData() {
        const classCount = await this.classModel.countDocuments().exec();
        if (classCount === 0) {
            const initialClasses = [
                { classCode: "UPSTR-246-C2-KHOA-5", name: "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", month: 5, type: "Lớp đang diễn ra", openDate: "17/09/2024", teacher: "Đăng Khoa", currentPhase: "S-R", phaseStartDate: "30/03/2026", phaseStudents: 7, nextPhaseStartDate: "15/05/2026", nextPhase: "W-L", slotsToEnroll: 5 },
                { classCode: "UPSTR-246-C2-KHAI-5", name: "XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "10/02/2025", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "01/04/2026", phaseStudents: 4, nextPhaseStartDate: "18/05/2026", nextPhase: "W-L", slotsToEnroll: 8 },
                { classCode: "UPSTR-357-C1-HAI-5", name: "XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "27/03/2025", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "07/04/2026", phaseStudents: 3, nextPhaseStartDate: "21/05/2026", nextPhase: "S-R", slotsToEnroll: 9 },
                { classCode: "UPSTR-357-C2-KHAI-5", name: "XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "27/06/2024", teacher: "Duy Khải", currentPhase: "W-L", phaseStartDate: "14/04/2026", phaseStudents: 5, nextPhaseStartDate: "30/05/2026", nextPhase: "S-R", slotsToEnroll: 7 },
                { classCode: "MMNT-357-C1-DUNG-5", name: "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng", month: 5, type: "Lớp đang diễn ra", openDate: "24/03/2026", teacher: "Trung Dũng", currentPhase: "W-L", phaseStartDate: "24/03/2026", phaseStudents: 5, nextPhaseStartDate: "07/05/2026", nextPhase: "S-R", slotsToEnroll: 5 },
                { classCode: "MMNT-246-C2-HAI-5", name: "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "03/05/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "30/03/2026", phaseStudents: 3, nextPhaseStartDate: "18/05/2026", nextPhase: "W-L", slotsToEnroll: 7 },
                { classCode: "SOAR-SS-C1-TAM-5", name: "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm", month: 5, type: "Lớp đang diễn ra", openDate: "06/12/2025", teacher: "Minh Tâm", currentPhase: "W-L", phaseStartDate: "04/04/2026", phaseStudents: 1, nextPhaseStartDate: "23/05/2026", nextPhase: "S-R", slotsToEnroll: 11 },
                { classCode: "SOAR-246-C2-MINH-5", name: "XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh", month: 5, type: "Lớp đang diễn ra", openDate: "28/10/2024", teacher: "Quang Minh", currentPhase: "W-L", phaseStartDate: "03/04/2026", phaseStudents: 3, nextPhaseStartDate: "20/05/2026", nextPhase: "S-R", slotsToEnroll: 9 },
                { classCode: "SOAR-357-C2-HAI-5", name: "XLE RLP_Soar - 357 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "29/10/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "04/04/2026", phaseStudents: 2, nextPhaseStartDate: "26/05/2026", nextPhase: "W-L", slotsToEnroll: 10 },
                { classCode: "UPSTR-246-C1-KHAI-6", name: "XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "26/08/2024", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "29/04/2026", phaseStudents: 2, nextPhaseStartDate: "12/06/2026", nextPhase: "W-L", slotsToEnroll: 10 },
                { classCode: "UPSTR-246-C2-KHAI-6", name: "XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "10/02/2025", teacher: "Duy Khải", currentPhase: "W-L", phaseStartDate: "18/05/2026", phaseStudents: 2, nextPhaseStartDate: "29/06/2026", nextPhase: "S-R", slotsToEnroll: 10 },
                { classCode: "UPSTR-246-C2-KHOA-6", name: "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", month: 6, type: "Lớp đang diễn ra", openDate: "17/09/2024", teacher: "Đăng Khoa", currentPhase: "W-L", phaseStartDate: "15/05/2026", phaseStudents: 7, nextPhaseStartDate: "26/06/2026", nextPhase: "S-R", slotsToEnroll: 5 },
                { classCode: "UPSTR-357-C1-HAI-6", name: "XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "27/03/2025", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "21/05/2026", phaseStudents: 3, nextPhaseStartDate: "02/07/2026", nextPhase: "W-L", slotsToEnroll: 9 },
                { classCode: "UPSTR-357-C2-KHAI-6", name: "XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải", month: 6, type: "Lớp đang diễn ra", openDate: "27/06/2024", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "30/05/2026", phaseStudents: 5, nextPhaseStartDate: "11/07/2026", nextPhase: "W-L", slotsToEnroll: 7 },
                { classCode: "UPSTR-SS-C1-CHAU-6", name: "XLE RLP_Upstream - S/S - C1 - GV Nghiêm Doãn Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "18/04/2026", teacher: "Quỳnh Châu", currentPhase: "W-L", phaseStartDate: "18/04/2026", phaseStudents: 4, nextPhaseStartDate: "13/06/2026", nextPhase: "S-R", slotsToEnroll: 8 },
                { classCode: "MMNT-246-C1-HAI-6", name: "XLE RLP_Momentum - 246 - C1 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "26/08/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "04/05/2026", phaseStudents: 3, nextPhaseStartDate: "15/06/2026", nextPhase: "W-L", slotsToEnroll: 7 },
                { classCode: "MMNT-246-C2-HAI-6", name: "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "03/05/2024", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "18/05/2026", phaseStudents: 2, nextPhaseStartDate: "29/06/2026", nextPhase: "S-R", slotsToEnroll: 8 },
                { classCode: "MMNT-357-C1-DUNG-6", name: "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng", month: 6, type: "Lớp đang diễn ra", openDate: "24/03/2026", teacher: "Trung Dũng", currentPhase: "S-R", phaseStartDate: "07/05/2026", phaseStudents: 1, nextPhaseStartDate: "18/06/2026", nextPhase: "W-L", slotsToEnroll: 9 },
                { classCode: "MMNT-357-C2-CHAU-6", name: "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "21/04/2026", teacher: "Quỳnh Châu", currentPhase: "W-L", phaseStartDate: "21/04/2026", phaseStudents: 4, nextPhaseStartDate: "11/06/2026", nextPhase: "S-R", slotsToEnroll: 6 },
                { classCode: "SOAR-246-C1-MINH-6", name: "XLE RLP_Soar - 246 - C1 - GV Trần Quang Minh", month: 6, type: "Lớp đang diễn ra", openDate: "28/06/2024", teacher: "Quang Minh", currentPhase: "W-L", phaseStartDate: "29/05/2026", phaseStudents: 2, nextPhaseStartDate: "10/07/2026", nextPhase: "S-R", slotsToEnroll: 10 },
                { classCode: "SOAR-246-C2-MINH-6", name: "XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh", month: 6, type: "Lớp đang diễn ra", openDate: "28/10/2024", teacher: "Quang Minh", currentPhase: "S-R", phaseStartDate: "20/05/2026", phaseStudents: 2, nextPhaseStartDate: "01/07/2026", nextPhase: "W-L", slotsToEnroll: 10 },
                { classCode: "SOAR-357-C2-HAI-6", name: "XLE RLP_Soar - 357 - C2 - GV Lê Như Hải", month: 6, type: "Lớp đang diễn ra", openDate: "29/10/2024", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "26/05/2026", phaseStudents: 2, nextPhaseStartDate: "07/07/2026", nextPhase: "S-R", slotsToEnroll: 10 },
                { classCode: "SOAR-SS-C1-TAM-6", name: "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "06/12/2025", teacher: "Minh Tâm", currentPhase: "S-R", phaseStartDate: "23/05/2026", phaseStudents: 3, nextPhaseStartDate: "05/07/2026", nextPhase: "W-L", slotsToEnroll: 9 },
                { classCode: "ADV-246-C1-DUNG-6", name: "XLE RLP_Advanced - 246 - C1 - GV Nguyễn Lê Trung Dũng", month: 6, type: "Lớp đang diễn ra", openDate: "25/03/2026", teacher: "Trung Dũng", currentPhase: "S-R", phaseStartDate: "11/05/2026", phaseStudents: 2, nextPhaseStartDate: "22/06/2026", nextPhase: "W-L", slotsToEnroll: 8 },
                { classCode: "PCORE-246-1800-TAM-6", name: "XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "13/04/2026", teacher: "Minh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "13/04/2026", phaseStudents: 6, nextPhaseStartDate: "15/06/2026", nextPhase: "CORE 2", slotsToEnroll: 6 },
                { classCode: "PCORE-357-2000-TTAM-6", name: "XLE RLP_PRE CORE - 357 - 20002200 - GV Thanh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "14/04/2026", teacher: "Thanh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "14/04/2026", phaseStudents: 3, nextPhaseStartDate: "11/06/2026", nextPhase: "CORE 2", slotsToEnroll: 9 },
                { classCode: "PCORE-246-2000-CHAU-6", name: "XLE RLP_PRE CORE - 246 - 20002200 / 220526 - GV Quỳnh Châu", month: 6, type: "Lớp đang diễn ra", openDate: "22/05/2026", teacher: "Quỳnh Châu", currentPhase: "Pre IELTS", phaseStartDate: "22/05/2026", phaseStudents: 3, nextPhaseStartDate: "17/07/2026", nextPhase: "CORE 2", slotsToEnroll: 9 },
                { classCode: "PCORE-357-1800-TTAM-6", name: "XLE RLP_PRE CORE - 357 - 18002000 / 230526 - GV Thanh Tâm", month: 6, type: "Lớp đang diễn ra", openDate: "23/05/2026", teacher: "Thanh Tâm", currentPhase: "Pre IELTS", phaseStartDate: "23/05/2026", phaseStudents: 4, nextPhaseStartDate: "18/07/2026", nextPhase: "CORE 2", slotsToEnroll: 8 },
                { classCode: "FOUND-357-C2-DUY-6", name: "XLE RLP_Foundation - 357 - C2 - GV Đăng Duy", month: 6, type: "Lớp mới", openDate: "18/06/2026", teacher: "Đăng Duy", currentPhase: "-", phaseStartDate: "-", phaseStudents: 0, nextPhaseStartDate: "18/06/2026", nextPhase: "-", slotsToEnroll: 10 }
            ];
            await this.classModel.insertMany(initialClasses);
        }
        const studentCount = await this.studentModel.countDocuments().exec();
        if (studentCount === 0) {
            const seededClasses = await this.classModel.find().exec();
            const findClassIdByName = (name) => {
                return seededClasses.find(c => c.name.startsWith(name))?._id.toString() || 'cls_placeholder';
            };
            const initialStudents = [
                { name: "Nguyễn Thị Ngọc Hân", phone: "0775399613", email: "ngochan279a@gmail.com", classification: "Học viên cũ học lại", scores: { l: 6.0, r: 6.0, w: 5.5, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1pkBwIMZI3nVaZjHpMbK-PLztc5jgs8G3hxlKVOcffNA/edit", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 1 },
                { name: "Trần Tuệ Linh", phone: "352796806", email: "alexandradiamond009@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 5.5, w: 5.5, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/14ISNNxxfyJqMF4wiV71Am-hLzQUtyoAgxBOMPvdexR0/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 2 },
                { name: "Phạm Lê Thảo Nhi", phone: "848142696", email: "missthaonhi2003@gmail.com", classification: "Học viên lớp C 19/1 tái đóng", scores: { l: 5.0, r: 5.5, w: 5.5, s: 4.5, o: 5.0 }, bcbLink: "https://docs.google.com/spreadsheets/d/1RqeuqpdTHVcv8RuE_D6Fu5l64mZZnyvJ7EfC11zJHu0/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 3 },
                { name: "Cao Thanh Lâm", phone: "365756145", email: "thanhlamcao210@gmail.com", classification: "Học viên lớp C 14/10", scores: { l: 5.0, r: 5.0, w: 1.0, s: 4.0, o: "4.0/4.5" }, bcbLink: "https://docs.google.com/spreadsheets/d/1hNKxO28r4lt3H0lRko16rEZl4go4RxrWthztXE0ZaHM/edit", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 4 },
                { name: "Vũ Thị Thùy", phone: "976664376", email: "tvt8489@gmail.com", classification: "Học viên cũ học lại", scores: { l: 5.5, r: 5.5, w: 6.5, s: 5.0, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1dlzuLPaixPm1XttFwCvvn13-va2xjYvXXJajiiz3qgA/edit?usp=sharing", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải"), stt: 1 },
                { name: "Lê Phạm Huyền My", phone: "837725134", email: "phammy08029@gmail.com", classification: "Học viên combo học tiếp", scores: { l: "-", r: "-", w: 5.0, s: 4.0, o: "-" }, bcbLink: "https://drive.google.com/open?id=1FSvfkBbsQQNNPzxeGRJuuqW8dPiCdLMCVEKA9Jb6URs", note: "11/6 mới làm final L-R", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải"), stt: 2 },
                { name: "Hồ Thị Thu", phone: "0344398257", email: "hothu736@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 6.5, w: 5.0, s: 4.5, o: 5.5 }, bcbLink: "https://docs.google.com/spreadsheets/d/1GZMK7RiadZKl6Ki6nC56-rvQ4Hx_X-uVFrEXYI6cwiI/edit?gid=1425079543#gid=1425079543", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải"), stt: 3 },
                { name: "Dương Quang Đức Minh", phone: "336863109", email: "fbchinhcuaminh@gmail.com", classification: "Học viên combo học tiếp", scores: { l: 5.5, r: 6.0, w: 4.5, s: 3.5, o: 5.0 }, bcbLink: "https://drive.google.com/open?id=1oN1n1kQHecgpHgcBpO3ZQzF2zBMOkS4APseEGGWsWEo", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C1 - GV Tất Duy Khải"), stt: 4 },
                { name: "Phạm Hà Linh", phone: "-", email: "-", classification: "Học viên C 1/4", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải"), stt: 1 },
                { name: "Vũ Trúc Linh", phone: "-", email: "-", classification: "Học viên C 1/4", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải"), stt: 2 },
                { name: "Bùi Minh Đăng", phone: "567255266", email: "buiminhdang261@gmail.com", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 1 },
                { name: "Lê Phương Hà", phone: "0848992009", email: "lephuongha209@gmail.com", classification: "Học viên mới", scores: { l: "-", r: "-", w: "-", s: "-", o: "-" }, bcbLink: "", note: "", classId: findClassIdByName("XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa"), stt: 2 },
                { name: "Trần Võ Mai Hương", phone: "0832150576", email: "maihuongtran1209@gmail.com", classification: "Học bổng Hè 20%", scores: { l: 5.5, r: 5.5, w: 2.5, s: 4.5, o: 4.5 }, bcbLink: "Trần Võ Mai Hương", note: "Học bổng Hè 20%", classId: findClassIdByName("XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải"), stt: 1 },
                { name: "Trần Thanh Vũ", phone: "0816866472", email: "tranthanhvudeptrai369@gmail.com", classification: "Học viên mới", scores: { l: 3.0, r: 3.5, w: 2.5, s: 4.0, o: 3.5 }, bcbLink: "", note: "Trần Thanh Vũ", classId: findClassIdByName("XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm"), stt: 1 }
            ];
            await this.studentModel.insertMany(initialStudents);
        }
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
        const aca11Count = await this.aca11Model.countDocuments().exec();
        if (aca11Count === 0) {
            const initial11 = [
                { status: "Đã kết thúc", className: "2024RLP_ONL 1:1 Nguyễn Thị Khánh Hiền", inputNeed: "5.5/7.0", teacher: "Quỳnh Châu / Đăng Duy", schedule: "[36h] 3 buổi/tuần - 2h/buổi\nT3,5 14h-16h\nSáng thứ 5 9h-11h, CN 8h-10h", startDate: "18/8/2025 • 5/10/2025", endDate: "25/1?", progress: "Đang học khóa thứ 4 với GV Đăng Duy, buổi học gần nhất buổi số 16 ngày 23/1", output: "-", otherNote: "Có chuyển từ lớp soar chuyển qua lại lớp 1:1", zoomLink: "https://zoom.us/j/9876543210", successorLink: "https://docs.google.com/spreadsheets/d/1kh-successor", materials: "https://drive.google.com/drive/folders/kh-drive" },
                { status: "Bảo lưu", className: "2025RLP_ONL 1:1 Dương Bảo Ngọc", inputNeed: "5.5/7.5", teacher: "Khánh Thi / Gia Phú", schedule: "K1: [36h] 3 buổi/tuần\nK2: [18h] 9 buổi\nK3: [24h] 12 buổi", startDate: "4/9/2025 • 30/10/2025 • 25/11/2025", endDate: "23/10/2025 • 18/11/2025 (còn 10h học)", progress: "Bạn xin nghỉ liên tục, không duy trì lịch học đều, GV phải flexible lịch trình liên tục. Không thể hiện tiến độ phát triển đều", output: "Thi thật lần 1 ngày 19/11: L5.5 - R6.0 - W6.5 - S5.0. Chưa đăng kí thi lần 2", otherNote: "-", zoomLink: "https://zoom.us/j/1234567890", successorLink: "https://docs.google.com/spreadsheets/d/1bn-successor", materials: "https://drive.google.com/drive/folders/bn-drive" },
                { status: "Đang diễn ra", className: "2026RLP_ONL 1:1 Nguyễn Phương Yến", inputNeed: "5.5/7.0-7.5 (Mục tiêu Hè)", teacher: "Như Hải", schedule: "K1: [36h] 1 buổi/1 tuần - 3h/buổi\nT7 14h-17h", startDate: "21/3/2026", endDate: "27/6/2026", progress: "Lịch học tuần sau: T2 và T4 15h-16h30. Lịch học các tuần còn lại: T3 và T6 15h-16h30", output: "-", otherNote: "-", zoomLink: "https://zoom.us/j/111" }
            ];
            await this.aca11Model.insertMany(initial11);
        }
        const docCount = await this.weeklyDocModel.countDocuments().exec();
        if (docCount === 0) {
            const initialDocs = [
                { student: "Nguyễn Văn Anh", className: "Lớp Luyện Đề Room A", week: "Tuần 24", link: "https://docs.google.com/document-wd1", status: "Đã nhận" },
                { student: "Trần Thị Bình", className: "Lớp Luyện Đề Room A", week: "Tuần 24", link: "https://docs.google.com/document-wd2", status: "Đang chấm" },
                { student: "Phạm Minh Đức", className: "Lớp Luyện Đề Room B", week: "Tuần 25", link: "", status: "Chưa nộp" },
            ];
            await this.weeklyDocModel.insertMany(initialDocs);
        }
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
    async findAllClasses() {
        return this.classModel.find().lean().exec();
    }
    async createClass(data) {
        return this.classModel.create(data);
    }
    async updateClass(id, data) {
        return this.classModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteClass(id) {
        return this.classModel.findByIdAndDelete(id).exec();
    }
    async findAllStudents() {
        const students = await this.studentModel.find().lean().exec();
        return students.map(st => ({
            ...st,
            classification: normalizeClassification(st.classification || '')
        }));
    }
    async createStudent(data) {
        if (data.classification) {
            data.classification = normalizeClassification(data.classification);
        }
        return this.studentModel.create(data);
    }
    async updateStudent(id, data) {
        if (data.classification) {
            data.classification = normalizeClassification(data.classification);
        }
        return this.studentModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteStudent(id) {
        return this.studentModel.findByIdAndDelete(id).exec();
    }
    async findAllWeeks() {
        return this.practiceWeekModel.find().lean().exec();
    }
    async createWeek(data) {
        return this.practiceWeekModel.create(data);
    }
    async updateWeek(id, data) {
        return this.practiceWeekModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteWeek(id) {
        return this.practiceWeekModel.findByIdAndDelete(id).exec();
    }
    async findAllPracticeStudents() {
        return this.practiceStudentModel.find().lean().exec();
    }
    async createPracticeStudent(data) {
        return this.practiceStudentModel.create(data);
    }
    async updatePracticeStudent(id, data) {
        return this.practiceStudentModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deletePracticeStudent(id) {
        return this.practiceStudentModel.findByIdAndDelete(id).exec();
    }
    async findAll11Classes() {
        return this.aca11Model.find().lean().exec();
    }
    async create11Class(data) {
        return this.aca11Model.create(data);
    }
    async update11Class(id, data) {
        return this.aca11Model.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async delete11Class(id) {
        return this.aca11Model.findByIdAndDelete(id).exec();
    }
    async findAllWeeklyDocs() {
        return this.weeklyDocModel.find().lean().exec();
    }
    async createWeeklyDoc(data) {
        return this.weeklyDocModel.create(data);
    }
    async updateWeeklyDoc(id, data) {
        return this.weeklyDocModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteWeeklyDoc(id) {
        return this.weeklyDocModel.findByIdAndDelete(id).exec();
    }
    async findAllTeacherAssignments() {
        return this.teacherAssignmentModel.find().lean().exec();
    }
    async createTeacherAssignment(data) {
        return this.teacherAssignmentModel.create(data);
    }
    async updateTeacherAssignment(id, data) {
        return this.teacherAssignmentModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteTeacherAssignment(id) {
        return this.teacherAssignmentModel.findByIdAndDelete(id).exec();
    }
    async findAllFreeSlots() {
        return this.freeSlotModel.find().lean().exec();
    }
    async createFreeSlot(data) {
        return this.freeSlotModel.create(data);
    }
    async updateFreeSlot(id, data) {
        return this.freeSlotModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteFreeSlot(id) {
        return this.freeSlotModel.findByIdAndDelete(id).exec();
    }
};
exports.AcaManagementService = AcaManagementService;
exports.AcaManagementService = AcaManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(aca_class_schema_1.AcaClass.name)),
    __param(1, (0, mongoose_1.InjectModel)(aca_student_schema_1.AcaStudent.name)),
    __param(2, (0, mongoose_1.InjectModel)(aca_practice_week_schema_1.AcaPracticeWeek.name)),
    __param(3, (0, mongoose_1.InjectModel)(aca_practice_student_schema_1.AcaPracticeStudent.name)),
    __param(4, (0, mongoose_1.InjectModel)(aca_11_class_schema_1.Aca11Class.name)),
    __param(5, (0, mongoose_1.InjectModel)(aca_weekly_doc_schema_1.AcaWeeklyDoc.name)),
    __param(6, (0, mongoose_1.InjectModel)(aca_teacher_assignment_schema_1.AcaTeacherAssignment.name)),
    __param(7, (0, mongoose_1.InjectModel)(aca_free_slot_schema_1.AcaFreeSlot.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AcaManagementService);
//# sourceMappingURL=aca-management.service.js.map