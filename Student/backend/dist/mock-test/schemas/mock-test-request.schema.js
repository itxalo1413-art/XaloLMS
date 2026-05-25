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
const mongoose_2 = require("mongoose");
const mock_test_constants_1 = require("../mock-test.constants");
let MockTestRequest = class MockTestRequest {
    studentId;
    studentName;
    skill;
    day;
    month;
    year;
    status;
    examTime;
    examTeacher;
    score;
    examLink;
};
exports.MockTestRequest = MockTestRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
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
    (0, mongoose_1.Prop)({ required: true, min: 1, max: 31 }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 11 }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], MockTestRequest.prototype, "year", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: mock_test_constants_1.MOCK_TEST_STATUSES, default: 'pending' }),
    __metadata("design:type", String)
], MockTestRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "examTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "examTeacher", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MockTestRequest.prototype, "examLink", void 0);
exports.MockTestRequest = MockTestRequest = __decorate([
    (0, mongoose_1.Schema)({ collection: 'mock_test_requests', timestamps: true })
], MockTestRequest);
exports.MockTestRequestSchema = mongoose_1.SchemaFactory.createForClass(MockTestRequest);
exports.MockTestRequestSchema.index({ studentId: 1, skill: 1, day: 1, month: 1, year: 1, status: 1 }, { name: 'student_slot_status' });
//# sourceMappingURL=mock-test-request.schema.js.map