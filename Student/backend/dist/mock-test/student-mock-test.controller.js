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
exports.StudentMockTestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const create_mock_test_dto_1 = require("./dto/create-mock-test.dto");
const mock_test_service_1 = require("./mock-test.service");
let StudentMockTestController = class StudentMockTestController {
    mockTests;
    constructor(mockTests) {
        this.mockTests = mockTests;
    }
    listMine(req) {
        return this.mockTests.listForStudent(req.user.sub);
    }
    async create(req, body) {
        const request = await this.mockTests.createForStudent(req.user.sub, body ?? {});
        return { request };
    }
    async cancel(req, id) {
        await this.mockTests.cancelPending(req.user.sub, id);
        return { ok: true };
    }
};
exports.StudentMockTestController = StudentMockTestController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentMockTestController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mock_test_dto_1.CreateMockTestDto]),
    __metadata("design:returntype", Promise)
], StudentMockTestController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentMockTestController.prototype, "cancel", null);
exports.StudentMockTestController = StudentMockTestController = __decorate([
    (0, common_1.Controller)('student/mock-tests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HS'),
    __metadata("design:paramtypes", [mock_test_service_1.MockTestService])
], StudentMockTestController);
//# sourceMappingURL=student-mock-test.controller.js.map