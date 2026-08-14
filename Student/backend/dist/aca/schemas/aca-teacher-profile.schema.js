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
exports.AcaTeacherProfileSchema = exports.AcaTeacherProfile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AcaTeacherProfile = class AcaTeacherProfile {
    id;
    name;
    email;
    phone;
    skills;
    status;
    joinDate;
    notes;
};
exports.AcaTeacherProfile = AcaTeacherProfile;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, lowercase: true }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: '' }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], AcaTeacherProfile.prototype, "skills", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['active', 'inactive'], default: 'active' }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: '' }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "joinDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: '' }),
    __metadata("design:type", String)
], AcaTeacherProfile.prototype, "notes", void 0);
exports.AcaTeacherProfile = AcaTeacherProfile = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_teacher_profiles', timestamps: true })
], AcaTeacherProfile);
exports.AcaTeacherProfileSchema = mongoose_1.SchemaFactory.createForClass(AcaTeacherProfile);
//# sourceMappingURL=aca-teacher-profile.schema.js.map