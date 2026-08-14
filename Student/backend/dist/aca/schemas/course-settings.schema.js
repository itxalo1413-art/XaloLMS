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
exports.CourseSettingsSchema = exports.CourseSettings = exports.CourseImportantLinkSchemaClass = exports.CoursePhaseSchemaClass = void 0;
const mongoose_1 = require("@nestjs/mongoose");
class CoursePhaseSchemaClass {
    name;
    date;
}
exports.CoursePhaseSchemaClass = CoursePhaseSchemaClass;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CoursePhaseSchemaClass.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CoursePhaseSchemaClass.prototype, "date", void 0);
class CourseImportantLinkSchemaClass {
    id;
    label;
    value;
    url;
}
exports.CourseImportantLinkSchemaClass = CourseImportantLinkSchemaClass;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CourseImportantLinkSchemaClass.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CourseImportantLinkSchemaClass.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CourseImportantLinkSchemaClass.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '' }),
    __metadata("design:type", String)
], CourseImportantLinkSchemaClass.prototype, "url", void 0);
let CourseSettings = class CourseSettings {
    course;
    room;
    instructor;
    zoomPassword;
    schedule;
    openDate;
    endDate;
    phases;
    links;
};
exports.CourseSettings = CourseSettings;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Momentum - 357 - C2' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "course", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Zoom Online' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "room", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Nghiêm Doãn Quỳnh Châu' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "instructor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'xalo2026' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "zoomPassword", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: ['T3: 19h45 - 21h45', 'T5: 19h45 - 21h45', 'T7: 19h45 - 21h45'] }),
    __metadata("design:type", Array)
], CourseSettings.prototype, "schedule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '21/04/2026' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "openDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '09/07/2026' }),
    __metadata("design:type", String)
], CourseSettings.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CoursePhaseSchemaClass], default: [] }),
    __metadata("design:type", Array)
], CourseSettings.prototype, "phases", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CourseImportantLinkSchemaClass], default: [] }),
    __metadata("design:type", Array)
], CourseSettings.prototype, "links", void 0);
exports.CourseSettings = CourseSettings = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CourseSettings);
exports.CourseSettingsSchema = mongoose_1.SchemaFactory.createForClass(CourseSettings);
//# sourceMappingURL=course-settings.schema.js.map