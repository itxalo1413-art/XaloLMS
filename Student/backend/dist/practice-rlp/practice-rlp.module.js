"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeRlpModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const practice_rlp_store_schema_1 = require("./schemas/practice-rlp-store.schema");
const practice_rlp_service_1 = require("./practice-rlp.service");
const student_practice_rlp_controller_1 = require("./student-practice-rlp.controller");
const teacher_practice_rlp_controller_1 = require("./teacher-practice-rlp.controller");
let PracticeRlpModule = class PracticeRlpModule {
};
exports.PracticeRlpModule = PracticeRlpModule;
exports.PracticeRlpModule = PracticeRlpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: practice_rlp_store_schema_1.PracticeRlpStore.name, schema: practice_rlp_store_schema_1.PracticeRlpStoreSchema },
            ]),
            auth_guards_module_1.AuthGuardsModule,
        ],
        controllers: [student_practice_rlp_controller_1.StudentPracticeRlpController, teacher_practice_rlp_controller_1.TeacherPracticeRlpController],
        providers: [practice_rlp_service_1.PracticeRlpService],
        exports: [practice_rlp_service_1.PracticeRlpService],
    })
], PracticeRlpModule);
//# sourceMappingURL=practice-rlp.module.js.map