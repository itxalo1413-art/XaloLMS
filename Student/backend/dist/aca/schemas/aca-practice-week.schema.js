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
exports.AcaPracticeWeekSchema = exports.AcaPracticeWeek = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AcaPracticeWeek = class AcaPracticeWeek {
    weekRange;
    linkMeet;
    linkTab;
    announcement;
    templateMessage;
    zoomId;
    zoomPassword;
    scheduleTueInfo;
    scheduleThuInfo;
    scheduleSatInfo;
    scheduleTueTitle;
    scheduleThuTitle;
    scheduleSatTitle;
    scheduleTueTime;
    scheduleThuTime;
    scheduleSatTime;
    linkFolder;
};
exports.AcaPracticeWeek = AcaPracticeWeek;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "weekRange", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "linkMeet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "linkTab", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "announcement", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "templateMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '842 1963 4521' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "zoomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: 'XaloLrw26' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "zoomPassword", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleTueInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleThuInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleSatInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleTueTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleThuTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleSatTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleTueTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleThuTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "scheduleSatTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaPracticeWeek.prototype, "linkFolder", void 0);
exports.AcaPracticeWeek = AcaPracticeWeek = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_practice_weeks', timestamps: true, strict: false })
], AcaPracticeWeek);
exports.AcaPracticeWeekSchema = mongoose_1.SchemaFactory.createForClass(AcaPracticeWeek);
//# sourceMappingURL=aca-practice-week.schema.js.map