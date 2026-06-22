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
exports.AcaManagementController = void 0;
const common_1 = require("@nestjs/common");
const aca_management_service_1 = require("./aca-management.service");
let AcaManagementController = class AcaManagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getAllClasses() {
        return this.service.findAllClasses();
    }
    async createClass(data) {
        return this.service.createClass(data);
    }
    async updateClass(id, data) {
        return this.service.updateClass(id, data);
    }
    async deleteClass(id) {
        return this.service.deleteClass(id);
    }
    async getAllStudents() {
        return this.service.findAllStudents();
    }
    async createStudent(data) {
        return this.service.createStudent(data);
    }
    async updateStudent(id, data) {
        return this.service.updateStudent(id, data);
    }
    async deleteStudent(id) {
        return this.service.deleteStudent(id);
    }
    async getAllWeeks() {
        return this.service.findAllWeeks();
    }
    async createWeek(data) {
        return this.service.createWeek(data);
    }
    async updateWeek(id, data) {
        return this.service.updateWeek(id, data);
    }
    async deleteWeek(id) {
        return this.service.deleteWeek(id);
    }
    async getAllPracticeStudents() {
        return this.service.findAllPracticeStudents();
    }
    async createPracticeStudent(data) {
        return this.service.createPracticeStudent(data);
    }
    async updatePracticeStudent(id, data) {
        return this.service.updatePracticeStudent(id, data);
    }
    async deletePracticeStudent(id) {
        return this.service.deletePracticeStudent(id);
    }
    async getAll11Classes() {
        return this.service.findAll11Classes();
    }
    async create11Class(data) {
        return this.service.create11Class(data);
    }
    async update11Class(id, data) {
        return this.service.update11Class(id, data);
    }
    async delete11Class(id) {
        return this.service.delete11Class(id);
    }
    async getAllWeeklyDocs() {
        return this.service.findAllWeeklyDocs();
    }
    async createWeeklyDoc(data) {
        return this.service.createWeeklyDoc(data);
    }
    async updateWeeklyDoc(id, data) {
        return this.service.updateWeeklyDoc(id, data);
    }
    async deleteWeeklyDoc(id) {
        return this.service.deleteWeeklyDoc(id);
    }
    async getAllTeacherAssignments() {
        return this.service.findAllTeacherAssignments();
    }
    async createTeacherAssignment(data) {
        return this.service.createTeacherAssignment(data);
    }
    async updateTeacherAssignment(id, data) {
        return this.service.updateTeacherAssignment(id, data);
    }
    async deleteTeacherAssignment(id) {
        return this.service.deleteTeacherAssignment(id);
    }
    async getAllFreeSlots() {
        return this.service.findAllFreeSlots();
    }
    async createFreeSlot(data) {
        return this.service.createFreeSlot(data);
    }
    async updateFreeSlot(id, data) {
        return this.service.updateFreeSlot(id, data);
    }
    async deleteFreeSlot(id) {
        return this.service.deleteFreeSlot(id);
    }
};
exports.AcaManagementController = AcaManagementController;
__decorate([
    (0, common_1.Get)('classes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllClasses", null);
__decorate([
    (0, common_1.Post)('classes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createClass", null);
__decorate([
    (0, common_1.Put)('classes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateClass", null);
__decorate([
    (0, common_1.Delete)('classes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteClass", null);
__decorate([
    (0, common_1.Get)('students'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllStudents", null);
__decorate([
    (0, common_1.Post)('students'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Put)('students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)('students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Get)('practice-weeks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllWeeks", null);
__decorate([
    (0, common_1.Post)('practice-weeks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createWeek", null);
__decorate([
    (0, common_1.Put)('practice-weeks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateWeek", null);
__decorate([
    (0, common_1.Delete)('practice-weeks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteWeek", null);
__decorate([
    (0, common_1.Get)('practice-students'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllPracticeStudents", null);
__decorate([
    (0, common_1.Post)('practice-students'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createPracticeStudent", null);
__decorate([
    (0, common_1.Put)('practice-students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updatePracticeStudent", null);
__decorate([
    (0, common_1.Delete)('practice-students/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deletePracticeStudent", null);
__decorate([
    (0, common_1.Get)('11-classes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAll11Classes", null);
__decorate([
    (0, common_1.Post)('11-classes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "create11Class", null);
__decorate([
    (0, common_1.Put)('11-classes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "update11Class", null);
__decorate([
    (0, common_1.Delete)('11-classes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "delete11Class", null);
__decorate([
    (0, common_1.Get)('weekly-docs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllWeeklyDocs", null);
__decorate([
    (0, common_1.Post)('weekly-docs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createWeeklyDoc", null);
__decorate([
    (0, common_1.Put)('weekly-docs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateWeeklyDoc", null);
__decorate([
    (0, common_1.Delete)('weekly-docs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteWeeklyDoc", null);
__decorate([
    (0, common_1.Get)('teacher-assignments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllTeacherAssignments", null);
__decorate([
    (0, common_1.Post)('teacher-assignments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createTeacherAssignment", null);
__decorate([
    (0, common_1.Put)('teacher-assignments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateTeacherAssignment", null);
__decorate([
    (0, common_1.Delete)('teacher-assignments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteTeacherAssignment", null);
__decorate([
    (0, common_1.Get)('free-slots'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "getAllFreeSlots", null);
__decorate([
    (0, common_1.Post)('free-slots'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "createFreeSlot", null);
__decorate([
    (0, common_1.Put)('free-slots/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "updateFreeSlot", null);
__decorate([
    (0, common_1.Delete)('free-slots/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaManagementController.prototype, "deleteFreeSlot", null);
exports.AcaManagementController = AcaManagementController = __decorate([
    (0, common_1.Controller)('aca'),
    __metadata("design:paramtypes", [aca_management_service_1.AcaManagementService])
], AcaManagementController);
//# sourceMappingURL=aca-management.controller.js.map