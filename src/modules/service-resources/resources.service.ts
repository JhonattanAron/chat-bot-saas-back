import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ContractAsset,
  ContractAssetDocument,
} from "../contracted-assets/contract-assets.schema";
import { UsageService } from "../service-usage/usage.service";
import { CatalogService } from "../services/catalog/service/catalog.service";

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(ContractAsset.name)
    private readonly contractModel: Model<ContractAssetDocument>,
    private readonly usageService: UsageService,
    private readonly productsService: CatalogService,
  ) {}

  async getUserResources(userId: string) {
    const now = new Date();

    const assets = await this.contractModel.find({
      userId,
      status: { $in: ["active", "consumed"] }, // ✅ FIX
      $or: [{ endDate: { $gte: now } }, { type: "one-time" }],
    });

    return this.buildResources(userId, assets);
  }

  private async buildResources(
    userId: string,
    assets: ContractAssetDocument[],
  ) {
    let tokensTotal = 0;
    let creditsTotal = 0;
    let storageTotal = 0;

    const plans: any[] = [];
    const addons: any[] = [];

    for (const asset of assets) {
      const product = await this.productsService.findProductById(
        asset.resourceId,
      );
      if (!product) continue;

      const metadata = product.metadata || {};

      // ✅ PLAN
      if (asset.type === "plan") {
        plans.push({
          ...asset.toObject(),
          planName: product.name, // <-- agregamos el nombre del plan
        });

        tokensTotal += (metadata.tokens || 0) * asset.quantity;
        creditsTotal += (metadata.credits || 0) * asset.quantity;
      }

      // ✅ ADDON
      if (asset.type === "addon") {
        addons.push({
          ...asset.toObject(),
          addonName: product.name, // <-- agregamos nombre del addon
        });

        if (metadata.type === "tokens") {
          tokensTotal += (metadata.quantity || 0) * asset.quantity;
        }

        if (metadata.type === "credits") {
          creditsTotal += (metadata.quantity || 0) * asset.quantity;
        }
      }

      // ✅ ONE-TIME
      if (asset.type === "one-time") {
        if (metadata.type === "tokens") {
          tokensTotal += (metadata.quantity || 0) * asset.quantity;
        }

        if (metadata.type === "credits") {
          creditsTotal += (metadata.quantity || 0) * asset.quantity;
        }

        if (metadata.type === "storage") {
          storageTotal += (metadata.quantity || 0) * asset.quantity;
        }
      }
    }

    const tokensUsed = await this.usageService.getTotalUsed(userId, "tokens");
    const creditsUsed = await this.usageService.getTotalUsed(userId, "credits");

    return {
      tokens: {
        total: tokensTotal,
        used: tokensUsed,
        available: tokensTotal - tokensUsed,
      },
      credits: {
        total: creditsTotal,
        used: creditsUsed,
        available: creditsTotal - creditsUsed,
      },
      storage: {
        total: storageTotal,
        used: 0,
        available: storageTotal,
      },
      plans, // cada plan ahora tiene planName
      addons, // cada addon ahora tiene addonName
    };
  }

  async consumeResource(
    userId: string,
    resource: "tokens" | "credits" | "storage",
    amount: number,
  ) {
    if (amount <= 0) return;

    // 🔹 obtener estado actual
    const resources = await this.getUserResources(userId);

    const resourceData = resources[resource];

    if (!resourceData) {
      throw new Error(`Resource "${resource}" not found`);
    }

    if (resourceData.available < amount) {
      throw new Error(`Not enough ${resource}`);
    }

    // 🔥 registrar consumo real
    await this.usageService.consumeResource(userId, resource, amount);

    return {
      success: true,
      remaining: resourceData.available - amount,
    };
  }
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    if (amount <= 0) return true; // siempre hay suficiente para 0 o negativo

    // 🔹 obtener recursos actuales del usuario
    const resources = await this.getUserResources(userId);

    // 🔹 chequear créditos disponibles
    const creditsAvailable = resources.credits?.available || 0;

    return creditsAvailable >= amount;
  }
}
