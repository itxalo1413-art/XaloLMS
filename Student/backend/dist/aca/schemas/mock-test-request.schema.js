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
exports.MockTestRequestSchema = exports.MockTestRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let MockTestRequest = class MockTestRequest {
    studentId;
    studentName;
    skill;
    day;
    month;
    year;
    examTime;
    status;
    linkMeet;
    linkTab;
    note;
};
exports.MockTestRequest = MockTestRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "studentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "skill", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "year", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "examTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Chờ phân công' }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "linkMeet", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "linkTab", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "note", void 0);
exports.MockTestRequest = MockTestRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MockTestRequest);
exports.MockTestRequestSchema = mongoose_1.SchemaFactory.createForClass(MockTestRequest);
//# sourceMappingURL=mock-test-request.schema.js.map