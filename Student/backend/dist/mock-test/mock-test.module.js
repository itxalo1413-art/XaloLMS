"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTestModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_module_1 = require("../auth/auth-guards.module");
const users_module_1 = require("../users/users.module");
const aca_mock_test_controller_1 = require("./aca-mock-test.controller");
const mock_test_service_1 = require("./mock-test.service");
const mock_test_request_schema_1 = require("./schemas/mock-test-request.schema");
const student_mock_test_controller_1 = require("./student-mock-test.controller");
const teacher_mock_test_controller_1 = require("./teacher-mock-test.controller");
let MockTestModule = class MockTestModule {
};
exports.MockTestModule = MockTestModule;
exports.MockTestModule = MockTestModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: mock_test_request_schema_1.MockTestRequest.name, schema: mock_test_request_schema_1.MockTestRequestSchema },
            ]),
            auth_guards_module_1.AuthGuardsModule,
            users_module_1.UsersModule,
        ],
        controllers: [
            student_mock_test_controller_1.StudentMockTestController,
            aca_mock_test_controller_1.AcaMockTestController,
            teacher_mock_test_controller_1.TeacherMockTestController,
        ],
        providers: [mock_test_service_1.MockTestService],
        exports: [mock_test_service_1.MockTestService],
    })
], MockTestModule);
//# sourceMappingURL=mock-test.module.js.map