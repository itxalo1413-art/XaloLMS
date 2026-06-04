"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeClassModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const users_module_1 = require("../users/users.module");
const aca_practice_class_controller_1 = require("./aca-practice-class.controller");
const practice_class_service_1 = require("./practice-class.service");
const practice_class_registration_schema_1 = require("./schemas/practice-class-registration.schema");
const practice_class_schedule_schema_1 = require("./schemas/practice-class-schedule.schema");
const student_practice_class_controller_1 = require("./student-practice-class.controller");
let PracticeClassModule = class PracticeClassModule {
};
exports.PracticeClassModule = PracticeClassModule;
exports.PracticeClassModule = PracticeClassModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: practice_class_schedule_schema_1.PracticeClassSchedule.name, schema: practice_class_schedule_schema_1.PracticeClassScheduleSchema },
                {
                    name: practice_class_registration_schema_1.PracticeClassRegistration.name,
                    schema: practice_class_registration_schema_1.PracticeClassRegistrationSchema,
                },
            ]),
            auth_guards_module_1.AuthGuardsModule,
            users_module_1.UsersModule,
        ],
        controllers: [aca_practice_class_controller_1.AcaPracticeClassController, student_practice_class_controller_1.StudentPracticeClassController],
        providers: [practice_class_service_1.PracticeClassService],
        exports: [practice_class_service_1.PracticeClassService],
    })
], PracticeClassModule);
//# sourceMappingURL=practice-class.module.js.map