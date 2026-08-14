"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const aca_class_schema_1 = require("./schemas/aca-class.schema");
const aca_student_schema_1 = require("./schemas/aca-student.schema");
const aca_practice_week_schema_1 = require("./schemas/aca-practice-week.schema");
const aca_practice_student_schema_1 = require("./schemas/aca-practice-student.schema");
const aca_11_class_schema_1 = require("./schemas/aca-11-class.schema");
const aca_weekly_doc_schema_1 = require("./schemas/aca-weekly-doc.schema");
const aca_teacher_assignment_schema_1 = require("./schemas/aca-teacher-assignment.schema");
const aca_free_slot_schema_1 = require("./schemas/aca-free-slot.schema");
const aca_teacher_profile_schema_1 = require("./schemas/aca-teacher-profile.schema");
const writing_submission_schema_1 = require("../writing-submission/schemas/writing-submission.schema");
const rlp_course_store_schema_1 = require("../rlp/schemas/rlp-course-store.schema");
const users_service_1 = require("../users/users.service");
const daily_note_schema_1 = require("./schemas/daily-note.schema");
const mock_test_request_schema_1 = require("./schemas/mock-test-request.schema");
const course_settings_schema_1 = require("./schemas/course-settings.schema");
function normalizeClassification(cls) {
    const c = (cls || '').trim().toLowerCase();
    if (c.includes('combo') || c.includes('-') || c.includes('_') || c.includes('2') || c.includes('premium'))
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
    teacherProfileModel;
    writingSubmissionModel;
    rlpCourseStoreModel;
    dailyNoteModel;
    mockTestRequestModel;
    courseSettingsModel;
    usersService;
    constructor(classModel, studentModel, practiceWeekModel, practiceStudentModel, aca11Model, weeklyDocModel, teacherAssignmentModel, freeSlotModel, teacherProfileModel, writingSubmissionModel, rlpCourseStoreModel, dailyNoteModel, mockTestRequestModel, courseSettingsModel, usersService) {
        this.classModel = classModel;
        this.studentModel = studentModel;
        this.practiceWeekModel = practiceWeekModel;
        this.practiceStudentModel = practiceStudentModel;
        this.aca11Model = aca11Model;
        this.weeklyDocModel = weeklyDocModel;
        this.teacherAssignmentModel = teacherAssignmentModel;
        this.freeSlotModel = freeSlotModel;
        this.teacherProfileModel = teacherProfileModel;
        this.writingSubmissionModel = writingSubmissionModel;
        this.rlpCourseStoreModel = rlpCourseStoreModel;
        this.dailyNoteModel = dailyNoteModel;
        this.mockTestRequestModel = mockTestRequestModel;
        this.courseSettingsModel = courseSettingsModel;
        this.usersService = usersService;
    }
    async onModuleInit() {
        await this.seedInitialData();
    }
    async seedInitialData() {
        const classCount = await this.classModel.countDocuments().exec();
        if (classCount === 0) {
            const initialClasses = [
                { classCode: "U246C2.2", name: "XLE RLP_Upstream - 246 - C2 - GV Thái Đỗ Đăng Khoa", month: 5, type: "Lớp đang diễn ra", openDate: "17/09/2024", teacher: "Đăng Khoa", currentPhase: "S-R", phaseStartDate: "18/05/2026", phaseStudents: 7, nextPhaseStartDate: "29/06/2026", nextPhase: "W-L", slotsToEnroll: 5 },
                { classCode: "U246C2.1", name: "XLE RLP_Upstream - 246 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "10/02/2025", teacher: "Duy Khải", currentPhase: "S-R", phaseStartDate: "15/05/2026", phaseStudents: 4, nextPhaseStartDate: "26/06/2026", nextPhase: "W-L", slotsToEnroll: 8 },
                { classCode: "U357C1", name: "XLE RLP_Upstream - 357 - C1 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "27/03/2025", teacher: "Như Hải", currentPhase: "W-L", phaseStartDate: "20/05/2026", phaseStudents: 3, nextPhaseStartDate: "01/07/2026", nextPhase: "S-R", slotsToEnroll: 9 },
                { classCode: "U357C2", name: "XLE RLP_Upstream - 357 - C2 - GV Tất Duy Khải", month: 5, type: "Lớp đang diễn ra", openDate: "27/06/2024", teacher: "Duy Khải", currentPhase: "W-L", phaseStartDate: "29/05/2026", phaseStudents: 5, nextPhaseStartDate: "10/07/2026", nextPhase: "S-R", slotsToEnroll: 7 },
                { classCode: "M357C1", name: "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng", month: 5, type: "Lớp đang diễn ra", openDate: "24/03/2026", teacher: "Trung Dũng", currentPhase: "W-L", phaseStartDate: "02/06/2026", phaseStudents: 5, nextPhaseStartDate: "14/07/2026", nextPhase: "S-R", slotsToEnroll: 5 },
                { classCode: "M246C2", name: "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "03/05/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "18/05/2026", phaseStudents: 3, nextPhaseStartDate: "29/06/2026", nextPhase: "W-L", slotsToEnroll: 7 },
                { classCode: "SSSC1", name: "XLE RLP_Soar - S/S - C1 - GV Nguyễn Lưu Minh Tâm", month: 5, type: "Lớp đang diễn ra", openDate: "06/12/2025", teacher: "Minh Tâm", currentPhase: "W-L", phaseStartDate: "21/05/2026", phaseStudents: 1, nextPhaseStartDate: "02/07/2026", nextPhase: "S-R", slotsToEnroll: 11 },
                { classCode: "S246C2", name: "XLE RLP_Soar - 246 - C2 - GV Trần Quang Minh", month: 5, type: "Lớp đang diễn ra", openDate: "28/10/2024", teacher: "Quang Minh", currentPhase: "W-L", phaseStartDate: "20/05/2026", phaseStudents: 3, nextPhaseStartDate: "01/07/2026", nextPhase: "S-R", slotsToEnroll: 9 },
                { classCode: "S357C2", name: "XLE RLP_Soar - 357 - C2 - GV Lê Như Hải", month: 5, type: "Lớp đang diễn ra", openDate: "29/10/2024", teacher: "Như Hải", currentPhase: "S-R", phaseStartDate: "23/05/2026", phaseStudents: 2, nextPhaseStartDate: "04/07/2026", nextPhase: "W-L", slotsToEnroll: 10 },
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
        }
        const studentCount = await this.studentModel.countDocuments().exec();
        if (studentCount === 0) {
            const seededClasses = await this.classModel.find().exec();
            const findClassIdByName = (name, month) => {
                return seededClasses.find(c => c.name.startsWith(name) && (month === undefined || c.month === month))?._id.toString() || 'cls_placeholder';
            };
            const jsonPath = path.join(process.cwd(), 'src/aca/mapped_students.json');
            let rawData = [];
            try {
                if (fs.existsSync(jsonPath)) {
                    rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                }
            }
            catch (err) {
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
                }
                else if (normalized.includes("M-A") || normalized.includes("M_A") || normalized.includes("MA") || normalized.includes("M-2A") || normalized.includes("2M-A")) {
                    const choices = [
                        "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu",
                        "XLE RLP_Momentum - 246 - C2 - GV Lê Như Hải",
                        "XLE RLP_Momentum - 357 - C1 - GV Nguyễn Lê Trung Dũng"
                    ];
                    classTarget = choices[index % choices.length];
                }
                else if (normalized.includes("C-") || normalized.includes("PC") || normalized.includes("P-")) {
                    const choices = [
                        "XLE RLP_PRE CORE - 246 - 20002200 / 220526 - GV Quỳnh Châu",
                        "XLE RLP_PRE CORE - 246 - 18002000 - GV Minh Tâm",
                        "XLE RLP_PRE CORE - 357 - 20002200 - GV Thanh Tâm"
                    ];
                    classTarget = choices[index % choices.length];
                }
                else {
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
        }
        else if (existingStudentUser.l1?.includes("Lê Như Hải")) {
            await this.studentModel.updateOne({ email: studentUserEmail }, {
                $set: {
                    classId: quynhChauClass?._id?.toString() || existingStudentUser.classId,
                    l1: quynhChauClass?.name || "XLE RLP_Momentum - 357 - C2 - GV Nghiêm Doãn Quỳnh Châu",
                },
            });
        }
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
        }
        else {
            await this.practiceWeekModel.updateMany({ linkMeet: { $regex: /meet\.google\.com/i } }, { $set: { linkMeet: defaultZoomLink } }).exec();
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
        const updated = await this.classModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
        if (updated && updated.classCode) {
            const codePrefix = updated.classCode.replace(/-\d+$/i, '');
            if (codePrefix && codePrefix !== updated.classCode) {
                const regex = new RegExp(`^${codePrefix}-\\d+$`, 'i');
                await this.classModel.updateMany({ classCode: { $regex: regex }, _id: { $ne: updated._id } }, {
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
                }).exec();
            }
        }
        return updated;
    }
    async deleteClass(id) {
        return this.classModel.findByIdAndDelete(id).exec();
    }
    async findAllStudents() {
        const students = await this.studentModel.find().lean().exec();
        const writingSubmissions = await this.writingSubmissionModel.find({}, { studentGmail: 1, studentId: 1 }).lean().exec();
        const writingEmailsSet = new Set();
        for (const ws of writingSubmissions) {
            if (ws.studentGmail)
                writingEmailsSet.add(ws.studentGmail.trim().toLowerCase());
            if (ws.studentId && ws.studentId.includes('@'))
                writingEmailsSet.add(ws.studentId.trim().toLowerCase());
        }
        const rlpStores = await this.rlpCourseStoreModel.find({}).lean().exec();
        const rlpStoreMap = new Map();
        for (const store of rlpStores) {
            rlpStoreMap.set(store.key, store.sessions || []);
        }
        const mainSessions = rlpStoreMap.get('main') || [];
        return students.map(st => {
            const emailNorm = (st.email || '').trim().toLowerCase();
            const hasSubmittedWriting = writingEmailsSet.has(emailNorm);
            const storeKey = st.classId ? `rlp_store_${st.classId}` : 'main';
            const sessions = rlpStoreMap.get(storeKey) || mainSessions;
            let computedHomeworkPercent = st.homeworkPercent || '';
            let computedAttendanceCount = st.attendanceCount || '';
            if (sessions && sessions.length > 0) {
                let presentCount = 0;
                let submittedHwCount = 0;
                let totalAssignedHwCount = 0;
                for (const sess of sessions) {
                    if (sess.attendance === 'present') {
                        presentCount++;
                    }
                    if (sess.homeworkStatus && sess.homeworkStatus !== 'not_assigned') {
                        totalAssignedHwCount++;
                        if (sess.homeworkStatus === 'submitted' || sess.homeworkStatus === 'submitted_waiting') {
                            submittedHwCount++;
                        }
                    }
                }
                if (totalAssignedHwCount > 0) {
                    const pct = Math.round((submittedHwCount / totalAssignedHwCount) * 100);
                    computedHomeworkPercent = `${pct}%`;
                }
                computedAttendanceCount = `${presentCount}/${sessions.length}`;
            }
            const updatedCycles = (st.cycles || []).map((cyc) => ({
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
    async ensureUserAccountForStudent(student) {
        if (!student || !student.email || !student.email.includes('@'))
            return;
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
        }
        catch (err) {
            console.warn(`Could not auto-create student user account for ${student.email}:`, err);
        }
    }
    async createStudent(data) {
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
    async updateStudent(id, data) {
        if (data.classification) {
            data.classification = normalizeClassification(data.classification);
        }
        const updated = await this.studentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
        if (updated && updated.email) {
            await this.ensureUserAccountForStudent(updated);
        }
        return updated;
    }
    async deleteStudent(id) {
        return this.studentModel.findByIdAndDelete(id).exec();
    }
    async findAllWeeks() {
        const weeks = await this.practiceWeekModel.find().lean().exec();
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diffToSat = (day + 1) % 7;
        const startDate = new Date(d);
        startDate.setDate(startDate.getDate() - diffToSat);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const pad = (n) => n.toString().padStart(2, '0');
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
                weeks.push(created.toObject ? created.toObject() : created);
            }
            catch (err) {
            }
        }
        return weeks;
    }
    async createWeek(data) {
        return this.practiceWeekModel.create(data);
    }
    async updateWeek(id, data) {
        return this.practiceWeekModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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
        return this.practiceStudentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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
        return this.aca11Model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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
        return this.weeklyDocModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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
        return this.teacherAssignmentModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
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
        return this.freeSlotModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    }
    async deleteFreeSlot(id) {
        return this.freeSlotModel.findByIdAndDelete(id).exec();
    }
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
    async createTeacherProfile(data) {
        if (!data.id) {
            data.id = `tch-${Date.now()}`;
        }
        const created = await this.teacherProfileModel.create(data);
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
            }
            catch (err) {
                console.warn(`Could not auto-create user account for teacher ${data.email}:`, err);
            }
        }
        return created;
    }
    async updateTeacherProfile(id, data) {
        return this.teacherProfileModel
            .findOneAndUpdate({ id }, { $set: data }, { new: true, upsert: true })
            .exec();
    }
    async deleteTeacherProfile(id) {
        return this.teacherProfileModel.findOneAndDelete({ id }).exec();
    }
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
    async updateDailyNote(data) {
        let doc = await this.dailyNoteModel.findOne().exec();
        if (!doc) {
            return this.dailyNoteModel.create(data);
        }
        return this.dailyNoteModel.findByIdAndUpdate(doc._id, { $set: data }, { new: true }).exec();
    }
    async findAllMockTestRequests() {
        return this.mockTestRequestModel.find().sort({ createdAt: -1 }).lean().exec();
    }
    async createMockTestRequest(data) {
        return this.mockTestRequestModel.create(data);
    }
    async updateMockTestRequest(id, data) {
        return this.mockTestRequestModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
    }
    async deleteMockTestRequest(id) {
        return this.mockTestRequestModel.findByIdAndDelete(id).exec();
    }
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
    async updateCourseSettings(data) {
        let doc = await this.courseSettingsModel.findOne().exec();
        if (!doc) {
            return this.courseSettingsModel.create(data);
        }
        return this.courseSettingsModel.findByIdAndUpdate(doc._id, { $set: data }, { new: true }).exec();
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
    __param(8, (0, mongoose_1.InjectModel)(aca_teacher_profile_schema_1.AcaTeacherProfile.name)),
    __param(9, (0, mongoose_1.InjectModel)(writing_submission_schema_1.WritingSubmission.name)),
    __param(10, (0, mongoose_1.InjectModel)(rlp_course_store_schema_1.RlpCourseStore.name)),
    __param(11, (0, mongoose_1.InjectModel)(daily_note_schema_1.DailyNote.name)),
    __param(12, (0, mongoose_1.InjectModel)(mock_test_request_schema_1.MockTestRequest.name)),
    __param(13, (0, mongoose_1.InjectModel)(course_settings_schema_1.CourseSettings.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService])
], AcaManagementService);
//# sourceMappingURL=aca-management.service.js.map