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
exports.FaqsController = void 0;
const common_1 = require("@nestjs/common");
const faqs_service_1 = require("./faqs.service");
let FaqsController = class FaqsController {
    constructor(faqservice) {
        this.faqservice = faqservice;
    }
    async searchFaqs(query, user_id, assistant_id) {
        return this.faqservice.search(query, user_id, assistant_id);
    }
    async createFaqs(body) {
        return this.faqservice.createFaqs(body);
    }
    async getFaqs(user_id, assistant_id) {
        return this.faqservice.getFaqs(user_id, assistant_id);
    }
    async updateFaq(body) {
        return this.faqservice.updateFaq(body.user_id, body.assistant_id, body.faqId, body.update);
    }
    async deleteFaq(user_id, assistant_id, faqId) {
        return this.faqservice.deleteFaq(user_id, assistant_id, faqId);
    }
};
exports.FaqsController = FaqsController;
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Query)("query")),
    __param(1, (0, common_1.Query)("user_id")),
    __param(2, (0, common_1.Query)("assistant_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FaqsController.prototype, "searchFaqs", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FaqsController.prototype, "createFaqs", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("user_id")),
    __param(1, (0, common_1.Query)("assistant_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FaqsController.prototype, "getFaqs", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FaqsController.prototype, "updateFaq", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Query)("user_id")),
    __param(1, (0, common_1.Query)("assistant_id")),
    __param(2, (0, common_1.Query)("faqId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FaqsController.prototype, "deleteFaq", null);
exports.FaqsController = FaqsController = __decorate([
    (0, common_1.Controller)("faqs"),
    __metadata("design:paramtypes", [faqs_service_1.FaqsService])
], FaqsController);
//# sourceMappingURL=faqs.controller.js.map