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
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const avatar_image_util_1 = require("./avatar-image.util");
const update_student_profile_dto_1 = require("./dto/update-student-profile.dto");
const student_profile_service_1 = require("./student-profile.service");
let StudentProfileController = class StudentProfileController {
    studentProfileService;
    constructor(studentProfileService) {
        this.studentProfileService = studentProfileService;
    }
    getProfile(req) {
        return this.studentProfileService.getProfile(req.user.sub);
    }
    getDiagnosis(req) {
        return this.studentProfileService.getStudentDiagnosis(req.user.email);
    }
    getClassInfo(req) {
        return this.studentProfileService.getClassInfoForStudent(req.user.email);
    }
    updateProfile(req, payload) {
        return this.studentProfileService.updateProfile(req.user.sub, payload);
    }
    uploadAvatar(req, file) {
        if (!file) {
            throw new common_1.BadRequestException('Missing avatar file.');
        }
        if (!(0, avatar_image_util_1.isAllowedAvatarImageMime)(file.mimetype)) {
            throw new common_1.BadRequestException('Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP, SVG.');
        }
        return this.studentProfileService.updateAvatar(req.user.sub, file);
    }
};
exports.StudentProfileController = StudentProfileController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('diagnosis'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "getDiagnosis", null);
__decorate([
    (0, common_1.Get)('class-info'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "getClassInfo", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_student_profile_dto_1.UpdateStudentProfileDto]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudentProfileController.prototype, "uploadAvatar", null);
exports.StudentProfileController = StudentProfileController = __decorate([
    (0, common_1.Controller)('student/profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HS'),
    __metadata("design:paramtypes", [student_profile_service_1.StudentProfileService])
], StudentProfileController);
//# sourceMappingURL=student-profile.controller.js.map