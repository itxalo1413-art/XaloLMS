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
exports.TeacherAttendanceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const teacher_attendance_schema_1 = require("./schemas/teacher-attendance.schema");
let TeacherAttendanceService = class TeacherAttendanceService {
    attendanceModel;
    constructor(attendanceModel) {
        this.attendanceModel = attendanceModel;
    }
    async getAttendanceMap(teacherEmail) {
        if (!teacherEmail)
            return {};
        const email = teacherEmail.trim().toLowerCase();
        const records = await this.attendanceModel.find({ teacherEmail: email }).lean().exec();
        const map = {};
        for (const r of records) {
            map[r.sessionId] = r.attended;
        }
        return map;
    }
    async toggleAttendance(teacherEmail, sessionId, attended) {
        const email = teacherEmail.trim().toLowerCase();
        const existing = await this.attendanceModel.findOne({ teacherEmail: email, sessionId }).exec();
        const nextValue = attended !== undefined ? attended : !(existing?.attended ?? false);
        await this.attendanceModel.findOneAndUpdate({ teacherEmail: email, sessionId }, { $set: { attended: nextValue } }, { upsert: true }).exec();
        return this.getAttendanceMap(email);
    }
};
exports.TeacherAttendanceService = TeacherAttendanceService;
exports.TeacherAttendanceService = TeacherAttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(teacher_attendance_schema_1.TeacherAttendance.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TeacherAttendanceService);
//# sourceMappingURL=teacher-attendance.service.js.map