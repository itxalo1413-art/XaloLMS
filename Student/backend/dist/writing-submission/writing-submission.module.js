"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritingSubmissionModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const users_module_1 = require("../users/users.module");
const writing_submission_schema_1 = require("./schemas/writing-submission.schema");
const student_writing_submission_controller_1 = require("./student-writing-submission.controller");
const teacher_writing_submission_controller_1 = require("./teacher-writing-submission.controller");
const writing_submission_service_1 = require("./writing-submission.service");
let WritingSubmissionModule = class WritingSubmissionModule {
};
exports.WritingSubmissionModule = WritingSubmissionModule;
exports.WritingSubmissionModule = WritingSubmissionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: writing_submission_schema_1.WritingSubmission.name, schema: writing_submission_schema_1.WritingSubmissionSchema },
            ]),
            auth_guards_module_1.AuthGuardsModule,
            users_module_1.UsersModule,
        ],
        controllers: [
            student_writing_submission_controller_1.StudentWritingSubmissionController,
            teacher_writing_submission_controller_1.TeacherWritingSubmissionController,
        ],
        providers: [writing_submission_service_1.WritingSubmissionService],
        exports: [writing_submission_service_1.WritingSubmissionService],
    })
], WritingSubmissionModule);
//# sourceMappingURL=writing-submission.module.js.map