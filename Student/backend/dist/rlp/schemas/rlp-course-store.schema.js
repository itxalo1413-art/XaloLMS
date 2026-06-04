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
exports.RlpCourseStoreSchema = exports.RlpCourseStore = exports.RLP_COURSE_KEY = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.RLP_COURSE_KEY = 'main';
let RlpCourseStore = class RlpCourseStore {
    key;
    sessions;
};
exports.RlpCourseStore = RlpCourseStore;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, default: exports.RLP_COURSE_KEY }),
    __metadata("design:type", String)
], RlpCourseStore.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], RlpCourseStore.prototype, "sessions", void 0);
exports.RlpCourseStore = RlpCourseStore = __decorate([
    (0, mongoose_1.Schema)({ collection: 'rlp_course_stores', timestamps: true })
], RlpCourseStore);
exports.RlpCourseStoreSchema = mongoose_1.SchemaFactory.createForClass(RlpCourseStore);
//# sourceMappingURL=rlp-course-store.schema.js.map