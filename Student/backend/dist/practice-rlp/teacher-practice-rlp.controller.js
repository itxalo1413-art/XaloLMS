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
exports.TeacherPracticeRlpController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const practice_rlp_dto_1 = require("./dto/practice-rlp.dto");
const practice_rlp_service_1 = require("./practice-rlp.service");
let TeacherPracticeRlpController = class TeacherPracticeRlpController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(studentId) {
        return this.svc.listSessions(studentId);
    }
    add(studentId, body) {
        return this.svc.addSession(studentId, body);
    }
    async update(no, studentId, body) {
        const session = await this.svc.updateSession(studentId, no, body ?? {});
        return { session };
    }
    remove(no, studentId) {
        return this.svc.deleteSession(studentId, no);
    }
};
exports.TeacherPracticeRlpController = TeacherPracticeRlpController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherPracticeRlpController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Query)('studentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, practice_rlp_dto_1.CreatePracticeRlpSessionDto]),
    __metadata("design:returntype", void 0)
], TeacherPracticeRlpController.prototype, "add", null);
__decorate([
    (0, common_1.Patch)(':no'),
    __param(0, (0, common_1.Param)('no', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, practice_rlp_dto_1.UpdatePracticeRlpSessionDto]),
    __metadata("design:returntype", Promise)
], TeacherPracticeRlpController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':no'),
    __param(0, (0, common_1.Param)('no', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], TeacherPracticeRlpController.prototype, "remove", null);
exports.TeacherPracticeRlpController = TeacherPracticeRlpController = __decorate([
    (0, common_1.Controller)('teacher/practice-rlp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('GV', 'ACA'),
    __metadata("design:paramtypes", [practice_rlp_service_1.PracticeRlpService])
], TeacherPracticeRlpController);
//# sourceMappingURL=teacher-practice-rlp.controller.js.map