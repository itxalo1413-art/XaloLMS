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
exports.AcaPracticeClassController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const update_practice_schedule_dto_1 = require("./dto/update-practice-schedule.dto");
const practice_class_service_1 = require("./practice-class.service");
let AcaPracticeClassController = class AcaPracticeClassController {
    practiceClass;
    constructor(practiceClass) {
        this.practiceClass = practiceClass;
    }
    getSchedule() {
        return this.practiceClass.getSchedule();
    }
    updateSchedule(body) {
        return this.practiceClass.updateSchedule(body ?? {});
    }
    listRegistrations() {
        return this.practiceClass.listAllRegistrationsForAca();
    }
    updateRegistrationDetails(id, body) {
        return this.practiceClass.updateRegistrationDetails(id, body ?? {});
    }
};
exports.AcaPracticeClassController = AcaPracticeClassController;
__decorate([
    (0, common_1.Get)('schedule'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AcaPracticeClassController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Put)('schedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_practice_schedule_dto_1.UpdatePracticeScheduleDto]),
    __metadata("design:returntype", void 0)
], AcaPracticeClassController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Get)('registrations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AcaPracticeClassController.prototype, "listRegistrations", null);
__decorate([
    (0, common_1.Put)('registration/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AcaPracticeClassController.prototype, "updateRegistrationDetails", null);
exports.AcaPracticeClassController = AcaPracticeClassController = __decorate([
    (0, common_1.Controller)('aca/practice-class'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ACA'),
    __metadata("design:paramtypes", [practice_class_service_1.PracticeClassService])
], AcaPracticeClassController);
//# sourceMappingURL=aca-practice-class.controller.js.map