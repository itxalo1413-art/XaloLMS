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
exports.AcaFreeSlotSchema = exports.AcaFreeSlot = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AcaFreeSlot = class AcaFreeSlot {
    day;
    month;
    year;
    time;
    teacherName;
    status;
    type;
};
exports.AcaFreeSlot = AcaFreeSlot;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], AcaFreeSlot.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], AcaFreeSlot.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], AcaFreeSlot.prototype, "year", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AcaFreeSlot.prototype, "time", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], AcaFreeSlot.prototype, "teacherName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: 'available' }),
    __metadata("design:type", String)
], AcaFreeSlot.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: 'Nhận ca Test speaking/ chấm writing online' }),
    __metadata("design:type", String)
], AcaFreeSlot.prototype, "type", void 0);
exports.AcaFreeSlot = AcaFreeSlot = __decorate([
    (0, mongoose_1.Schema)({ collection: 'aca_free_slots', timestamps: true })
], AcaFreeSlot);
exports.AcaFreeSlotSchema = mongoose_1.SchemaFactory.createForClass(AcaFreeSlot);
//# sourceMappingURL=aca-free-slot.schema.js.map