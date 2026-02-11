import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ClientCategoryConfig,
  ClientCategoryConfigDocument,
} from "../schemas/client-category-config.schema";

const DEFAULT_CATEGORIES = [
  {
    value: "dental_clinic",
    name: "Dental Clinic",
    keywords: ["dentist", "dental", "odontology"],
  },
  {
    value: "restaurant",
    name: "Restaurant",
    keywords: ["restaurant", "food", "dining", "cuisine"],
  },
  {
    value: "pharmacy",
    name: "Pharmacy",
    keywords: ["pharmacy", "drugstore", "chemist", "medicines"],
  },
  {
    value: "health_center",
    name: "Health Center",
    keywords: ["health center", "clinic", "medical center", "healthcare"],
  },
  {
    value: "beauty_salon",
    name: "Beauty Salon",
    keywords: ["beauty salon", "hairdresser", "spa", "salon"],
  },
  {
    value: "veterinary",
    name: "Veterinary Clinic",
    keywords: ["veterinary", "vet", "animal clinic", "pet care"],
  },
  {
    value: "gym",
    name: "Gym / Fitness Center",
    keywords: ["gym", "fitness center", "sport center", "training"],
  },
  {
    value: "hotel",
    name: "Hotel / Accommodation",
    keywords: ["hotel", "hostel", "resort", "accommodation"],
  },
  {
    value: "bank",
    name: "Bank / Financial Institution",
    keywords: ["bank", "atm", "financial", "credit union"],
  },
  {
    value: "school",
    name: "School / Educational",
    keywords: ["school", "academy", "college", "university", "education"],
  },
  {
    value: "supermarket",
    name: "Supermarket / Grocery",
    keywords: ["supermarket", "grocery", "market", "food store"],
  },
  {
    value: "cafe",
    name: "Cafe / Coffee Shop",
    keywords: ["cafe", "coffee shop", "bakery", "dessert"],
  },
  {
    value: "automotive",
    name: "Automotive / Car Service",
    keywords: ["car repair", "automotive", "garage", "mechanic"],
  },
  {
    value: "real_estate",
    name: "Real Estate Agency",
    keywords: ["real estate", "property", "realtor", "real estate agent"],
  },
  {
    value: "logistics",
    name: "Logistics / Shipping",
    keywords: ["logistics", "shipping", "delivery", "cargo"],
  },
];

@Injectable()
export class GoogleMapsConfigService {
  constructor(
    @InjectModel(ClientCategoryConfig.name)
    private configModel: Model<ClientCategoryConfigDocument>,
  ) {}

  /**
   * Obtiene las categorías disponibles para un usuario
   */
  async getCategories(userId: string) {
    let config = await this.configModel.findOne({ user_id: userId });

    // Si no existe configuración, crear una con defaults
    if (!config) {
      config = await this.configModel.create({
        user_id: userId,
        categories: DEFAULT_CATEGORIES,
        created_at: new Date(),
      });
    }

    return config.categories;
  }

  /**
   * Agrega una categoría personalizada
   */
  async addCategory(userId: string, category: any) {
    const config = await this.configModel.findOneAndUpdate(
      { user_id: userId },
      { $push: { categories: category }, updated_at: new Date() },
      { new: true, upsert: true },
    );

    return config;
  }

  /**
   * Actualiza una categoría existente
   */
  async updateCategory(userId: string, categoryValue: string, updates: any) {
    const config = await this.configModel.findOneAndUpdate(
      {
        user_id: userId,
        "categories.value": categoryValue,
      },
      {
        $set: { "categories.$": updates, updated_at: new Date() },
      },
      { new: true },
    );

    return config;
  }

  /**
   * Elimina una categoría
   */
  async removeCategory(userId: string, categoryValue: string) {
    const config = await this.configModel.findOneAndUpdate(
      { user_id: userId },
      {
        $pull: { categories: { value: categoryValue } },
        updated_at: new Date(),
      },
      { new: true },
    );

    return config;
  }

  /**
   * Obtiene todos los keywords de un usuario
   */
  async getUserKeywords(userId: string) {
    const config = await this.configModel.findOne({ user_id: userId });

    if (!config) {
      return this.getAllDefaultKeywords();
    }

    const keywords: string[] = [];
    config.categories.forEach((cat) => {
      keywords.push(...(cat.keywords || []));
    });

    return [...new Set(keywords)]; // Remover duplicados
  }

  /**
   * Obtiene keywords para una categoría específica
   */
  async getCategoryKeywords(userId: string, categoryValue: string) {
    const config = await this.configModel.findOne({
      user_id: userId,
      "categories.value": categoryValue,
    });

    if (!config) {
      const defaultCat = DEFAULT_CATEGORIES.find(
        (c) => c.value === categoryValue,
      );
      return defaultCat?.keywords || [];
    }

    const category = config.categories.find((c) => c.value === categoryValue);
    return category?.keywords || [];
  }

  /**
   * Obtiene todos los keywords de default
   */
  private getAllDefaultKeywords(): string[] {
    const keywords: string[] = [];
    DEFAULT_CATEGORIES.forEach((cat) => {
      keywords.push(...(cat.keywords || []));
    });
    return [...new Set(keywords)];
  }
}
