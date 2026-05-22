"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfileModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const users_module_1 = require("../users/users.module");
const student_profile_store_schema_1 = require("./schemas/student-profile-store.schema");
const student_profile_controller_1 = require("./student-profile.controller");
const student_profile_service_1 = require("./student-profile.service");
let StudentProfileModule = class StudentProfileModule {
};
exports.StudentProfileModule = StudentProfileModule;
exports.StudentProfileModule = StudentProfileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: student_profile_store_schema_1.StudentProfileStore.name, schema: student_profile_store_schema_1.StudentProfileStoreSchema },
            ]),
            auth_guards_module_1.AuthGuardsModule,
            users_module_1.UsersModule,
        ],
        controllers: [student_profile_controller_1.StudentProfileController],
        providers: [student_profile_service_1.StudentProfileService],
        exports: [student_profile_service_1.StudentProfileService],
    })
], StudentProfileModule);
//# sourceMappingURL=student-profile.module.js.map