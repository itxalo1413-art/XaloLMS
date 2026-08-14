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
exports.Aca11ClassSchema = exports.Aca11Class = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Aca11Class = class Aca11Class {
    status;
    className;
    inputNeed;
    teacher;
    schedule;
    startDate;
    endDate;
    progress;
    output;
    otherNote;
    zoomLink;
    successorLink;
    materials;
    scores;
    finalScores;
    cycles;
};
exports.Aca11Class = Aca11Class;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Aca11Class.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Aca11Class.prototype, "className", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "inputNeed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "teacher", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "schedule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "progress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "output", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "otherNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "zoomLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "successorLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Aca11Class.prototype, "materials", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) }),
    __metadata("design:type", Object)
], Aca11Class.prototype, "scores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: () => ({ l: '-', r: '-', w: '-', s: '-', o: '-' }) }),
    __metadata("design:type", Object)
], Aca11Class.prototype, "finalScores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, default: () => [] }),
    __metadata("design:type", Array)
], Aca11Class.prototype, "cycles", void 0);
exports.Aca11Class = Aca11Class = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_11_classes', timestamps: true })
], Aca11Class);
exports.Aca11ClassSchema = mongoose_1.SchemaFactory.createForClass(Aca11Class);
//# sourceMappingURL=aca-11-class.schema.js.map