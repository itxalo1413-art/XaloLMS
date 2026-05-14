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
exports.StudentProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const update_student_profile_dto_1 = require("./dto/update-student-profile.dto");
const student_profile_service_1 = require("./student-profile.service");
let StudentProfileController = class StudentProfileController {
    studentProfileService;
    constructor(studentProfileService) {
        this.studentProfileService = studentProfileService;
    }
    getProfile() {
        return this.studentProfileService.getProfile();
    }
    updateProfile(payload) {
        return this.studentProfileService.updateProfile(payload);
    }
    uploadAvatar(file) {
        if (!file) {
            throw new common_1.BadRequestException('Missing avatar file.');
        }
        if (!file.mimetype?.startsWith('image/')) {
            throw new common_1.BadRequestException('Avatar must be an image file.');
        }
        return this.studentProfileService.updateAvatar(file);
    }
};
exports.StudentProfileController = StudentProfileController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_student_profile_dto_1.UpdateStudentProfileDto]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "uploadAvatar", null);
exports.StudentProfileController = StudentProfileController = __decorate([
    (0, common_1.Controller)('student/profile'),
    __metadata("design:paramtypes", [student_profile_service_1.StudentProfileService])
], StudentProfileController);
//# sourceMappingURL=student-profile.controller.js.map