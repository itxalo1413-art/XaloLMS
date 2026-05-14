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
let AcaModule = class AcaModule {
};
exports.AcaModule = AcaModule;
exports.AcaModule = AcaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_guards_module_1.AuthGuardsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: content_schema_1.Content.name, schema: content_schema_1.ContentSchema },
                { name: category_schema_1.Category.name, schema: category_schema_1.CategorySchema },
            ]),
        ],
        controllers: [aca_content_controller_1.AcaContentController, aca_taxonomy_controller_1.AcaTaxonomyController],
        providers: [aca_content_service_1.AcaContentService, aca_taxonomy_service_1.AcaTaxonomyService],
    })
], AcaModule);
//# sourceMappingURL=aca.module.js.map