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
exports.StudentWritingSubmissionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const create_writing_submission_dto_1 = require("./dto/create-writing-submission.dto");
const writing_submission_service_1 = require("./writing-submission.service");
let StudentWritingSubmissionController = class StudentWritingSubmissionController {
    writing;
    constructor(writing) {
        this.writing = writing;
    }
    listMine(req) {
        return this.writing.listForStudent(req.user.sub);
    }
    async create(req, body) {
        const submission = await this.writing.createForStudent(req.user.sub, req.user.name, body ?? {});
        return { submission };
    }
};
exports.StudentWritingSubmissionController = StudentWritingSubmissionController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentWritingSubmissionController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_writing_submission_dto_1.CreateWritingSubmissionDto]),
    __metadata("design:returntype", Promise)
], StudentWritingSubmissionController.prototype, "create", null);
exports.StudentWritingSubmissionController = StudentWritingSubmissionController = __decorate([
    (0, common_1.Controller)('student/writing-submissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HS'),
    __metadata("design:paramtypes", [writing_submission_service_1.WritingSubmissionService])
], StudentWritingSubmissionController);
//# sourceMappingURL=student-writing-submission.controller.js.map