import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import { GoogleMapsConfigService } from "../services/google-maps-config.service";

@Controller("google-maps")
export class GoogleMapsConfigController {
  constructor(private configService: GoogleMapsConfigService) {}

  /**
   * GET /api/backend/google-maps/categories
   * Obtiene todas las categorías disponibles (default)
   */
  @Get("categories")
  async getCategories() {
    try {
      const defaultCategories = [
        { _id: "dental_clinic", value: "dental_clinic", name: "Dental Clinic" },
        { _id: "restaurant", value: "restaurant", name: "Restaurant" },
        { _id: "pharmacy", value: "pharmacy", name: "Pharmacy" },
        { _id: "health_center", value: "health_center", name: "Health Center" },
        {
          _id: "beauty_salon",
          value: "beauty_salon",
          name: "Beauty Salon",
        },
        { _id: "veterinary", value: "veterinary", name: "Veterinary Clinic" },
        { _id: "gym", value: "gym", name: "Gym / Fitness Center" },
        { _id: "hotel", value: "hotel", name: "Hotel / Accommodation" },
        { _id: "bank", value: "bank", name: "Bank / Financial Institution" },
        {
          _id: "school",
          value: "school",
          name: "School / Educational",
        },
        {
          _id: "supermarket",
          value: "supermarket",
          name: "Supermarket / Grocery",
        },
        { _id: "cafe", value: "cafe", name: "Cafe / Coffee Shop" },
        {
          _id: "automotive",
          value: "automotive",
          name: "Automotive / Car Service",
        },
        {
          _id: "real_estate",
          value: "real_estate",
          name: "Real Estate Agency",
        },
        {
          _id: "logistics",
          value: "logistics",
          name: "Logistics / Shipping",
        },
      ];

      return {
        success: true,
        categories: defaultCategories,
      };
    } catch (error) {
      console.error("[v0] Error getting categories:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * GET /api/backend/google-maps/categories/:userId
   * Obtiene categorías personalizadas de un usuario
   */
  @Get("categories/:userId")
  async getUserCategories(@Param("userId") userId: string) {
    try {
      const categories = await this.configService.getCategories(userId);
      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error("[v0] Error getting user categories:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * GET /api/backend/google-maps/keywords/:userId
   * Obtiene todos los keywords del usuario
   */
  @Get("keywords/:userId")
  async getUserKeywords(@Param("userId") userId: string) {
    try {
      const keywords = await this.configService.getUserKeywords(userId);
      return {
        success: true,
        keywords,
      };
    } catch (error) {
      console.error("[v0] Error getting user keywords:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * GET /api/backend/google-maps/category-keywords/:userId/:categoryValue
   * Obtiene keywords de una categoría específica
   */
  @Get("category-keywords/:userId/:categoryValue")
  async getCategoryKeywords(
    @Param("userId") userId: string,
    @Param("categoryValue") categoryValue: string,
  ) {
    try {
      const keywords = await this.configService.getCategoryKeywords(
        userId,
        categoryValue,
      );
      return {
        success: true,
        keywords,
      };
    } catch (error) {
      console.error("[v0] Error getting category keywords:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * POST /api/backend/google-maps/categories
   * Agrega una nueva categoría personalizada
   */
  @Post("categories")
  async addCategory(
    @Body()
    body: {
      userId: string;
      category: { value: string; name: string; keywords: string[] };
    },
  ) {
    try {
      const config = await this.configService.addCategory(
        body.userId,
        body.category,
      );
      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error("[v0] Error adding category:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * DELETE /api/backend/google-maps/categories/:userId/:categoryValue
   * Elimina una categoría personalizada
   */
  @Delete("categories/:userId/:categoryValue")
  async removeCategory(
    @Param("userId") userId: string,
    @Param("categoryValue") categoryValue: string,
  ) {
    try {
      const config = await this.configService.removeCategory(
        userId,
        categoryValue,
      );
      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error("[v0] Error removing category:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
