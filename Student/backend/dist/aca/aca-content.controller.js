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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcaContentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const aca_content_service_1 = require("./aca-content.service");
const update_content_dto_1 = require("./dto/update-content.dto");
const update_content_status_dto_1 = require("./dto/update-content-status.dto");
let AcaContentController = class AcaContentController {
    content;
    constructor(content) {
        this.content = content;
    }
    async list(status, category, q, pageRaw, limitRaw) {
        const page = pageRaw ? Number(pageRaw) : 1;
        const limit = limitRaw ? Number(limitRaw) : 20;
        return this.content.list({
            status,
            category,
            q,
            page: Number.isFinite(page) ? page : 1,
            limit: Number.isFinite(limit) ? limit : 20,
        });
    }
    async detail(id) {
        const item = await this.content.findById(id);
        return { item };
    }
    async updateStatus(id, body) {
        const item = await this.content.updateStatus(id, body?.status ?? '');
        return { item };
    }
    async update(id, body) {
        const item = await this.content.update(id, body ?? {});
        return { item };
    }
};
exports.AcaContentController = AcaContentController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AcaContentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AcaContentController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_content_status_dto_1.UpdateContentStatusDto]),
    __metadata("design:returntype", Promise)
], AcaContentController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_content_dto_1.UpdateContentDto]),
    __metadata("design:returntype", Promise)
], AcaContentController.prototype, "update", null);
exports.AcaContentController = AcaContentController = __decorate([
    (0, common_1.Controller)('aca/content'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ACA'),
    __metadata("design:paramtypes", [aca_content_service_1.AcaContentService])
], AcaContentController);
//# sourceMappingURL=aca-content.controller.js.map