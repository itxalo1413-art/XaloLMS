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
exports.StudentPracticeClassController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const register_practice_slot_dto_1 = require("./dto/register-practice-slot.dto");
const practice_class_service_1 = require("./practice-class.service");
let StudentPracticeClassController = class StudentPracticeClassController {
    practiceClass;
    constructor(practiceClass) {
        this.practiceClass = practiceClass;
    }
    getSchedule() {
        return this.practiceClass.getSchedule();
    }
    listRegistrations(req) {
        return this.practiceClass.listRegistrations(req.user.sub);
    }
    async register(req, body) {
        const registration = await this.practiceClass.registerSlot(req.user.sub, body?.slotId ?? '');
        return { registration };
    }
    async unregister(req, slotId) {
        await this.practiceClass.unregisterSlot(req.user.sub, slotId);
        return { ok: true };
    }
};
exports.StudentPracticeClassController = StudentPracticeClassController;
__decorate([
    (0, common_1.Get)('schedule'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StudentPracticeClassController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Get)('registrations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentPracticeClassController.prototype, "listRegistrations", null);
__decorate([
    (0, common_1.Post)('registrations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_practice_slot_dto_1.RegisterPracticeSlotDto]),
    __metadata("design:returntype", Promise)
], StudentPracticeClassController.prototype, "register", null);
__decorate([
    (0, common_1.Delete)('registrations/:slotId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('slotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentPracticeClassController.prototype, "unregister", null);
exports.StudentPracticeClassController = StudentPracticeClassController = __decorate([
    (0, common_1.Controller)('student/practice-class'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('HS'),
    __metadata("design:paramtypes", [practice_class_service_1.PracticeClassService])
], StudentPracticeClassController);
//# sourceMappingURL=student-practice-class.controller.js.map