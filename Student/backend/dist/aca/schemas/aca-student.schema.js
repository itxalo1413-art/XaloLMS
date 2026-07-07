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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcaStudentSchema = exports.AcaStudent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AcaStudentScores = class AcaStudentScores {
    l;
    r;
    w;
    s;
    o;
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: '-' }),
    __metadata("design:type", Object)
], AcaStudentScores.prototype, "l", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: '-' }),
    __metadata("design:type", Object)
], AcaStudentScores.prototype, "r", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: '-' }),
    __metadata("design:type", Object)
], AcaStudentScores.prototype, "w", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: '-' }),
    __metadata("design:type", Object)
], AcaStudentScores.prototype, "s", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: '-' }),
    __metadata("design:type", Object)
], AcaStudentScores.prototype, "o", void 0);
AcaStudentScores = __decorate([
    (0, mongoose_1.Schema)()
], AcaStudentScores);
const AcaStudentScoresSchema = mongoose_1.SchemaFactory.createForClass(AcaStudentScores);
let AcaStudentCycle = class AcaStudentCycle {
    classCode;
    finalScore;
    registeredWriting;
    registeredMocktest;
    registeredLuyenDe;
    homeworkPercent;
    attendanceCount;
    scores;
    finalScores;
};
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudentCycle.prototype, "classCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudentCycle.prototype, "finalScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudentCycle.prototype, "registeredWriting", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudentCycle.prototype, "registeredMocktest", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudentCycle.prototype, "registeredLuyenDe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudentCycle.prototype, "homeworkPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudentCycle.prototype, "attendanceCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) }),
    __metadata("design:type", AcaStudentScores)
], AcaStudentCycle.prototype, "scores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) }),
    __metadata("design:type", AcaStudentScores)
], AcaStudentCycle.prototype, "finalScores", void 0);
AcaStudentCycle = __decorate([
    (0, mongoose_1.Schema)()
], AcaStudentCycle);
const AcaStudentCycleSchema = mongoose_1.SchemaFactory.createForClass(AcaStudentCycle);
let AcaStudent = class AcaStudent {
    classId;
    stt;
    name;
    phone;
    email;
    classification;
    scores;
    finalScores;
    entrance;
    registeredWriting;
    registeredMocktest;
    registeredLuyenDe;
    homeworkPercent;
    attendanceCount;
    registeredWriting2;
    registeredMocktest2;
    registeredLuyenDe2;
    homeworkPercent2;
    attendanceCount2;
    registeredWriting3;
    registeredMocktest3;
    registeredLuyenDe3;
    homeworkPercent3;
    attendanceCount3;
    l1;
    f1;
    l2;
    f2;
    l3;
    f3;
    bcbLink;
    note;
    cycles;
};
exports.AcaStudent = AcaStudent;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaStudent.prototype, "classId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], AcaStudent.prototype, "stt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaStudent.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "classification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AcaStudentScoresSchema, default: () => ({}) }),
    __metadata("design:type", AcaStudentScores)
], AcaStudent.prototype, "scores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AcaStudentScoresSchema, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) }),
    __metadata("design:type", AcaStudentScores)
], AcaStudent.prototype, "finalScores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "entrance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredWriting", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredMocktest", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredLuyenDe", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "homeworkPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "attendanceCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredWriting2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredMocktest2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredLuyenDe2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "homeworkPercent2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "attendanceCount2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredWriting3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredMocktest3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], AcaStudent.prototype, "registeredLuyenDe3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "homeworkPercent3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "attendanceCount3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "l1", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "f1", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "l2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "f2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "l3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "f3", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "bcbLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaStudent.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [AcaStudentCycleSchema], default: () => [] }),
    __metadata("design:type", Array)
], AcaStudent.prototype, "cycles", void 0);
exports.AcaStudent = AcaStudent = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_students', timestamps: true })
], AcaStudent);
exports.AcaStudentSchema = mongoose_1.SchemaFactory.createForClass(AcaStudent);
//# sourceMappingURL=aca-student.schema.js.map