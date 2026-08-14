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
exports.DailyNoteSchema = exports.DailyNote = exports.QuoteItemSchemaClass = void 0;
const mongoose_1 = require("@nestjs/mongoose");
class QuoteItemSchemaClass {
    id;
    word;
    meaning;
    author;
    active;
    createdAt;
}
exports.QuoteItemSchemaClass = QuoteItemSchemaClass;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], QuoteItemSchemaClass.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], QuoteItemSchemaClass.prototype, "word", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], QuoteItemSchemaClass.prototype, "meaning", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuoteItemSchemaClass.prototype, "author", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], QuoteItemSchemaClass.prototype, "active", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], QuoteItemSchemaClass.prototype, "createdAt", void 0);
let DailyNote = class DailyNote {
    mode;
    pinnedWord;
    pinnedMeaning;
    quotes;
};
exports.DailyNote = DailyNote;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'random' }),
    __metadata("design:type", String)
], DailyNote.prototype, "mode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Clouds.' }),
    __metadata("design:type", String)
], DailyNote.prototype, "pinnedWord", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "there's divinity in the clouds." }),
    __metadata("design:type", String)
], DailyNote.prototype, "pinnedMeaning", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [QuoteItemSchemaClass], default: [] }),
    __metadata("design:type", Array)
], DailyNote.prototype, "quotes", void 0);
exports.DailyNote = DailyNote = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], DailyNote);
exports.DailyNoteSchema = mongoose_1.SchemaFactory.createForClass(DailyNote);
//# sourceMappingURL=daily-note.schema.js.map