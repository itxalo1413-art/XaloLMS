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
exports.TeacherMockTestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const record_mock_test_result_dto_1 = require("./dto/record-mock-test-result.dto");
const mock_test_service_1 = require("./mock-test.service");
let TeacherMockTestController = class TeacherMockTestController {
    mockTests;
    constructor(mockTests) {
        this.mockTests = mockTests;
    }
    listSpeaking(req, teacherName) {
        const name = teacherName?.trim() || req.user.name;
        return this.mockTests.listForTeacher(name);
    }
    async recordResult(req, id, body) {
        const name = body.teacherName?.trim() || req.user.name;
        const request = await this.mockTests.recordResult(id, name, body ?? {});
        return { request };
    }
};
exports.TeacherMockTestController = TeacherMockTestController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('teacherName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherMockTestController.prototype, "listSpeaking", null);
__decorate([
    (0, common_1.Patch)(':id/result'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_mock_test_result_dto_1.RecordMockTestResultDto]),
    __metadata("design:returntype", Promise)
], TeacherMockTestController.prototype, "recordResult", null);
exports.TeacherMockTestController = TeacherMockTestController = __decorate([
    (0, common_1.Controller)('teacher/mock-tests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('GV', 'ACA'),
    __metadata("design:paramtypes", [mock_test_service_1.MockTestService])
], TeacherMockTestController);
//# sourceMappingURL=teacher-mock-test.controller.js.map