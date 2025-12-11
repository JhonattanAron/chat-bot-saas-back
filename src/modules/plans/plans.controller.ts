import { Controller, Get, Post, Body } from "@nestjs/common";
import { PlansService } from "./plans.service";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get("available")
  getAvailablePlans() {
    return {
      success: true,
      data: this.plansService.getAllPlans(),
    };
  }

  @Post("assign")
  async assignPlan(@Body() body: { userId: string; planName: string }) {
    try {
      const reference = await this.plansService.assignPlanToUser(
        body.userId,
        body.planName
      );
      return {
        success: true,
        message: "Plan asignado correctamente",
        data: reference,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error al asignar plan",
        error: error.message,
      };
    }
  }

  @Post("user")
  async getUserPlan(@Body() body: { userId: string }) {
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
    } catch (error) {
      return {
        success: false,
        message: "Error al obtener plan del usuario",
        error: error.message,
      };
    }
  }

  @Post("limits")
  async getUserLimits(@Body() body: { userId: string }) {
    try {
      const limits = await this.plansService.checkUserLimits(body.userId);
      return {
        success: true,
        data: limits,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error al obtener límites del usuario",
        error: error.message,
      };
    }
  }
}
