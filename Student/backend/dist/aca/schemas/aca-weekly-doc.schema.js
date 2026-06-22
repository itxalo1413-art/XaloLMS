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
exports.AcaWeeklyDocSchema = exports.AcaWeeklyDoc = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AcaWeeklyDoc = class AcaWeeklyDoc {
    student;
    className;
    week;
    link;
    status;
};
exports.AcaWeeklyDoc = AcaWeeklyDoc;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaWeeklyDoc.prototype, "student", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaWeeklyDoc.prototype, "className", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaWeeklyDoc.prototype, "week", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaWeeklyDoc.prototype, "link", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, default: 'Chưa nộp' }),
    __metadata("design:type", String)
], AcaWeeklyDoc.prototype, "status", void 0);
exports.AcaWeeklyDoc = AcaWeeklyDoc = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_weekly_docs', timestamps: true })
], AcaWeeklyDoc);
exports.AcaWeeklyDocSchema = mongoose_1.SchemaFactory.createForClass(AcaWeeklyDoc);
//# sourceMappingURL=aca-weekly-doc.schema.js.map