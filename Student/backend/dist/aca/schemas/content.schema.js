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
exports.ContentSchema = exports.Content = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Content = class Content {
    title;
    description;
    categorySlug;
    tags;
    status;
};
exports.Content = Content;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Content.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '', index: true }),
    __metadata("design:type", String)
], Content.prototype, "categorySlug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Content.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['draft', 'pending', 'published', 'hidden'],
        default: 'draft',
        index: true,
    }),
    __metadata("design:type", String)
], Content.prototype, "status", void 0);
exports.Content = Content = __decorate([
    (0, mongoose_1.Schema)({ collection: 'contents', timestamps: true })
], Content);
exports.ContentSchema = mongoose_1.SchemaFactory.createForClass(Content);
//# sourceMappingURL=content.schema.js.map