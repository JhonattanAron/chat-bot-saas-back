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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const plans_service_1 = require("./plans.service");
let PlansController = class PlansController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    getAvailablePlans() {
        return {
            success: true,
            data: this.plansService.getAllPlans(),
        };
    }
    async assignPlan(body) {
        try {
            const reference = await this.plansService.assignPlanToUser(body.userId, body.planName);
            return {
                success: true,
                message: "Plan asignado correctamente",
                data: reference,
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Error al asignar plan",
                error: error.message,
            };
        }
    }
    async getUserPlan(body) {
        try {
            const userPlan = await this.plansService.getUserPlan(body.userId);
            if (!userPlan) {
                return {
                    success: false,
                    message: "Usuario no tiene plan activo",
                };
            }
            return {
                success: true,
                data: {
                    plan: userPlan.plan,
                    expires_at: userPlan.reference.expires_at,
                    created_at: userPlan.reference.created_at,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Error al obtener plan del usuario",
                error: error.message,
            };
        }
    }
    async getUserLimits(body) {
        try {
            const limits = await this.plansService.checkUserLimits(body.userId);
            return {
                success: true,
                data: limits,
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Error al obtener límites del usuario",
                error: error.message,
            };
        }
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)("available"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "getAvailablePlans", null);
__decorate([
    (0, common_1.Post)("assign"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "assignPlan", null);
__decorate([
    (0, common_1.Post)("user"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getUserPlan", null);
__decorate([
    (0, common_1.Post)("limits"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getUserLimits", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)("plans"),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map