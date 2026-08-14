"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcaModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const aca_content_controller_1 = require("./aca-content.controller");
const aca_content_service_1 = require("./aca-content.service");
const aca_taxonomy_controller_1 = require("./aca-taxonomy.controller");
const aca_taxonomy_service_1 = require("./aca-taxonomy.service");
const category_schema_1 = require("./schemas/category.schema");
const content_schema_1 = require("./schemas/content.schema");
const aca_class_schema_1 = require("./schemas/aca-class.schema");
const aca_student_schema_1 = require("./schemas/aca-student.schema");
const aca_practice_week_schema_1 = require("./schemas/aca-practice-week.schema");
const aca_practice_student_schema_1 = require("./schemas/aca-practice-student.schema");
const aca_11_class_schema_1 = require("./schemas/aca-11-class.schema");
const aca_weekly_doc_schema_1 = require("./schemas/aca-weekly-doc.schema");
const aca_teacher_assignment_schema_1 = require("./schemas/aca-teacher-assignment.schema");
const aca_free_slot_schema_1 = require("./schemas/aca-free-slot.schema");
const aca_teacher_profile_schema_1 = require("./schemas/aca-teacher-profile.schema");
const writing_submission_schema_1 = require("../writing-submission/schemas/writing-submission.schema");
const rlp_course_store_schema_1 = require("../rlp/schemas/rlp-course-store.schema");
const users_module_1 = require("../users/users.module");
const aca_management_service_1 = require("./aca-management.service");
const aca_management_controller_1 = require("./aca-management.controller");
const daily_note_schema_1 = require("./schemas/daily-note.schema");
const mock_test_request_schema_1 = require("./schemas/mock-test-request.schema");
const course_settings_schema_1 = require("./schemas/course-settings.schema");
let AcaModule = class AcaModule {
};
exports.AcaModule = AcaModule;
exports.AcaModule = AcaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_guards_module_1.AuthGuardsModule,
            users_module_1.UsersModule,
            mongoose_1.MongooseModule.forFeature([
                { name: content_schema_1.Content.name, schema: content_schema_1.ContentSchema },
                { name: category_schema_1.Category.name, schema: category_schema_1.CategorySchema },
                { name: aca_class_schema_1.AcaClass.name, schema: aca_class_schema_1.AcaClassSchema },
                { name: aca_student_schema_1.AcaStudent.name, schema: aca_student_schema_1.AcaStudentSchema },
                { name: aca_practice_week_schema_1.AcaPracticeWeek.name, schema: aca_practice_week_schema_1.AcaPracticeWeekSchema },
                { name: aca_practice_student_schema_1.AcaPracticeStudent.name, schema: aca_practice_student_schema_1.AcaPracticeStudentSchema },
                { name: aca_11_class_schema_1.Aca11Class.name, schema: aca_11_class_schema_1.Aca11ClassSchema },
                { name: aca_weekly_doc_schema_1.AcaWeeklyDoc.name, schema: aca_weekly_doc_schema_1.AcaWeeklyDocSchema },
                { name: aca_teacher_assignment_schema_1.AcaTeacherAssignment.name, schema: aca_teacher_assignment_schema_1.AcaTeacherAssignmentSchema },
                { name: aca_free_slot_schema_1.AcaFreeSlot.name, schema: aca_free_slot_schema_1.AcaFreeSlotSchema },
                { name: aca_teacher_profile_schema_1.AcaTeacherProfile.name, schema: aca_teacher_profile_schema_1.AcaTeacherProfileSchema },
                { name: writing_submission_schema_1.WritingSubmission.name, schema: writing_submission_schema_1.WritingSubmissionSchema },
                { name: rlp_course_store_schema_1.RlpCourseStore.name, schema: rlp_course_store_schema_1.RlpCourseStoreSchema },
                { name: daily_note_schema_1.DailyNote.name, schema: daily_note_schema_1.DailyNoteSchema },
                { name: mock_test_request_schema_1.MockTestRequest.name, schema: mock_test_request_schema_1.MockTestRequestSchema },
                { name: course_settings_schema_1.CourseSettings.name, schema: course_settings_schema_1.CourseSettingsSchema },
            ]),
        ],
        controllers: [
            aca_content_controller_1.AcaContentController,
            aca_taxonomy_controller_1.AcaTaxonomyController,
            aca_management_controller_1.AcaManagementController,
        ],
        providers: [
            aca_content_service_1.AcaContentService,
            aca_taxonomy_service_1.AcaTaxonomyService,
            aca_management_service_1.AcaManagementService,
        ],
    })
], AcaModule);
//# sourceMappingURL=aca.module.js.map